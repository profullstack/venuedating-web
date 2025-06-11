-- Test Distance Queries for Places Table
-- This file contains working examples for spatial queries using the correct column names

-- Example coordinates for testing:
-- New York City: -74.0060, 40.7128
-- Los Angeles: -118.2437, 34.0522
-- Chicago: -87.6298, 41.8781
-- San Francisco: -122.4194, 37.7749

-- 1. Find venues within 10 miles of New York City, ordered by distance
SELECT
  id,
  title,
  address,
  city,
  state,
  ST_AsText(location) AS coords,
  ST_Distance(location, ST_MakePoint(-74.0060, 40.7128)::geography) AS distance_meters,
  ROUND((ST_Distance(location, ST_MakePoint(-74.0060, 40.7128)::geography) * 3.28084 / 5280)::numeric, 2) AS distance_miles
FROM
  places
WHERE
  ST_DWithin(
    location,
    ST_MakePoint(-74.0060, 40.7128)::geography,
    16093 -- 10 miles in meters (1 mile ≈ 1609.34 meters)
  )
ORDER BY distance_meters ASC
LIMIT 20;

-- 2. Find venues within 5 miles of San Francisco
SELECT 
  title, 
  address, 
  city,
  ST_AsText(location) as coords,
  ROUND((ST_Distance(location, ST_MakePoint(-122.4194, 37.7749)::geography) * 3.28084 / 5280)::numeric, 2) AS distance_miles
FROM places
WHERE ST_DWithin(
  location,
  ST_MakePoint(-122.4194, 37.7749)::geography,
  8047  -- 5 miles in meters
)
ORDER BY location <-> ST_MakePoint(-122.4194, 37.7749)::geography;

-- 3. Find nearest 10 venues to Chicago (NO RADIUS LIMIT - just closest 10)
-- WARNING: This does NOT enforce a radius - could include venues 100+ miles away
SELECT
  title,
  address,
  city,
  state,
  ST_Distance(location, ST_MakePoint(-87.6298, 41.8781)::geography) as distance_meters,
  ROUND((ST_Distance(location, ST_MakePoint(-87.6298, 41.8781)::geography) * 3.28084 / 5280)::numeric, 2) AS distance_miles
FROM places
WHERE location IS NOT NULL
ORDER BY location <-> ST_MakePoint(-87.6298, 41.8781)::geography
LIMIT 10;

-- 3b. Find venues within 10 miles of Chicago (TRUE RADIUS SEARCH)
SELECT
  title,
  address,
  city,
  state,
  ST_Distance(location, ST_MakePoint(-87.6298, 41.8781)::geography) as distance_meters,
  ROUND((ST_Distance(location, ST_MakePoint(-87.6298, 41.8781)::geography) * 3.28084 / 5280)::numeric, 2) AS distance_miles
FROM places
WHERE ST_DWithin(
  location,
  ST_MakePoint(-87.6298, 41.8781)::geography,
  16093  -- 10 miles in meters
)
ORDER BY distance_meters ASC;

-- 4. Get coordinates as latitude/longitude (from PostGIS location column)
SELECT 
  title,
  ST_Y(location::geometry) as latitude,
  ST_X(location::geometry) as longitude,
  city,
  state
FROM places
WHERE location IS NOT NULL
LIMIT 10;

-- 5. Alternative: Use the separate latitude/longitude columns directly
SELECT 
  title, 
  latitude, 
  longitude,
  city,
  state
FROM places
WHERE latitude IS NOT NULL AND longitude IS NOT NULL
LIMIT 10;

-- 6. Count venues by city (to see data distribution)
SELECT 
  city,
  state,
  COUNT(*) as venue_count
FROM places
GROUP BY city, state
ORDER BY venue_count DESC
LIMIT 20;

-- 7. Find venues with ratings above 4.0 within 15 miles of Los Angeles
SELECT
  title,
  address,
  rating,
  reviews,
  ROUND((ST_Distance(location, ST_MakePoint(-118.2437, 34.0522)::geography) * 3.28084 / 5280)::numeric, 2) AS distance_miles
FROM places
WHERE 
  ST_DWithin(
    location,
    ST_MakePoint(-118.2437, 34.0522)::geography,
    24140 -- 15 miles in meters
  )
  AND rating >= 4.0
ORDER BY rating DESC, distance_miles ASC;

-- Distance conversion reference:
-- 1 mile = 1609.34 meters
-- 5 miles = 8047 meters
-- 10 miles = 16093 meters
-- 15 miles = 24140 meters
-- 30 miles = 48280 meters
-- 50 miles = 80467 meters

-- To convert meters to miles in SQL: meters * 3.28084 / 5280
-- To convert miles to meters: miles * 1609.34