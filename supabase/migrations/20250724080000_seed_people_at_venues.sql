-- Migration: seed_people_at_venues
-- Created at: 2025-07-24T08:00:00.000Z

-- Add realistic people/users at different San Francisco venues for matching and demo/testing

-- First, let's create some auth users (this would normally be done through Supabase Auth API)
-- For now, we'll create profiles directly with generated UUIDs

-- Insert diverse user profiles assigned to different venues
INSERT INTO public.profiles (
  id,
  created_at,
  updated_at,
  display_name,
  full_name,
  avatar_url,
  bio,
  birth_date,
  gender,
  interested_in,
  location_lat,
  location_lng,
  last_active,
  preferred_radius_km,
  is_verified
) VALUES
  -- The Tipsy Tavern crowd (pub/casual)
  (
    'a1111111-1111-1111-1111-111111111111',
    NOW(),
    NOW(),
    'Alex',
    'Alex Chen',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
    'Software engineer who loves craft beer and live music. Always up for trivia night!',
    '1992-03-15',
    'male',
    ARRAY['female', 'non-binary'],
    37.7749 + (RANDOM() - 0.5) * 0.01,
    -122.4194 + (RANDOM() - 0.5) * 0.01,
    NOW() - INTERVAL '15 minutes',
    15,
    true
  ),
  (
    'a2222222-2222-2222-2222-222222222222',
    NOW(),
    NOW(),
    'Sarah',
    'Sarah Martinez',
    'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face',
    'Marketing manager and beer enthusiast. Love discovering new breweries and live bands.',
    '1989-07-22',
    'female',
    ARRAY['male'],
    37.7749 + (RANDOM() - 0.5) * 0.01,
    -122.4194 + (RANDOM() - 0.5) * 0.01,
    NOW() - INTERVAL '8 minutes',
    12,
    true
  ),
  (
    'a3333333-3333-3333-3333-333333333333',
    NOW(),
    NOW(),
    'Jamie',
    'Jamie Taylor',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face',
    'Graphic designer and music lover. Always down for a good conversation over drinks.',
    '1994-11-08',
    'non-binary',
    ARRAY['male', 'female', 'non-binary'],
    37.7749 + (RANDOM() - 0.5) * 0.01,
    -122.4194 + (RANDOM() - 0.5) * 0.01,
    NOW() - INTERVAL '22 minutes',
    10,
    true
  ),

  -- Skyline Lounge crowd (upscale/sophisticated)
  (
    'b1111111-1111-1111-1111-111111111111',
    NOW(),
    NOW(),
    'Michael',
    'Michael Wong',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
    'Investment banker with a passion for fine cocktails and city views. Seeking meaningful connections.',
    '1987-05-12',
    'male',
    ARRAY['female'],
    37.7749 + (RANDOM() - 0.5) * 0.01,
    -122.4194 + (RANDOM() - 0.5) * 0.01,
    NOW() - INTERVAL '5 minutes',
    20,
    true
  ),
  (
    'b2222222-2222-2222-2222-222222222222',
    NOW(),
    NOW(),
    'Elena',
    'Elena Rossi',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face',
    'Art curator who appreciates the finer things in life. Love rooftop bars and deep conversations.',
    '1990-09-18',
    'female',
    ARRAY['male', 'female'],
    37.7749 + (RANDOM() - 0.5) * 0.01,
    -122.4194 + (RANDOM() - 0.5) * 0.01,
    NOW() - INTERVAL '12 minutes',
    18,
    true
  ),
  (
    'b3333333-3333-3333-3333-333333333333',
    NOW(),
    NOW(),
    'David',
    'David Kim',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face',
    'Tech entrepreneur and cocktail connoisseur. Looking for someone who shares my ambition.',
    '1985-12-03',
    'male',
    ARRAY['female'],
    37.7749 + (RANDOM() - 0.5) * 0.01,
    -122.4194 + (RANDOM() - 0.5) * 0.01,
    NOW() - INTERVAL '18 minutes',
    25,
    true
  ),
  (
    'b4444444-4444-4444-4444-444444444444',
    NOW(),
    NOW(),
    'Jordan',
    'Jordan Smith',
    'https://images.unsplash.com/photo-1463453091185-61582044d556?w=400&h=400&fit=crop&crop=face',
    'Photographer and craft cocktail enthusiast. Always looking for the perfect shot and perfect drink.',
    '1988-07-11',
    'male',
    ARRAY['female', 'non-binary'],
    37.7749 + (RANDOM() - 0.5) * 0.01,
    -122.4194 + (RANDOM() - 0.5) * 0.01,
    NOW() - INTERVAL '30 minutes',
    18,
    true
  ),

  -- Vineyard Wine Bar crowd (wine lovers/sophisticated)
  (
    'c1111111-1111-1111-1111-111111111111',
    NOW(),
    NOW(),
    'Sophia',
    'Sophia Anderson',
    'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=400&fit=crop&crop=face',
    'Wine sommelier and food blogger. Always exploring new vintages and cuisines.',
    '1988-04-25',
    'female',
    ARRAY['male'],
    37.7749 + (RANDOM() - 0.5) * 0.01,
    -122.4194 + (RANDOM() - 0.5) * 0.01,
    NOW() - INTERVAL '7 minutes',
    15,
    true
  ),
  (
    'c2222222-2222-2222-2222-222222222222',
    NOW(),
    NOW(),
    'Lucas',
    'Lucas Brown',
    'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop&crop=face',
    'Chef and wine enthusiast. Love pairing great food with perfect wines and good company.',
    '1991-08-14',
    'male',
    ARRAY['female', 'non-binary'],
    37.7749 + (RANDOM() - 0.5) * 0.01,
    -122.4194 + (RANDOM() - 0.5) * 0.01,
    NOW() - INTERVAL '25 minutes',
    12,
    true
  ),
  (
    'c3333333-3333-3333-3333-333333333333',
    NOW(),
    NOW(),
    'Priya',
    'Priya Sharma',
    'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=400&h=400&fit=crop&crop=face',
    'Data scientist and yoga instructor. Love balancing work and wellness with good company.',
    '1991-03-28',
    'female',
    ARRAY['male'],
    37.7749 + (RANDOM() - 0.5) * 0.01,
    -122.4194 + (RANDOM() - 0.5) * 0.01,
    NOW() - INTERVAL '14 minutes',
    15,
    true
  ),

  -- The Brew House crowd (craft beer enthusiasts)
  (
    'd1111111-1111-1111-1111-111111111111',
    NOW(),
    NOW(),
    'Maya',
    'Maya Patel',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=face',
    'Craft beer brewer and outdoor enthusiast. Love trying new IPAs and hiking on weekends.',
    '1993-06-30',
    'female',
    ARRAY['male', 'female'],
    37.7749 + (RANDOM() - 0.5) * 0.01,
    -122.4194 + (RANDOM() - 0.5) * 0.01,
    NOW() - INTERVAL '11 minutes',
    20,
    true
  ),
  (
    'd2222222-2222-2222-2222-222222222222',
    NOW(),
    NOW(),
    'Ryan',
    'Ryan Johnson',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop&crop=face',
    'Brewery tour guide and beer geek. Always down to share a flight and talk hops.',
    '1986-10-07',
    'male',
    ARRAY['female'],
    37.7749 + (RANDOM() - 0.5) * 0.01,
    -122.4194 + (RANDOM() - 0.5) * 0.01,
    NOW() - INTERVAL '19 minutes',
    18,
    true
  ),

  -- Neon Nights crowd (nightclub/party scene)
  (
    'e1111111-1111-1111-1111-111111111111',
    NOW(),
    NOW(),
    'Zoe',
    'Zoe Garcia',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=400&fit=crop&crop=face',
    'DJ and music producer. Love dancing until sunrise and connecting through music.',
    '1995-01-20',
    'female',
    ARRAY['male', 'female', 'non-binary'],
    37.7749 + (RANDOM() - 0.5) * 0.01,
    -122.4194 + (RANDOM() - 0.5) * 0.01,
    NOW() - INTERVAL '3 minutes',
    25,
    true
  ),
  (
    'e2222222-2222-2222-2222-222222222222',
    NOW(),
    NOW(),
    'Carlos',
    'Carlos Rivera',
    'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=400&h=400&fit=crop&crop=face',
    'Dance instructor and nightlife enthusiast. Looking for someone who loves to move to the beat.',
    '1990-02-14',
    'male',
    ARRAY['female'],
    37.7749 + (RANDOM() - 0.5) * 0.01,
    -122.4194 + (RANDOM() - 0.5) * 0.01,
    NOW() - INTERVAL '6 minutes',
    22,
    true
  ),
  (
    'e3333333-3333-3333-3333-333333333333',
    NOW(),
    NOW(),
    'Taylor',
    'Taylor Lee',
    'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=400&fit=crop&crop=face',
    'Fashion designer who loves the nightlife scene. Always dressed to impress and ready to dance.',
    '1992-12-05',
    'non-binary',
    ARRAY['male', 'female', 'non-binary'],
    37.7749 + (RANDOM() - 0.5) * 0.01,
    -122.4194 + (RANDOM() - 0.5) * 0.01,
    NOW() - INTERVAL '9 minutes',
    20,
    true
  )
