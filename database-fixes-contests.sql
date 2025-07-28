-- Database fixes for BazaarGen Contests System
-- Run this script in your Supabase SQL editor to fix missing constraints and triggers

-- Add missing UNIQUE constraint to contest_votes
ALTER TABLE public.contest_votes 
ADD CONSTRAINT contest_votes_submission_user_unique 
UNIQUE(submission_id, user_email);

-- Create the vote counting function if it doesn't exist
CREATE OR REPLACE FUNCTION update_contest_submission_votes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE contest_submissions 
        SET votes = (
            SELECT COUNT(*) 
            FROM contest_votes 
            WHERE submission_id = NEW.submission_id AND vote_type = 'upvote'
        ) - (
            SELECT COUNT(*) 
            FROM contest_votes 
            WHERE submission_id = NEW.submission_id AND vote_type = 'downvote'
        )
        WHERE id = NEW.submission_id;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE contest_submissions 
        SET votes = (
            SELECT COUNT(*) 
            FROM contest_votes 
            WHERE submission_id = NEW.submission_id AND vote_type = 'upvote'
        ) - (
            SELECT COUNT(*) 
            FROM contest_votes 
            WHERE submission_id = NEW.submission_id AND vote_type = 'downvote'
        )
        WHERE id = NEW.submission_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE contest_submissions 
        SET votes = (
            SELECT COUNT(*) 
            FROM contest_votes 
            WHERE submission_id = OLD.submission_id AND vote_type = 'upvote'
        ) - (
            SELECT COUNT(*) 
            FROM contest_votes 
            WHERE submission_id = OLD.submission_id AND vote_type = 'downvote'
        )
        WHERE id = OLD.submission_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger if it doesn't exist
DROP TRIGGER IF EXISTS trigger_update_contest_submission_votes ON contest_votes;
CREATE TRIGGER trigger_update_contest_submission_votes
    AFTER INSERT OR UPDATE OR DELETE ON contest_votes
    FOR EACH ROW
    EXECUTE FUNCTION update_contest_submission_votes();

-- Enable RLS on contest tables if not already enabled
ALTER TABLE public.contests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contest_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contest_votes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for contests table
DROP POLICY IF EXISTS "Contests are viewable by everyone" ON public.contests;
CREATE POLICY "Contests are viewable by everyone" ON public.contests
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Contests can be created by authenticated users" ON public.contests;
CREATE POLICY "Contests can be created by authenticated users" ON public.contests
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create RLS policies for contest_submissions table
DROP POLICY IF EXISTS "Contest submissions are viewable by everyone" ON public.contest_submissions;
CREATE POLICY "Contest submissions are viewable by everyone" ON public.contest_submissions
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create their own contest submissions" ON public.contest_submissions;
CREATE POLICY "Users can create their own contest submissions" ON public.contest_submissions
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create RLS policies for contest_votes table
DROP POLICY IF EXISTS "Contest votes are viewable by everyone" ON public.contest_votes;
CREATE POLICY "Contest votes are viewable by everyone" ON public.contest_votes
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create their own contest votes" ON public.contest_votes;
CREATE POLICY "Users can create their own contest votes" ON public.contest_votes
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update their own contest votes" ON public.contest_votes;
CREATE POLICY "Users can update their own contest votes" ON public.contest_votes
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Insert sample contests if they don't exist
INSERT INTO public.contests (name, description, type, end_date, created_by, is_active)
VALUES 
    ('Best Healing Card', 'Create the most effective healing card for The Bazaar', 'cards', NOW() + INTERVAL '30 days', 'admin@bazaar.com', true),
    ('Ultimate Skill Collection', 'Design a collection of skills that work together perfectly', 'skills', NOW() + INTERVAL '45 days', 'admin@bazaar.com', true),
    ('Community Choice', 'Submit your best card or skill and let the community decide', 'both', NOW() + INTERVAL '60 days', 'admin@bazaar.com', true)
ON CONFLICT (id) DO NOTHING;

-- Grant necessary permissions
GRANT ALL ON public.contests TO authenticated;
GRANT ALL ON public.contest_submissions TO authenticated;
GRANT ALL ON public.contest_votes TO authenticated;
GRANT USAGE ON SEQUENCE contests_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE contest_submissions_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE contest_votes_id_seq TO authenticated; 