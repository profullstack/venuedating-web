-- Migration: create_places_table
-- Created at: 2025-06-11T05:51:14.910Z

---------------------------------------------------------------------------
-- UP MIGRATION - Changes to apply
---------------------------------------------------------------------------

-- Example up migration:
-- CREATE TABLE new_table (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
--   name TEXT NOT NULL
-- );

-- Enable PostGIS extension for geographical data types
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create places table to store venue data from ValueSERP API
CREATE TABLE places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Basic place information
  title TEXT NOT NULL,
  data_cid TEXT,
  knowledge_graph_id TEXT,
  address TEXT,
  category TEXT,
  
  -- Location data using PostGIS geography type
  coordinates GEOGRAPHY(POINT, 4326), -- GPS coordinates (longitude, latitude)
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
  CONSTRAINT places_reviews_check CHECK (reviews >= 0)
);

-- Create indexes for efficient querying
CREATE INDEX idx_places_city_state ON places(city, state);
CREATE INDEX idx_places_category ON places(category);
CREATE INDEX idx_places_rating ON places(rating DESC);
CREATE INDEX idx_places_created_at ON places(created_at DESC);

-- Create spatial index for geographical queries (PostGIS)
CREATE INDEX idx_places_coordinates ON places USING GIST (coordinates);

-- Create a unique constraint to prevent duplicate places
CREATE UNIQUE INDEX idx_places_unique ON places(title, address, city, state)
WHERE address IS NOT NULL;

-- Create a partial unique index for places without address
CREATE UNIQUE INDEX idx_places_unique_no_address ON places(title, city, state)
WHERE address IS NULL;

-- Add RLS (Row Level Security) policies
ALTER TABLE places ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated users
CREATE POLICY "Allow read access to places" ON places
  FOR SELECT USING (true);

-- Allow insert/update/delete for service role only (for data import scripts)
CREATE POLICY "Allow full access for service role" ON places
  FOR ALL USING (auth.role() = 'service_role');

-- Create a function to insert places with coordinates
CREATE OR REPLACE FUNCTION insert_place_with_coordinates(
  p_title TEXT,
  p_data_cid TEXT DEFAULT NULL,
  p_knowledge_graph_id TEXT DEFAULT NULL,
  p_address TEXT DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_longitude DECIMAL DEFAULT NULL,
  p_latitude DECIMAL DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
  p_state TEXT DEFAULT NULL,
  p_country TEXT DEFAULT 'United States',
  p_rating DECIMAL DEFAULT NULL,
  p_reviews INTEGER DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_sponsored BOOLEAN DEFAULT FALSE,
  p_extensions JSONB DEFAULT NULL,
  p_price TEXT DEFAULT NULL,
  p_price_parsed INTEGER DEFAULT NULL,
  p_price_description TEXT DEFAULT NULL,
  p_position INTEGER DEFAULT NULL,
  p_search_query TEXT DEFAULT 'night clubs',
  p_source TEXT DEFAULT 'valueserp'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  place_id UUID;
  coords GEOGRAPHY(POINT, 4326);
BEGIN
  -- Create coordinates if latitude and longitude are provided
  IF p_longitude IS NOT NULL AND p_latitude IS NOT NULL THEN
    coords := ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326);
  END IF;
  
  -- Insert the place record
  INSERT INTO places (
    title, data_cid, knowledge_graph_id, address, category,
    coordinates, city, state, country, rating, reviews, phone,
    sponsored, extensions, price, price_parsed, price_description,
    position, search_query, source
  ) VALUES (
    p_title, p_data_cid, p_knowledge_graph_id, p_address, p_category,
    coords, p_city, p_state, p_country, p_rating, p_reviews, p_phone,
    p_sponsored, p_extensions, p_price, p_price_parsed, p_price_description,
    p_position, p_search_query, p_source
  )
  ON CONFLICT (title, city, state) WHERE address IS NOT NULL
  DO UPDATE SET
    data_cid = EXCLUDED.data_cid,
    knowledge_graph_id = EXCLUDED.knowledge_graph_id,
    address = EXCLUDED.address,
    category = EXCLUDED.category,
    coordinates = EXCLUDED.coordinates,
    rating = EXCLUDED.rating,
    reviews = EXCLUDED.reviews,
    phone = EXCLUDED.phone,
    sponsored = EXCLUDED.sponsored,
    extensions = EXCLUDED.extensions,
    price = EXCLUDED.price,
    price_parsed = EXCLUDED.price_parsed,
    price_description = EXCLUDED.price_description,
    position = EXCLUDED.position,
    updated_at = NOW()
  RETURNING id INTO place_id;
  
  -- Handle conflict for places without address
  IF place_id IS NULL THEN
    INSERT INTO places (
      title, data_cid, knowledge_graph_id, address, category,
      coordinates, city, state, country, rating, reviews, phone,
      sponsored, extensions, price, price_parsed, price_description,
      position, search_query, source
    ) VALUES (
      p_title, p_data_cid, p_knowledge_graph_id, p_address, p_category,
      coords, p_city, p_state, p_country, p_rating, p_reviews, p_phone,
      p_sponsored, p_extensions, p_price, p_price_parsed, p_price_description,
      p_position, p_search_query, p_source
    )
    ON CONFLICT (title, city, state) WHERE address IS NULL
    DO UPDATE SET
      data_cid = EXCLUDED.data_cid,
      knowledge_graph_id = EXCLUDED.knowledge_graph_id,
      category = EXCLUDED.category,
      coordinates = EXCLUDED.coordinates,
      rating = EXCLUDED.rating,
      reviews = EXCLUDED.reviews,
      phone = EXCLUDED.phone,
      sponsored = EXCLUDED.sponsored,
      extensions = EXCLUDED.extensions,
      price = EXCLUDED.price,
      price_parsed = EXCLUDED.price_parsed,
      price_description = EXCLUDED.price_description,
      position = EXCLUDED.position,
      updated_at = NOW()
    RETURNING id INTO place_id;
  END IF;
  
  RETURN place_id;
END;
$$;

---------------------------------------------------------------------------
-- DOWN MIGRATION - How to revert the changes (for rollbacks)
---------------------------------------------------------------------------

-- Drop the places table and all associated indexes and policies
DROP TABLE IF EXISTS places CASCADE;

