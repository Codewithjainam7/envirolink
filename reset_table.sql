-- DANGER: THIS WILL DELETE ALL PROFILE DATA
-- Run this in Supabase SQL Editor to clean slate and recreate properly

-- 1. CLEANUP (Drop everything) ---------------------------------------
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.increment_points(uuid, int);
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 2. RECREATE TABLE (Correct Schema) ---------------------------------
CREATE TABLE public.profiles (
    id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    first_name text,
    last_name text,
    avatar_url text,
    points integer DEFAULT 0,
    reports_submitted integer DEFAULT 0,
    reports_resolved integer DEFAULT 0,
    updated_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. SECURITY (RLS) --------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles 
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles 
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles 
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 4. AUTOMATION (Triggers) -------------------------------------------
-- Function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (
        id, 
        first_name, 
        last_name, 
        avatar_url, 
        points, 
        reports_submitted, 
        reports_resolved
    )
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
        '',
        COALESCE(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', ''),
        0,
        0,
        0
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5. POINTS SYSTEM (RPC Function) ------------------------------------
CREATE OR REPLACE FUNCTION increment_points(
  row_id uuid,
  points_to_add int
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET 
    points = COALESCE(points, 0) + points_to_add,
    reports_submitted = COALESCE(reports_submitted, 0) + 1
  WHERE id = row_id;
END;
$$;
