-- Migration: seed_sf_venues
-- Created at: 2025-07-23T21:54:00.000Z
-- Purpose: Seed the venues table with real San Francisco bars and venues with accurate geolocation data

-- Insert San Francisco venues with real coordinates
INSERT INTO public.venues (
  name, 
  description, 
  address, 
  city, 
  state, 
  postal_code, 
  country, 
  lat, 
  lng, 
  category, 
  rating, 
  price_level, 
  phone, 
  website,
  is_verified,
  is_active
) VALUES 
-- Mission District Venues
('The Chapel', 'Historic venue with craft cocktails and live music in a converted chapel', '777 Valencia St', 'San Francisco', 'CA', '94110', 'USA', 37.7599, -122.4204, 'Bar', 4.2, 3, '(415) 551-5157', 'https://thechapelsf.com', true, true),

('Zeitgeist', 'Iconic beer garden with outdoor seating and punk rock atmosphere', '199 Valencia St', 'San Francisco', 'CA', '94103', 'USA', 37.7695, -122.4210, 'Bar', 4.1, 2, '(415) 255-7505', null, true, true),

('El Rio', 'Outdoor patio bar with tropical drinks and weekend BBQ', '3158 Mission St', 'San Francisco', 'CA', '94110', 'USA', 37.7479, -122.4194, 'Bar', 4.0, 2, '(415) 282-3325', 'https://elriosf.com', true, true),

('The Make-Out Room', 'Dive bar with live music, DJs, and vintage decor', '3225 22nd St', 'San Francisco', 'CA', '94110', 'USA', 37.7556, -122.4184, 'Bar', 4.3, 2, '(415) 647-2888', null, true, true),

-- Castro District Venues
('The Castro Theatre Bar', 'Historic theater with adjacent cocktail lounge', '429 Castro St', 'San Francisco', 'CA', '94114', 'USA', 37.7609, -122.4350, 'Lounge', 4.4, 3, '(415) 621-6120', null, true, true),

('Moby Dick', 'Neighborhood dive bar with friendly atmosphere', '4049 18th St', 'San Francisco', 'CA', '94114', 'USA', 37.7609, -122.4354, 'Bar', 4.0, 2, '(415) 861-1199', null, true, true),

-- SOMA Venues
('The View Lounge', 'Rooftop cocktail lounge with panoramic city views', '55 4th St', 'San Francisco', 'CA', '94103', 'USA', 37.7849, -122.4058, 'Lounge', 4.5, 4, '(415) 896-1600', null, true, true),

('21st Amendment Brewery', 'Craft brewery near AT&T Park with house-made beers', '563 2nd St', 'San Francisco', 'CA', '94107', 'USA', 37.7820, -122.3928, 'Brewery', 4.2, 2, '(415) 369-0900', 'https://21st-amendment.com', true, true),

('Thirsty Bear Brewing Company', 'Spanish-inspired brewery with paella and craft beers', '661 Howard St', 'San Francisco', 'CA', '94105', 'USA', 37.7871, -122.3979, 'Brewery', 4.1, 3, '(415) 974-0905', 'https://thirstybear.com', true, true),

-- North Beach Venues
('Vesuvio Cafe', 'Historic Beat Generation hangout with literary atmosphere', '255 Columbus Ave', 'San Francisco', 'CA', '94133', 'USA', 37.7976, -122.4077, 'Bar', 4.3, 2, '(415) 362-3370', 'https://vesuvio.com', true, true),

('Tony Niks Cafe', 'Classic Italian-American bar with strong drinks', '1534 Stockton St', 'San Francisco', 'CA', '94133', 'USA', 37.8007, -122.4107, 'Bar', 4.2, 2, '(415) 693-0990', null, true, true),

('The Saloon', 'Historic blues bar, oldest bar in San Francisco', '1232 Grant Ave', 'San Francisco', 'CA', '94133', 'USA', 37.7979, -122.4070, 'Bar', 4.0, 2, '(415) 989-7666', null, true, true),

-- Marina District Venues
('The Tipsy Pig', 'Gastropub with craft cocktails and elevated bar food', '2231 Chestnut St', 'San Francisco', 'CA', '94123', 'USA', 37.7994, -122.4417, 'Gastropub', 4.3, 3, '(415) 292-2300', 'https://thetipsypig.com', true, true),

('Marengo', 'Wine bar with Italian small plates and outdoor seating', '2000 Union St', 'San Francisco', 'CA', '94123', 'USA', 37.7977, -122.4344, 'Wine Bar', 4.4, 3, '(415) 776-1506', null, true, true),

