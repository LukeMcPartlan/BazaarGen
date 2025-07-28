-- Disable RLS completely for testing
-- Run this script in your Supabase SQL editor

-- Disable RLS on all contest tables
ALTER TABLE public.contests DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.contest_submissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.contest_votes DISABLE ROW LEVEL SECURITY;

-- Grant all permissions to everyone
GRANT ALL ON public.contests TO anon;
GRANT ALL ON public.contest_submissions TO anon;
GRANT ALL ON public.contest_votes TO anon;
GRANT ALL ON public.contests TO authenticated;
GRANT ALL ON public.contest_submissions TO authenticated;
GRANT ALL ON public.contest_votes TO authenticated;

-- Grant sequence permissions
GRANT USAGE ON SEQUENCE contests_id_seq TO anon;
GRANT USAGE ON SEQUENCE contest_submissions_id_seq TO anon;
GRANT USAGE ON SEQUENCE contest_votes_id_seq TO anon;
GRANT USAGE ON SEQUENCE contests_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE contest_submissions_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE contest_votes_id_seq TO authenticated;

-- Verify RLS is disabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('contests', 'contest_submissions', 'contest_votes'); 