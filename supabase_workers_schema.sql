-- Workers Table for EnviroLink
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS workers (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    address TEXT,
    zone TEXT,
    experience TEXT,
    vehicle_type TEXT DEFAULT 'none',
    status TEXT DEFAULT 'pending_approval' CHECK (status IN ('pending_approval', 'approved', 'rejected', 'active', 'inactive')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to insert (for registration)
CREATE POLICY "Allow insert for registration" ON workers
    FOR INSERT
    WITH CHECK (true);

-- Policy: Allow service role and authenticated users to read all
CREATE POLICY "Allow read for all" ON workers
    FOR SELECT
    USING (true);

-- Policy: Allow service role to update
CREATE POLICY "Allow update for all" ON workers
    FOR UPDATE
    USING (true);

-- Create index for faster status queries
CREATE INDEX idx_workers_status ON workers(status);
CREATE INDEX idx_workers_email ON workers(email);
