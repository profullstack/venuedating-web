-- Create user_filters table to store user filter preferences
CREATE TABLE IF NOT EXISTS user_filters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  interested_in TEXT NOT NULL DEFAULT 'girls' CHECK (interested_in IN ('girls', 'boys', 'both')),
  location TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  distance_km INTEGER NOT NULL DEFAULT 40 CHECK (distance_km > 0 AND distance_km <= 100),
  min_age INTEGER NOT NULL DEFAULT 20 CHECK (min_age >= 18 AND min_age <= 65),
  max_age INTEGER NOT NULL DEFAULT 28 CHECK (max_age >= 18 AND max_age <= 65 AND max_age >= min_age),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one filter record per user
  UNIQUE(user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_filters_user_id ON user_filters(user_id);
CREATE INDEX IF NOT EXISTS idx_user_filters_location ON user_filters(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Enable RLS (Row Level Security)
ALTER TABLE user_filters ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own filters" ON user_filters
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own filters" ON user_filters
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own filters" ON user_filters
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own filters" ON user_filters
  FOR DELETE USING (auth.uid() = user_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_filters_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_filters_updated_at
  BEFORE UPDATE ON user_filters
  FOR EACH ROW
  EXECUTE FUNCTION update_user_filters_updated_at();

-- Add comment
COMMENT ON TABLE user_filters IS 'Stores user filter preferences for discover and matching pages';
