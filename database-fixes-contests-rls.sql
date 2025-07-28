-- Fix RLS policies for contest tables
-- Run this script in your Supabase SQL editor

-- First, let's check what policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename IN ('contests', 'contest_submissions', 'contest_votes');

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Contests are viewable by everyone" ON public.contests;
DROP POLICY IF EXISTS "Contests can be created by authenticated users" ON public.contests;
DROP POLICY IF EXISTS "Contest submissions are viewable by everyone" ON public.contest_submissions;
DROP POLICY IF EXISTS "Users can create their own contest submissions" ON public.contest_submissions;
DROP POLICY IF EXISTS "Contest votes are viewable by everyone" ON public.contest_votes;
DROP POLICY IF EXISTS "Users can create their own contest votes" ON public.contest_votes;
DROP POLICY IF EXISTS "Users can update their own contest votes" ON public.contest_votes;

-- Disable RLS temporarily to allow all operations
ALTER TABLE public.contests DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.contest_submissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.contest_votes DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE public.contests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contest_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contest_votes ENABLE ROW LEVEL SECURITY;

-- Create simple, permissive policies for testing
CREATE POLICY "Allow all operations on contests" ON public.contests
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on contest_submissions" ON public.contest_submissions
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on contest_votes" ON public.contest_votes
    FOR ALL USING (true) WITH CHECK (true);

-- Grant all permissions to authenticated users
GRANT ALL ON public.contests TO authenticated;
GRANT ALL ON public.contest_submissions TO authenticated;
GRANT ALL ON public.contest_votes TO authenticated;
GRANT USAGE ON SEQUENCE contests_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE contest_submissions_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE contest_votes_id_seq TO authenticated;

-- Grant all permissions to anon users (for testing)
GRANT ALL ON public.contests TO anon;
GRANT ALL ON public.contest_submissions TO anon;
GRANT ALL ON public.contest_votes TO anon;
GRANT USAGE ON SEQUENCE contests_id_seq TO anon;
GRANT USAGE ON SEQUENCE contest_submissions_id_seq TO anon;
GRANT USAGE ON SEQUENCE contest_votes_id_seq TO anon; 