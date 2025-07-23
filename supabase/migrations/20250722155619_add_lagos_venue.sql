-- Migration: add_lagos_venue
-- Created at: 2025-07-22T15:56:19.000Z

-- Add Lagos venue to the database

-- Seed data for Lagos venue
INSERT INTO public.venues (
  id,
  name,
  description,
  address,
  city,
  state,
  postal_code,
  country,
  latitude,
  longitude,
  images,
  opening_hours,
  phone,
  website,
  category,
  rating,
  price_level,
  is_verified,
  is_active
) VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a20',  -- Lagos Venue
  'Cubana Lounge',
  'A vibrant nightclub and lounge with great music and atmosphere.',
  '1 Adeola Odeku Street, Victoria Island',
  'Lagos',
  'Lagos State',
  '101233',
  'Nigeria',
  6.5244,
  3.3792,
  ARRAY['https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?q=80&w=1000', 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1000'],  -- Nightclub photos
  '{"monday": "18:00-03:00", "tuesday": "18:00-03:00", "wednesday": "18:00-03:00", "thursday": "18:00-04:00", "friday": "18:00-05:00", "saturday": "18:00-05:00", "sunday": "18:00-03:00"}',
  '+2348012345678',
  'https://cubana.ng',
  'nightclub',
  4.5,
  3,
  true,
  true
);
