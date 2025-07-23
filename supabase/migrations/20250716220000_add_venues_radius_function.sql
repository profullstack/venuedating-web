-- Create PostGIS extension if not exists
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create or replace the get_venues_within_radius function
CREATE OR REPLACE FUNCTION public.get_venues_within_radius(
  center_lat double precision,
  center_lng double precision,
  radius_km double precision,
  venue_type text DEFAULT NULL,
  min_rating double precision DEFAULT NULL
)
RETURNS SETOF venues
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if the venues table has a location column of type geometry
  -- If not, we'll use lat/lng columns directly
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'venues' 
    AND column_name = 'location' 
    AND table_schema = 'public'
  ) THEN
    -- Use PostGIS with location column
    RETURN QUERY
    SELECT v.*
    FROM venues v
    WHERE 
      -- Filter by distance using PostGIS ST_DWithin
      ST_DWithin(
        v.location::geography,
        ST_SetSRID(ST_MakePoint(center_lng, center_lat), 4326)::geography,
        radius_km * 1000  -- Convert km to meters for ST_DWithin
      )
      -- Apply optional filters if provided
      AND (venue_type IS NULL OR v.type = venue_type)
      AND (min_rating IS NULL OR v.rating >= min_rating)
    ORDER BY 
      ST_Distance(
        v.location::geography,
        ST_SetSRID(ST_MakePoint(center_lng, center_lat), 4326)::geography
      );
  ELSE
    -- Fallback to using lat/lng columns with a simpler calculation
    -- This is less accurate but works without a geometry column
    RETURN QUERY
    SELECT v.*
    FROM venues v
    WHERE 
      -- Simple approximation using bounding box first (for performance)
      (v.lat BETWEEN (center_lat - radius_km/111.0) AND (center_lat + radius_km/111.0))
      AND (v.lng BETWEEN (center_lng - radius_km/111.0/COS(RADIANS(center_lat))) AND (center_lng + radius_km/111.0/COS(RADIANS(center_lat))))
      -- Then more accurate Haversine formula
      AND (
        6371 * acos(
          cos(radians(center_lat)) * cos(radians(v.lat)) * 
          cos(radians(v.lng) - radians(center_lng)) + 
          sin(radians(center_lat)) * sin(radians(v.lat))
        ) <= radius_km
      )
      -- Apply optional filters if provided
      AND (venue_type IS NULL OR v.type = venue_type)
      AND (min_rating IS NULL OR v.rating >= min_rating)
    ORDER BY (
      6371 * acos(
        cos(radians(center_lat)) * cos(radians(v.lat)) * 
        cos(radians(v.lng) - radians(center_lng)) + 
        sin(radians(center_lat)) * sin(radians(v.lat))
      )
    );
  END IF;
END;
$$;

-- Grant execute permission to authenticated and anon users
GRANT EXECUTE ON FUNCTION public.get_venues_within_radius TO authenticated, anon;

-- Add comment to the function
COMMENT ON FUNCTION public.get_venues_within_radius IS 'Find venues within a specified radius (in km) from a center point. Supports filtering by venue type and minimum rating.';
