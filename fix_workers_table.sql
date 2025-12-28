-- FIX: Workers table foreign key constraint issue
-- Run this in Supabase SQL Editor to fix the worker registration problem
-- The issue is that workers.id references auth.users(id), but the auth user
-- may not be fully created when email confirmation is required.

-- Step 1: Drop the foreign key constraint
ALTER TABLE public.workers DROP CONSTRAINT IF EXISTS workers_id_fkey;

-- Step 2: Add a separate user_id column for auth reference (optional, for future use)
-- This allows workers to exist independent of auth confirmation
ALTER TABLE public.workers ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Step 3: Change the id column to auto-generate UUIDs
-- First, we need to alter the default for id
ALTER TABLE public.workers ALTER COLUMN id SET DEFAULT uuid_generate_v4();

-- Now the workers table will:
-- 1. Generate its own UUID for id (not dependent on auth.users)
-- 2. Have an optional user_id column that can link to auth.users when confirmed
-- 3. Allow worker registration even before email confirmation

-- Update RLS policy to ensure workers can still be inserted
DROP POLICY IF EXISTS "Workers can insert during registration" ON public.workers;
CREATE POLICY "Workers can insert during registration" ON public.workers FOR INSERT WITH CHECK (true);

-- Also allow anonymous users to update their own worker profile
DROP POLICY IF EXISTS "Workers can update own profile" ON public.workers;
CREATE POLICY "Workers can update own profile" ON public.workers FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = id);
