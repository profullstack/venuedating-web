-- Migration: create_venues
-- Created at: 2025-07-02T14:29:38.605Z

-- Enable PostGIS extension for geospatial features
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create venues table
CREATE TABLE public.venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  name TEXT NOT NULL,
  description TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT,
  lat FLOAT NOT NULL,
  lng FLOAT NOT NULL,
  location GEOGRAPHY(POINT) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography) STORED,
  images TEXT[],
  opening_hours JSONB,
  phone TEXT,
  website TEXT,
  category TEXT,
  rating FLOAT,
  price_level INTEGER CHECK (price_level BETWEEN 1 AND 4),
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true
);

-- Add index for geospatial queries
CREATE INDEX idx_venues_location ON public.venues USING GIST (location);

-- Add RLS policies
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view venues
CREATE POLICY "Venues are viewable by all users" 
  ON public.venues 
  FOR SELECT 
  TO authenticated 
  USING (is_active = true);

-- Create function to calculate distance between user and venues
CREATE OR REPLACE FUNCTION public.get_nearby_venues(
  user_lat FLOAT,
  user_lng FLOAT,
  radius_km INTEGER DEFAULT 10
) 
RETURNS TABLE (id UUID, name TEXT, distance_km FLOAT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    v.id,
    v.name,
    ST_Distance(
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
      v.location
    ) / 1000 AS distance_km
  FROM
    public.venues v
  WHERE
    ST_DWithin(
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
      v.location,
      radius_km * 1000
    )
    AND v.is_active = true
  ORDER BY
    distance_km ASC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.handle_venue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating timestamps
CREATE TRIGGER set_venues_updated_at
  BEFORE UPDATE ON public.venues
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_venue_updated_at();
