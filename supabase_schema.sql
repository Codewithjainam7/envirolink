-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- PROFILES (Citizens)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade not null primary key,
  email text not null,
  first_name text,
  last_name text,
  full_name text,
  phone text,
  avatar_url text,
  role text default 'citizen' check (role in ('citizen', 'authority', 'worker', 'admin')),
  points int default 0,
  reports_submitted int default 0,
  reports_resolved int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- WORKERS (Sanitation Workers)
create table if not exists public.workers (
  id uuid references auth.users(id) on delete cascade not null primary key,
  first_name text not null,
  last_name text not null,
  email text unique not null,
  phone text,
  address text,
  zone text,
  experience text,
  vehicle_type text default 'none',
  status text default 'pending_approval' check (status in ('pending_approval', 'approved', 'rejected', 'active', 'inactive')),
  joined_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- REPORTS (Waste Issues)
create table if not exists public.reports (
    id uuid default uuid_generate_v4() primary key,
    report_id text unique not null, -- Human readable ID e.g. R-1234
    user_id uuid references auth.users(id) on delete set null, -- Nullable for anonymous
    category text not null check (category in ('illegal_dumping', 'overflowing_bin', 'littering', 'construction_debris', 'e_waste', 'organic_waste', 'hazardous_waste')),
    severity text not null check (severity in ('low', 'medium', 'high', 'critical')),
    status text default 'submitted' check (status in ('submitted', 'under_review', 'assigned', 'in_progress', 'resolved', 'closed', 'rejected')),
    description text,
    latitude double precision not null,
    longitude double precision not null,
    address text not null,
    locality text,
    city text default 'Mumbai',
    is_anonymous boolean default false,
    
    -- SLA & Assignment
    sla_hours int default 24,
    sla_due_at timestamptz,
    is_sla_breach boolean default false,
    assigned_department_id text,
    assigned_department_name text,
    assigned_worker_id uuid references public.workers(id),
    assigned_worker_name text,
    
    -- Resolution
    resolved_at timestamptz,
    resolution_notes text,
    
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- REPORT IMAGES
create table if not exists public.report_images (
    id uuid default uuid_generate_v4() primary key,
    report_id uuid references public.reports(id) on delete cascade,
    url text not null,
    storage_path text not null,
    is_ai_analyzed boolean default false,
    ai_analysis jsonb,
    created_at timestamptz default now()
);

-- CITY STATS (Analytics)
create table if not exists public.city_stats (
    id uuid default uuid_generate_v4() primary key,
    city text unique not null,
    total_reports int default 0,
    resolved_reports int default 0,
    active_reports int default 0,
    resolution_rate double precision default 0,
    avg_resolution_hours double precision default 0,
    updated_at timestamptz default now()
);

-- RLS POLICIES
alter table public.profiles enable row level security;
alter table public.workers enable row level security;
alter table public.reports enable row level security;
alter table public.report_images enable row level security;

-- Profiles: Public read (for leaderboard/display), Self update
create policy "Public profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Workers: Public read (for assignment), Self update
create policy "Workers are viewable by everyone" on public.workers for select using (true);
create policy "Workers can update own profile" on public.workers for update using (auth.uid() = id);
create policy "Workers can insert during registration" on public.workers for insert with check (true);

-- Reports: Public read, Authenticated insert, Public insert (anon)
create policy "Reports are viewable by everyone" on public.reports for select using (true);
create policy "Anyone can insert reports" on public.reports for insert with check (true);
create policy "Users can update own reports" on public.reports for update using (auth.uid() = user_id);

-- Images: Public read, Insert linkage
create policy "Images are viewable by everyone" on public.report_images for select using (true);
create policy "Anyone can insert images" on public.report_images for insert with check (true);

-- STORAGE BUCKET POLICIES (Note: Run these via Storage UI usually, but defined here for ref)
-- bucket: 'report-images'
-- public: true

-- FUNCTIONS & TRIGGERS

-- Handle New User (Auth Hook)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  -- Check metadata to decide role
  if new.raw_user_meta_data->>'role' = 'worker' then
    insert into public.workers (id, email, first_name, last_name, status)
    values (
      new.id,
      new.email,
      coalesce(new.raw_user_meta_data->>'given_name', split_part(new.raw_user_meta_data->>'full_name', ' ', 1), 'Worker'),
      coalesce(new.raw_user_meta_data->>'family_name', split_part(new.raw_user_meta_data->>'full_name', ' ', 2), ''),
      'pending_approval'
    )
    on conflict (id) do nothing;
    return new; 
  else
    -- Default to Citizen Profile
    insert into public.profiles (id, email, full_name, avatar_url, role)
    values (
      new.id,
      new.email,
      coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'Citizen'),
      new.raw_user_meta_data->>'avatar_url',
      'citizen'
    )
    on conflict (id) do nothing;
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new auth users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Auto-generate Report ID (R-XXXX)
create or replace function generate_report_id()
returns trigger as $$
begin
    if new.report_id is null then
        new.report_id := 'R-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
    end if;
    return new;
end;
$$ language plpgsql;

drop trigger if exists set_report_id on public.reports;
create trigger set_report_id
before insert on public.reports
for each row
execute procedure generate_report_id();
