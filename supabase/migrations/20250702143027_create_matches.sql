-- Migration: create_matches
-- Created at: 2025-07-02T14:30:27.605Z

-- Create matches table to store user match relationships
CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id_1 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id_2 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  venue_id UUID REFERENCES public.venues(id) ON DELETE SET NULL,
  matched_at TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('liked', 'matched', 'passed', 'expired')),
  CONSTRAINT unique_user_pair UNIQUE (user_id_1, user_id_2)
);

-- Add RLS policies
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to see their own matches
CREATE POLICY "Users can view their own matches" 
  ON public.matches 
  FOR SELECT 
  USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2);

-- Create policy to allow users to create their own matches
CREATE POLICY "Users can create their own matches" 
  ON public.matches 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id_1);

-- Create policy to allow users to update their own matches
CREATE POLICY "Users can update their own matches" 
  ON public.matches 
  FOR UPDATE 
  USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating timestamps
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.matches
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_updated_at();
