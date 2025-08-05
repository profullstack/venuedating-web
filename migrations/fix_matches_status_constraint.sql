-- Fix matches table status constraint
-- Migration: fix_matches_status_constraint.sql

-- Drop the existing check constraint if it exists
ALTER TABLE matches DROP CONSTRAINT IF EXISTS matches_status_check;

-- Add a new check constraint with the correct status values
ALTER TABLE matches 
ADD CONSTRAINT matches_status_check 
CHECK (status IN ('pending', 'matched', 'disliked', 'unmatched'));

-- Add comment for documentation
COMMENT ON CONSTRAINT matches_status_check ON matches IS 'Ensures status is one of: pending, matched, disliked, unmatched';

-- Create index for faster status queries if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_user_ids ON matches(user_id_1, user_id_2);
