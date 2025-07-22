-- Migration: add_photos_to_places
-- Created at: 2025-07-22T13:08:20.000Z

---------------------------------------------------------------------------
-- UP MIGRATION - Changes to apply
---------------------------------------------------------------------------

-- Add photos column to places table to store array of image objects
ALTER TABLE places ADD COLUMN IF NOT EXISTS photos JSONB DEFAULT '[]'::jsonb;

-- Create index for photos column for better query performance
CREATE INDEX IF NOT EXISTS idx_places_photos ON places USING GIN (photos);

-- Add constraint to ensure photos is always an array
ALTER TABLE places ADD CONSTRAINT places_photos_is_array 
  CHECK (jsonb_typeof(photos) = 'array');

-- Update the insert_place_with_coordinates function to include photos parameter
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
  p_source TEXT DEFAULT 'scaleserp',
  p_photos JSONB DEFAULT '[]'::jsonb
)
RETURNS UUID AS $$
DECLARE
  place_id UUID;
BEGIN
  INSERT INTO places (
    title, latitude, longitude, address, city, state, category,
    rating, reviews, phone, data_cid, knowledge_graph_id, sponsored,
    extensions, price, price_parsed, price_description, position,
    search_query, source, photos
  ) VALUES (
    p_title, p_latitude, p_longitude, p_address, p_city, p_state, p_category,
    p_rating, p_reviews, p_phone, p_data_cid, p_knowledge_graph_id, p_sponsored,
    p_extensions, p_price, p_price_parsed, p_price_description, p_position,
    p_search_query, p_source, p_photos
  )
  RETURNING id INTO place_id;
  
  RETURN place_id;
END;
$$ LANGUAGE plpgsql;
