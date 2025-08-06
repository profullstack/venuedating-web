-- Migration: create_likes_tables_minimal
-- Created at: 2025-08-06T17:18:00.000Z
-- Minimal migration to create just the essential tables

-- Drop existing tables if they exist (to start fresh)
DROP TABLE IF EXISTS public.matches CASCADE;
DROP TABLE IF EXISTS public.user_dislikes CASCADE;
DROP TABLE IF EXISTS public.user_likes CASCADE;

-- Create user_likes table
CREATE TABLE public.user_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  liked_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_dislikes table
CREATE TABLE public.user_dislikes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  disliked_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create matches table
CREATE TABLE public.matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  matched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_dislikes ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies
CREATE POLICY "user_likes_policy" ON user_likes USING (auth.uid() = user_id);
CREATE POLICY "user_dislikes_policy" ON user_dislikes USING (auth.uid() = user_id);
CREATE POLICY "matches_policy" ON matches USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Create basic indexes
CREATE INDEX idx_user_likes_user_id ON user_likes(user_id);
CREATE INDEX idx_user_dislikes_user_id ON user_dislikes(user_id);
CREATE INDEX idx_matches_user1_id ON matches(user1_id);
CREATE INDEX idx_matches_user2_id ON matches(user2_id);