ON CONFLICT (id) DO UPDATE SET
  updated_at = EXCLUDED.updated_at,
  display_name = EXCLUDED.display_name,
  full_name = EXCLUDED.full_name,
  avatar_url = EXCLUDED.avatar_url,
  bio = EXCLUDED.bio,
  birth_date = EXCLUDED.birth_date,
  gender = EXCLUDED.gender,
  interested_in = EXCLUDED.interested_in,
  location_lat = EXCLUDED.location_lat,
  location_lng = EXCLUDED.location_lng,
  last_active = EXCLUDED.last_active,
  preferred_radius_km = EXCLUDED.preferred_radius_km,
  is_verified = EXCLUDED.is_verified;

-- Create a function to simulate people being "at" venues
-- This creates a temporary table to track who is currently at which venue
CREATE TABLE IF NOT EXISTS public.venue_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  venue_id UUID REFERENCES public.venues(id) ON DELETE CASCADE,
  checked_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  checked_out_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user_id, venue_id, checked_in_at)
);

-- Enable RLS for venue_attendance
ALTER TABLE public.venue_attendance ENABLE ROW LEVEL SECURITY;

-- Create policy for venue attendance
CREATE POLICY "Venue attendance is viewable by all users" 
  ON public.venue_attendance 
  FOR SELECT 
  TO authenticated, anon
  USING (true);

