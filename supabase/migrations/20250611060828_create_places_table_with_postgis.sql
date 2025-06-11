-- Migration: create_places_table_with_postgis
-- Created at: 2025-06-11T06:08:28.000Z

---------------------------------------------------------------------------
-- UP MIGRATION - Changes to apply
---------------------------------------------------------------------------

-- Enable PostGIS extension if not already enabled
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create the places table with PostGIS geography support
CREATE TABLE IF NOT EXISTS places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Basic place information
  title TEXT NOT NULL,
  data_cid TEXT,
  knowledge_graph_id TEXT,
  address TEXT,
  category TEXT,
  
  -- PostGIS geography column for GPS coordinates (WGS84)
  location GEOGRAPHY(POINT, 4326),
  
  -- Fallback latitude/longitude columns for compatibility
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Location metadata
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  country TEXT DEFAULT 'United States',
  
  -- Rating and review data
  rating DECIMAL(3, 2),
  reviews INTEGER,
  
  -- Additional metadata
  phone TEXT,
  sponsored BOOLEAN DEFAULT FALSE,
  extensions JSONB,
  price TEXT,
  price_parsed INTEGER,
  price_description TEXT,
  position INTEGER,
  
  -- Search metadata
  search_query TEXT NOT NULL DEFAULT 'night clubs',
  source TEXT NOT NULL DEFAULT 'valueserp',
  
  -- Constraints for data validation
  CONSTRAINT places_rating_check CHECK (rating >= 0 AND rating <= 5),
  CONSTRAINT places_reviews_check CHECK (reviews >= 0),
  CONSTRAINT places_latitude_check CHECK (latitude >= -90 AND latitude <= 90),
  CONSTRAINT places_longitude_check CHECK (longitude >= -180 AND longitude <= 180)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_places_location ON places USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_places_city_state ON places(city, state);
CREATE INDEX IF NOT EXISTS idx_places_category ON places(category);
CREATE INDEX IF NOT EXISTS idx_places_rating ON places(rating DESC);
CREATE INDEX IF NOT EXISTS idx_places_created_at ON places(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_places_location_fallback ON places(latitude, longitude);

-- Create unique constraints to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_places_unique ON places(title, address, city, state) 
WHERE address IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_places_unique_no_address ON places(title, city, state) 
WHERE address IS NULL;

-- Create a function to automatically update the location geography from lat/lng
CREATE OR REPLACE FUNCTION update_places_location()
RETURNS TRIGGER AS $$
BEGIN
  -- Update location geography when latitude/longitude changes
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.location = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
  END IF;
  
  -- Update updated_at timestamp
  NEW.updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update location and timestamp
DROP TRIGGER IF EXISTS trigger_update_places_location ON places;
CREATE TRIGGER trigger_update_places_location
  BEFORE INSERT OR UPDATE ON places
  FOR EACH ROW
  EXECUTE FUNCTION update_places_location();

-- Create a helper function for inserting places with coordinates
CREATE OR REPLACE FUNCTION insert_place_with_coordinates(
  p_title TEXT,
  p_latitude DECIMAL,
  p_longitude DECIMAL,
  p_address TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
  p_state TEXT DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_rating DECIMAL DEFAULT NULL,
  p_reviews INTEGER DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_data_cid TEXT DEFAULT NULL,
  p_knowledge_graph_id TEXT DEFAULT NULL,
  p_sponsored BOOLEAN DEFAULT FALSE,
  p_extensions JSONB DEFAULT NULL,
  p_price TEXT DEFAULT NULL,
  p_price_parsed INTEGER DEFAULT NULL,
  p_price_description TEXT DEFAULT NULL,
  p_position INTEGER DEFAULT NULL,
  p_search_query TEXT DEFAULT 'night clubs',
  p_source TEXT DEFAULT 'valueserp'
)
RETURNS UUID AS $$
DECLARE
  place_id UUID;
BEGIN
  INSERT INTO places (
    title, latitude, longitude, address, city, state, category,
    rating, reviews, phone, data_cid, knowledge_graph_id, sponsored,
    extensions, price, price_parsed, price_description, position,
    search_query, source
  ) VALUES (
    p_title, p_latitude, p_longitude, p_address, p_city, p_state, p_category,
    p_rating, p_reviews, p_phone, p_data_cid, p_knowledge_graph_id, p_sponsored,
    p_extensions, p_price, p_price_parsed, p_price_description, p_position,
    p_search_query, p_source
  )
  RETURNING id INTO place_id;
  
  RETURN place_id;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security
ALTER TABLE places ENABLE ROW LEVEL SECURITY;

-- Create policies for access control
CREATE POLICY "Allow read access to places" ON places
  FOR SELECT USING (true);

CREATE POLICY "Allow full access for service role" ON places
  FOR ALL USING (auth.role() = 'service_role');

-- Create policy for authenticated users to read places
CREATE POLICY "Allow authenticated users to read places" ON places
  FOR SELECT USING (auth.role() = 'authenticated');

---------------------------------------------------------------------------
-- DOWN MIGRATION - How to revert the changes (for rollbacks)
---------------------------------------------------------------------------

-- Drop the places table and related objects
-- DROP POLICY IF EXISTS "Allow authenticated users to read places" ON places;
-- DROP POLICY IF EXISTS "Allow full access for service role" ON places;
-- DROP POLICY IF EXISTS "Allow read access to places" ON places;
-- DROP FUNCTION IF EXISTS insert_place_with_coordinates;
-- DROP TRIGGER IF EXISTS trigger_update_places_location ON places;
-- DROP FUNCTION IF EXISTS update_places_location;
-- DROP TABLE IF EXISTS places;
-- Note: We don't drop the PostGIS extension as it might be used by other tables