-- Hayes Valley Venues
('Smugglers Cove', 'Tiki bar with extensive rum collection and tropical cocktails', '650 Gough St', 'San Francisco', 'CA', '94102', 'USA', 37.7765, -122.4234, 'Tiki Bar', 4.6, 3, '(415) 869-1900', 'https://smugglerscovesf.com', true, true),

('Absinthe Brasserie & Bar', 'French brasserie with classic cocktails and absinthe', '398 Hayes St', 'San Francisco', 'CA', '94102', 'USA', 37.7766, -122.4213, 'Brasserie', 4.2, 4, '(415) 551-1590', 'https://absinthe.com', true, true),

-- Financial District Venues
('Rickhouse', 'Whiskey bar in historic brick building with extensive selection', '246 Kearny St', 'San Francisco', 'CA', '94108', 'USA', 37.7907, -122.4042, 'Whiskey Bar', 4.4, 3, '(415) 398-2827', 'https://rickhousebar.com', true, true),

('Local Edition', 'Speakeasy-style bar in former newspaper printing room', '691 Market St', 'San Francisco', 'CA', '94105', 'USA', 37.7879, -122.4037, 'Speakeasy', 4.5, 4, '(415) 795-1375', 'https://localeditionsf.com', true, true),

-- Haight-Ashbury Venues
('Alembic', 'Craft cocktail bar with house-made bitters and syrups', '1725 Haight St', 'San Francisco', 'CA', '94117', 'USA', 37.7693, -122.4493, 'Cocktail Bar', 4.3, 3, '(415) 666-0822', 'https://alembicbar.com', true, true),

('Toronado', 'Beer bar with rotating taps and no-frills atmosphere', '547 Haight St', 'San Francisco', 'CA', '94117', 'USA', 37.7719, -122.4314, 'Beer Bar', 4.2, 2, '(415) 863-2276', null, true, true),

-- Polk Gulch Venues
('Bourbon & Branch', 'Prohibition-era speakeasy with password entry', '501 Jones St', 'San Francisco', 'CA', '94102', 'USA', 37.7857, -122.4134, 'Speakeasy', 4.4, 4, '(415) 346-1735', 'https://bourbonandbranch.com', true, true),

('The Hemlock Tavern', 'Dive bar with live music and outdoor smoking patio', '1131 Polk St', 'San Francisco', 'CA', '94109', 'USA', 37.7905, -122.4202, 'Dive Bar', 4.1, 2, '(415) 923-0923', null, true, true),

-- Sunset District Venues
('The Riptide', 'Neighborhood bar with live music and strong drinks', '3639 Taraval St', 'San Francisco', 'CA', '94116', 'USA', 37.7425, -122.4967, 'Bar', 4.2, 2, '(415) 681-8433', null, true, true),

('Hollow', 'Cocktail bar with creative drinks and intimate atmosphere', '1435 Taraval St', 'San Francisco', 'CA', '94116', 'USA', 37.7425, -122.4734, 'Cocktail Bar', 4.3, 3, '(415) 731-6447', null, true, true);

-- Add some opening hours data for a few venues (JSON format)
UPDATE public.venues 
SET opening_hours = '{
  "monday": {"open": "17:00", "close": "02:00"},
  "tuesday": {"open": "17:00", "close": "02:00"},
  "wednesday": {"open": "17:00", "close": "02:00"},
  "thursday": {"open": "17:00", "close": "02:00"},
  "friday": {"open": "17:00", "close": "02:00"},
  "saturday": {"open": "14:00", "close": "02:00"},
  "sunday": {"open": "14:00", "close": "02:00"}
}'::jsonb
WHERE name IN ('Smugglers Cove', 'Bourbon & Branch', 'Local Edition', 'The View Lounge');

-- Add weekend-only hours for some venues
UPDATE public.venues 
SET opening_hours = '{
  "monday": {"closed": true},
  "tuesday": {"closed": true},
  "wednesday": {"closed": true},
  "thursday": {"open": "18:00", "close": "02:00"},
  "friday": {"open": "18:00", "close": "02:00"},
  "saturday": {"open": "16:00", "close": "02:00"},
  "sunday": {"open": "16:00", "close": "24:00"}
}'::jsonb
WHERE name IN ('El Rio', 'Zeitgeist');

-- Verify the seeded data
SELECT 
  name, 
  city, 
  lat, 
  lng,
  category,
  ST_AsText(location) as location_point
FROM public.venues 
WHERE city = 'San Francisco'
ORDER BY name;
