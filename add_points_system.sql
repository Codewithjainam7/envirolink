-- Run this in Supabase SQL Editor to add points system to profiles table
-- FIXED: Handles NULL values for last_name

-- First, alter the table to allow NULL in last_name if constraint exists
ALTER TABLE profiles ALTER COLUMN last_name DROP NOT NULL;

-- Add columns if table exists but columns are missing
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS points integer DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS reports_submitted integer DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS reports_resolved integer DEFAULT 0;

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;

-- Create new policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Function to auto-create profile on user signup (handles NULL last_name)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, first_name, last_name, avatar_url, points, reports_submitted, reports_resolved)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
        COALESCE(new.raw_user_meta_data->>'last_name', ''),
        COALESCE(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', ''),
        0,
        0,
        0
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger to auto-create profile on signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Update existing profiles to have 0 points if NULL
UPDATE profiles SET points = 0 WHERE points IS NULL;
UPDATE profiles SET reports_submitted = 0 WHERE reports_submitted IS NULL;
UPDATE profiles SET reports_resolved = 0 WHERE reports_resolved IS NULL;
UPDATE profiles SET last_name = '' WHERE last_name IS NULL;