-- Insert current venue attendance (people currently at venues)
INSERT INTO public.venue_attendance (user_id, venue_id, checked_in_at, is_active)
SELECT 
  p.id as user_id,
  v.id as venue_id,
  NOW() - INTERVAL '30 minutes' + (RANDOM() * INTERVAL '25 minutes') as checked_in_at,
  true as is_active
FROM public.profiles p
CROSS JOIN public.venues v
WHERE 
  -- The Tipsy Tavern
  (p.id IN ('a1111111-1111-1111-1111-111111111111', 'a2222222-2222-2222-2222-222222222222', 'a3333333-3333-3333-3333-333333333333') AND v.name = 'The Tipsy Tavern')
  OR
  -- Skyline Lounge  
  (p.id IN ('b1111111-1111-1111-1111-111111111111', 'b2222222-2222-2222-2222-222222222222', 'b3333333-3333-3333-3333-333333333333', 'b4444444-4444-4444-4444-444444444444') AND v.name = 'Skyline Lounge')
  OR
  -- Vineyard Wine Bar
  (p.id IN ('c1111111-1111-1111-1111-111111111111', 'c2222222-2222-2222-2222-222222222222', 'c3333333-3333-3333-3333-333333333333') AND v.name = 'Vineyard Wine Bar')
  OR
  -- The Brew House
  (p.id IN ('d1111111-1111-1111-1111-111111111111', 'd2222222-2222-2222-2222-222222222222') AND v.name = 'The Brew House')
  OR
  -- Neon Nights
  (p.id IN ('e1111111-1111-1111-1111-111111111111', 'e2222222-2222-2222-2222-222222222222', 'e3333333-3333-3333-3333-333333333333') AND v.name = 'Neon Nights')
ON CONFLICT (user_id, venue_id, checked_in_at) DO NOTHING;

-- Create a function to get people count at venues
CREATE OR REPLACE FUNCTION public.get_venue_people_count(venue_id_param UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM public.venue_attendance va
    WHERE va.venue_id = venue_id_param 
    AND va.is_active = true
    AND va.checked_out_at IS NULL
    AND va.checked_in_at > NOW() - INTERVAL '2 hours'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_venue_people_count TO authenticated, anon;

-- Create a function to get people at a venue (for matching)
CREATE OR REPLACE FUNCTION public.get_people_at_venue(venue_id_param UUID)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  age INTEGER,
  checked_in_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.display_name,
    p.avatar_url,
    p.bio,
    EXTRACT(YEAR FROM AGE(p.birth_date))::INTEGER as age,
    va.checked_in_at
  FROM public.venue_attendance va
  JOIN public.profiles p ON p.id = va.user_id
  WHERE va.venue_id = venue_id_param 
  AND va.is_active = true
  AND va.checked_out_at IS NULL
  AND va.checked_in_at > NOW() - INTERVAL '2 hours'
  ORDER BY va.checked_in_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_people_at_venue TO authenticated, anon;

-- Add some indexes for performance
CREATE INDEX IF NOT EXISTS idx_venue_attendance_venue_id ON public.venue_attendance(venue_id);
CREATE INDEX IF NOT EXISTS idx_venue_attendance_user_id ON public.venue_attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_venue_attendance_active ON public.venue_attendance(is_active, checked_out_at);
CREATE INDEX IF NOT EXISTS idx_profiles_location ON public.profiles(location_lat, location_lng);

-- Add a comment
COMMENT ON TABLE public.venue_attendance IS 'Tracks when users check in/out of venues for real-time matching';
COMMENT ON FUNCTION public.get_venue_people_count IS 'Returns the number of people currently at a venue';
COMMENT ON FUNCTION public.get_people_at_venue IS 'Returns profiles of people currently at a venue for matching';
