-- Migration: create_likes_dislikes_matches_tables
-- Created at: 2025-08-06T17:11:00.000Z

-- Create user_likes table
CREATE TABLE IF NOT EXISTS public.user_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  liked_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, liked_user_id)
);

-- Create user_dislikes table
CREATE TABLE IF NOT EXISTS public.user_dislikes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  disliked_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, disliked_user_id)
);

-- Create matches table
CREATE TABLE IF NOT EXISTS public.matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  matched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'unmatched', 'blocked')),
  last_message_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user1_id, user2_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_likes_user_id ON user_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_likes_liked_user_id ON user_likes(liked_user_id);
CREATE INDEX IF NOT EXISTS idx_user_likes_created_at ON user_likes(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_dislikes_user_id ON user_dislikes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_dislikes_disliked_user_id ON user_dislikes(disliked_user_id);
CREATE INDEX IF NOT EXISTS idx_user_dislikes_created_at ON user_dislikes(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_matches_user1_id ON matches(user1_id);
CREATE INDEX IF NOT EXISTS idx_matches_user2_id ON matches(user2_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_matched_at ON matches(matched_at DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE user_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_dislikes ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_likes
CREATE POLICY "Users can view their own likes" ON user_likes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own likes" ON user_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes" ON user_likes
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for user_dislikes
CREATE POLICY "Users can view their own dislikes" ON user_dislikes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own dislikes" ON user_dislikes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own dislikes" ON user_dislikes
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for matches
CREATE POLICY "Users can view their own matches" ON matches
  FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "System can insert matches" ON matches
  FOR INSERT WITH CHECK (true); -- Matches are created by the system when mutual likes occur

CREATE POLICY "Users can update their own matches" ON matches
  FOR UPDATE USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Create trigger for matches updated_at
CREATE OR REPLACE FUNCTION update_matches_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER matches_updated_at
  BEFORE UPDATE ON matches
  FOR EACH ROW
  EXECUTE FUNCTION update_matches_updated_at();

-- Add constraint to prevent users from liking themselves
ALTER TABLE user_likes ADD CONSTRAINT check_not_self_like 
  CHECK (user_id != liked_user_id);

ALTER TABLE user_dislikes ADD CONSTRAINT check_not_self_dislike 
  CHECK (user_id != disliked_user_id);

ALTER TABLE matches ADD CONSTRAINT check_not_self_match 
  CHECK (user1_id != user2_id);

COMMENT ON TABLE user_likes IS 'Records when users like other users profiles';
COMMENT ON TABLE user_dislikes IS 'Records when users dislike other users profiles';
COMMENT ON TABLE matches IS 'Records when two users have mutual likes (matches)';

COMMENT ON COLUMN matches.status IS 'Status of the match: active, unmatched, blocked';
COMMENT ON COLUMN matches.last_message_at IS 'Timestamp of the last message in this match conversation';
