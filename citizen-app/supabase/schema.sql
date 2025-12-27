-- EnvironmentTech Supabase Database Schema (FIXED)
-- Run this in Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types/enums
CREATE TYPE report_category AS ENUM (
  'illegal_dumping',
  'overflowing_bin',
  'littering',
  'construction_debris',
  'e_waste',
  'organic_waste'
);

CREATE TYPE report_severity AS ENUM (
  'low',
  'medium',
  'high',
  'critical'
);

CREATE TYPE report_status AS ENUM (
  'submitted',
  'under_review',
  'assigned',
  'in_progress',
  'resolved',
  'closed',
  'rejected'
);

CREATE TYPE user_role AS ENUM (
  'citizen',
  'authority',
  'worker',
  'admin'
);

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  role user_role DEFAULT 'citizen',
  points INTEGER DEFAULT 0,
  reports_submitted INTEGER DEFAULT 0,
  reports_resolved INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reports table (FIXED: removed problematic default for report_id)
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id TEXT UNIQUE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  category report_category NOT NULL,
  severity report_severity DEFAULT 'medium',
  status report_status DEFAULT 'submitted',
  description TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  address TEXT NOT NULL,
  locality TEXT NOT NULL,
  city TEXT DEFAULT 'Mumbai',
  is_anonymous BOOLEAN DEFAULT FALSE,
  sla_hours INTEGER DEFAULT 48,
  sla_due_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '48 hours'),
  is_sla_breach BOOLEAN DEFAULT FALSE,
  assigned_department_id TEXT,
  assigned_department_name TEXT,
  assigned_worker_id TEXT,
  assigned_worker_name TEXT,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Report images table
CREATE TABLE report_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  is_ai_analyzed BOOLEAN DEFAULT FALSE,
  ai_analysis JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- City statistics table
CREATE TABLE city_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  city TEXT UNIQUE NOT NULL,
  total_reports INTEGER DEFAULT 0,
  resolved_reports INTEGER DEFAULT 0,
  active_reports INTEGER DEFAULT 0,
  resolution_rate DECIMAL(5,2) DEFAULT 0,
  avg_resolution_hours DECIMAL(10,2) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default city stats
INSERT INTO city_stats (city) VALUES ('Mumbai') ON CONFLICT (city) DO NOTHING;

-- Create indexes for better query performance
CREATE INDEX idx_reports_user_id ON reports(user_id);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_category ON reports(category);
CREATE INDEX idx_reports_location ON reports(latitude, longitude);
CREATE INDEX idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX idx_report_images_report_id ON report_images(report_id);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE city_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for reports (allow anonymous inserts too)
CREATE POLICY "Reports are viewable by everyone" ON reports
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create reports" ON reports
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own reports" ON reports
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for report_images
CREATE POLICY "Report images are viewable by everyone" ON report_images
  FOR SELECT USING (true);

CREATE POLICY "Anyone can add images" ON report_images
  FOR INSERT WITH CHECK (true);

-- RLS Policies for city_stats
CREATE POLICY "City stats are viewable by everyone" ON city_stats
  FOR SELECT USING (true);

-- Function to auto-generate report_id
CREATE OR REPLACE FUNCTION public.generate_report_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.report_id := 'RPT-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(FLOOR(RANDOM() * 99999)::TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto report_id
CREATE TRIGGER set_report_id
  BEFORE INSERT ON reports
  FOR EACH ROW
  WHEN (NEW.report_id IS NULL)
  EXECUTE FUNCTION public.generate_report_id();

-- Function to update profile on auth.users insert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile on signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update city stats
CREATE OR REPLACE FUNCTION public.update_city_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE city_stats SET
    total_reports = (SELECT COUNT(*) FROM reports WHERE city = NEW.city),
    resolved_reports = (SELECT COUNT(*) FROM reports WHERE city = NEW.city AND status IN ('resolved', 'closed')),
    active_reports = (SELECT COUNT(*) FROM reports WHERE city = NEW.city AND status NOT IN ('resolved', 'closed', 'rejected')),
    resolution_rate = COALESCE(
      (SELECT COUNT(*)::DECIMAL FROM reports WHERE city = NEW.city AND status IN ('resolved', 'closed')) /
      NULLIF((SELECT COUNT(*) FROM reports WHERE city = NEW.city), 0) * 100, 0
    ),
    updated_at = NOW()
  WHERE city = NEW.city;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update stats on report changes
CREATE OR REPLACE TRIGGER on_report_change
  AFTER INSERT OR UPDATE ON reports
  FOR EACH ROW EXECUTE FUNCTION public.update_city_stats();
