-- Database setup for BazaarGen Contests System
-- Run this script in your Supabase SQL editor

-- Create contests table
CREATE TABLE IF NOT EXISTS contests (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL CHECK (type IN ('cards', 'skills', 'both')),
    anchor_card JSONB, -- Stores the anchor card data as JSON
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(255), -- User email who created the contest
    is_active BOOLEAN DEFAULT true
);

-- Create contest submissions table
CREATE TABLE IF NOT EXISTS contest_submissions (
    id SERIAL PRIMARY KEY,
    contest_id INTEGER REFERENCES contests(id) ON DELETE CASCADE,
    user_email VARCHAR(255) NOT NULL,
    user_alias VARCHAR(255),
    content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('card', 'skill')),
    item_id INTEGER REFERENCES items(id) ON DELETE CASCADE, -- For card submissions
    skill_id INTEGER REFERENCES skills(id) ON DELETE CASCADE, -- For skill submissions
    votes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure only one of item_id or skill_id is set
    CONSTRAINT check_content_type CHECK (
        (content_type = 'card' AND item_id IS NOT NULL AND skill_id IS NULL) OR
        (content_type = 'skill' AND skill_id IS NOT NULL AND item_id IS NULL)
    ),
    
    -- Ensure an item can only be submitted to one contest
    UNIQUE(item_id),
    UNIQUE(skill_id)
);

-- Create contest votes table
CREATE TABLE IF NOT EXISTS contest_votes (
    id SERIAL PRIMARY KEY,
    submission_id INTEGER REFERENCES contest_submissions(id) ON DELETE CASCADE,
    user_email VARCHAR(255) NOT NULL,
    user_alias VARCHAR(255),
    vote_type VARCHAR(50) DEFAULT 'upvote' CHECK (vote_type IN ('upvote', 'downvote')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one user can only vote once per submission
    UNIQUE(submission_id, user_email)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contests_active ON contests(is_active);
CREATE INDEX IF NOT EXISTS idx_contests_end_date ON contests(end_date);
CREATE INDEX IF NOT EXISTS idx_contest_submissions_contest_id ON contest_submissions(contest_id);
CREATE INDEX IF NOT EXISTS idx_contest_submissions_user_email ON contest_submissions(user_email);
CREATE INDEX IF NOT EXISTS idx_contest_votes_submission_id ON contest_votes(submission_id);
CREATE INDEX IF NOT EXISTS idx_contest_votes_user_email ON contest_votes(user_email);

-- Create a function to update the votes count on contest submissions
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

-- Create trigger to automatically update votes count
DROP TRIGGER IF EXISTS trigger_update_contest_submission_votes ON contest_votes;
CREATE TRIGGER trigger_update_contest_submission_votes
    AFTER INSERT OR UPDATE OR DELETE ON contest_votes
    FOR EACH ROW
    EXECUTE FUNCTION update_contest_submission_votes();

-- Insert some sample contests for testing
INSERT INTO contests (name, description, type, end_date, created_by) VALUES
(
    'Best Healing Card',
    'Create the most innovative and effective healing card for The Bazaar. Focus on unique mechanics and balanced design.',
    'cards',
    NOW() + INTERVAL '30 days',
    'admin@bazaargen.com'
),
(
    'Ultimate Skill Collection',
    'Design a collection of 3-5 skills that work together synergistically. Bonus points for creative combinations!',
    'skills',
    NOW() + INTERVAL '45 days',
    'admin@bazaargen.com'
),
(
    'Community Choice',
    'Open contest for both cards and skills. The community will vote on their favorites!',
    'both',
    NOW() + INTERVAL '60 days',
    'admin@bazaargen.com'
);

-- Enable Row Level Security (RLS)
ALTER TABLE contests ENABLE ROW LEVEL SECURITY;
ALTER TABLE contest_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE contest_votes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for contests (readable by all, writable by authenticated users)
CREATE POLICY "Contests are viewable by everyone" ON contests
    FOR SELECT USING (true);

CREATE POLICY "Contests can be created by authenticated users" ON contests
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Contests can be updated by creator" ON contests
    FOR UPDATE USING (created_by = auth.jwt() ->> 'email');

-- Create RLS policies for contest_submissions
CREATE POLICY "Submissions are viewable by everyone" ON contest_submissions
    FOR SELECT USING (true);

CREATE POLICY "Users can submit to contests" ON contest_submissions
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND user_email = auth.jwt() ->> 'email');

CREATE POLICY "Users can update their own submissions" ON contest_submissions
    FOR UPDATE USING (user_email = auth.jwt() ->> 'email');

-- Create RLS policies for contest_votes
CREATE POLICY "Votes are viewable by everyone" ON contest_votes
    FOR SELECT USING (true);

CREATE POLICY "Users can vote on submissions" ON contest_votes
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND user_email = auth.jwt() ->> 'email');

CREATE POLICY "Users can update their own votes" ON contest_votes
    FOR UPDATE USING (user_email = auth.jwt() ->> 'email');

CREATE POLICY "Users can delete their own votes" ON contest_votes
    FOR DELETE USING (user_email = auth.jwt() ->> 'email');

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated; 