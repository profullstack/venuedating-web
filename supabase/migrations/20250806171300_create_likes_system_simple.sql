-- Migration: create_likes_system_simple
-- Created at: 2025-08-06T17:13:00.000Z
-- Simplified migration to avoid column reference issues

-- Create user_likes table
CREATE TABLE IF NOT EXISTS public.user_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  liked_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_dislikes table
CREATE TABLE IF NOT EXISTS public.user_dislikes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  disliked_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create matches table
CREATE TABLE IF NOT EXISTS public.matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  matched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add unique constraints
ALTER TABLE user_likes ADD CONSTRAINT unique_user_like UNIQUE(user_id, liked_user_id);
ALTER TABLE user_dislikes ADD CONSTRAINT unique_user_dislike UNIQUE(user_id, disliked_user_id);
ALTER TABLE matches ADD CONSTRAINT unique_match UNIQUE(user1_id, user2_id);

-- Add check constraints
ALTER TABLE user_likes ADD CONSTRAINT check_not_self_like CHECK (user_id != liked_user_id);
ALTER TABLE user_dislikes ADD CONSTRAINT check_not_self_dislike CHECK (user_id != disliked_user_id);
ALTER TABLE matches ADD CONSTRAINT check_not_self_match CHECK (user1_id != user2_id);

-- Create indexes
CREATE INDEX idx_user_likes_user_id ON user_likes(user_id);
CREATE INDEX idx_user_likes_liked_user_id ON user_likes(liked_user_id);
CREATE INDEX idx_user_dislikes_user_id ON user_dislikes(user_id);
CREATE INDEX idx_user_dislikes_disliked_user_id ON user_dislikes(disliked_user_id);
CREATE INDEX idx_matches_user1_id ON matches(user1_id);
CREATE INDEX idx_matches_user2_id ON matches(user2_id);

-- Enable RLS
ALTER TABLE user_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_dislikes ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_likes
CREATE POLICY "user_likes_select_policy" ON user_likes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_likes_insert_policy" ON user_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_likes_delete_policy" ON user_likes FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for user_dislikes
CREATE POLICY "user_dislikes_select_policy" ON user_dislikes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_dislikes_insert_policy" ON user_dislikes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_dislikes_delete_policy" ON user_dislikes FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for matches
CREATE POLICY "matches_select_policy" ON matches FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);
CREATE POLICY "matches_insert_policy" ON matches FOR INSERT WITH CHECK (true);
CREATE POLICY "matches_update_policy" ON matches FOR UPDATE USING (auth.uid() = user1_id OR auth.uid() = user2_id);
