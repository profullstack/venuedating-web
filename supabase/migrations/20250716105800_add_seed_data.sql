-- Migration: add_seed_data
-- Created at: 2025-07-16T10:58:00.000Z

-- Add seed data for venues, matches, conversations, and messages

-- Seed data for venues
INSERT INTO public.venues (
  id,
  name,
  description,
  address,
  city,
  state,
  postal_code,
  country,
  lat,
  lng,
  images,
  opening_hours,
  phone,
  website,
  category,
  rating,
  price_level,
  is_verified,
  is_active
) VALUES
  (
    '00000000-0000-0000-0000-000000000v01',
    'The Tipsy Tavern',
    'A cozy pub with a wide selection of craft beers and live music on weekends.',
    '123 Main Street',
    'San Francisco',
    'CA',
    '94105',
    'USA',
    37.7749,
    -122.4194,
    ARRAY['https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=1000', 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?q=80&w=1000'],  -- Pub interior photos
    '{"monday": "16:00-00:00", "tuesday": "16:00-00:00", "wednesday": "16:00-00:00", "thursday": "16:00-02:00", "friday": "16:00-02:00", "saturday": "14:00-02:00", "sunday": "14:00-00:00"}',
    '+14155551234',
    'https://tipsytavern.example.com',
    'pub',
    4.7,
    2,
    true,
    true
  ),
  (
    '00000000-0000-0000-0000-000000000v02',
    'Skyline Lounge',
    'Upscale rooftop bar with panoramic city views and signature cocktails.',
    '456 Market Street',
    'San Francisco',
    'CA',
    '94103',
    'USA',
    37.7922,
    -122.4071,
    ARRAY['https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?q=80&w=1000', 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?q=80&w=1000'],  -- Rooftop bar photos
    '{"monday": "17:00-01:00", "tuesday": "17:00-01:00", "wednesday": "17:00-01:00", "thursday": "17:00-02:00", "friday": "17:00-02:00", "saturday": "16:00-02:00", "sunday": "16:00-00:00"}',
    '+14155552345',
    'https://skylinelounge.example.com',
    'lounge',
    4.9,
    3,
    true,
    true
  ),
  (
    '00000000-0000-0000-0000-000000000v03',
    'Vineyard Wine Bar',
    'Intimate wine bar featuring local and international wines with cheese pairings.',
    '789 Valencia Street',
    'San Francisco',
    'CA',
    '94110',
    'USA',
    37.7599,
    -122.4148,
    ARRAY['https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=1000', 'https://images.unsplash.com/photo-1567072379583-c0787ba69786?q=80&w=1000'],  -- Wine bar photos
    '{"monday": "closed", "tuesday": "17:00-23:00", "wednesday": "17:00-23:00", "thursday": "17:00-23:00", "friday": "17:00-00:00", "saturday": "15:00-00:00", "sunday": "15:00-22:00"}',
    '+14155553456',
    'https://vineyardwinebar.example.com',
    'wine_bar',
    4.6,
    3,
    true,
    true
  ),
  (
    '00000000-0000-0000-0000-000000000v04',
    'The Brew House',
    'Microbrewery with house-made craft beers and casual pub food.',
    '321 Clement Street',
    'San Francisco',
    'CA',
    '94118',
    'USA',
    37.7833,
    -122.4637,
    ARRAY['https://images.unsplash.com/photo-1559526324-593bc073d938?q=80&w=1000', 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?q=80&w=1000'],  -- Brewery photos
    '{"monday": "16:00-23:00", "tuesday": "16:00-23:00", "wednesday": "16:00-23:00", "thursday": "16:00-00:00", "friday": "16:00-01:00", "saturday": "12:00-01:00", "sunday": "12:00-22:00"}',
    '+14155554567',
    'https://brewhouse.example.com',
    'brewery',
    4.5,
    2,
    true,
    true
  ),
  (
    '00000000-0000-0000-0000-000000000v05',
    'Neon Nights',
    'Trendy nightclub with top DJs and themed party nights.',
    '555 Folsom Street',
    'San Francisco',
    'CA',
    '94107',
    'USA',
    37.7857,
    -122.3996,
    ARRAY['https://images.unsplash.com/photo-1566737236500-c8ac43014a67?q=80&w=1000', 'https://images.unsplash.com/photo-1571204829887-3b8d69e23af5?q=80&w=1000'],  -- Nightclub photos
    '{"monday": "closed", "tuesday": "closed", "wednesday": "closed", "thursday": "22:00-03:00", "friday": "22:00-04:00", "saturday": "22:00-04:00", "sunday": "21:00-02:00"}',
    '+14155555678',
    'https://neonnights.example.com',
    'nightclub',
    4.3,
    3,
    true,
    true
  )
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    state = EXCLUDED.state,
    postal_code = EXCLUDED.postal_code,
    country = EXCLUDED.country,
    lat = EXCLUDED.lat,
    lng = EXCLUDED.lng,
    images = EXCLUDED.images,
    opening_hours = EXCLUDED.opening_hours,
    phone = EXCLUDED.phone,
    website = EXCLUDED.website,
    category = EXCLUDED.category,
    rating = EXCLUDED.rating,
    price_level = EXCLUDED.price_level,
    is_verified = EXCLUDED.is_verified,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- Seed data for matches
INSERT INTO public.matches (
  id,
  user_id_1,
  user_id_2,
  venue_id,
  status,
  matched_at
) VALUES
  (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a21',  -- Match 1
    '00000000-0000-0000-0000-000000000001', -- Test User 1
    '00000000-0000-0000-0000-000000000002', -- Test User 2
    '00000000-0000-0000-0000-000000000v01', -- The Tipsy Tavern
    'matched',
    NOW() - INTERVAL '2 days'
  ),
  (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',  -- Match 2
    '00000000-0000-0000-0000-000000000002', -- Test User 2
    '00000000-0000-0000-0000-000000000001', -- Test User 1
    '00000000-0000-0000-0000-000000000v01', -- The Tipsy Tavern
    'matched',
    NOW() - INTERVAL '2 days'
  ),
  (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a23',  -- Match 3
    '00000000-0000-0000-0000-000000000001', -- Test User 1
    '00000000-0000-0000-0000-000000000003', -- Test User 3
    '00000000-0000-0000-0000-000000000v02', -- Skyline Lounge
    'matched',
    NOW() - INTERVAL '1 day'
  ),
  (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a24',  -- Match 4
    '00000000-0000-0000-0000-000000000003', -- Test User 3
    '00000000-0000-0000-0000-000000000001', -- Test User 1
    '00000000-0000-0000-0000-000000000v02', -- Skyline Lounge
    'matched',
    NOW() - INTERVAL '1 day'
  ),
  (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a25',  -- Match 5
    '00000000-0000-0000-0000-000000000001', -- Test User 1
    '00000000-0000-0000-0000-000000000004', -- Test User 4
    '00000000-0000-0000-0000-000000000v03', -- Vineyard Wine Bar
    'liked',
    NULL
  ),
  (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a26',  -- Match 6
    '00000000-0000-0000-0000-000000000002', -- Test User 2
    '00000000-0000-0000-0000-000000000003', -- Test User 3
    '00000000-0000-0000-0000-000000000v04', -- The Brew House
    'liked',
    NULL
  ),
  (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a27',  -- Match 7
    '00000000-0000-0000-0000-000000000005', -- Test User 5
    '00000000-0000-0000-0000-000000000001', -- Test User 1
    '00000000-0000-0000-0000-000000000v05', -- Neon Nights
    'liked',
    NULL
  )
ON CONFLICT (user_id_1, user_id_2) DO UPDATE
SET venue_id = EXCLUDED.venue_id,
    status = EXCLUDED.status,
    matched_at = EXCLUDED.matched_at,
    updated_at = NOW();

-- Seed data for conversations
INSERT INTO public.conversations (
  id,
  participant_1,
  participant_2,
  last_message,
  last_message_at
) VALUES
  (
    '00000000-0000-0000-0000-000000000c01',
    '00000000-0000-0000-0000-000000000001', -- Test User 1
    '00000000-0000-0000-0000-000000000002', -- Test User 2
    'Hey, are you going to The Tipsy Tavern tonight?',
    NOW() - INTERVAL '1 hour'
  ),
  (
    '00000000-0000-0000-0000-000000000c02',
    '00000000-0000-0000-0000-000000000001', -- Test User 1
    '00000000-0000-0000-0000-000000000003', -- Test User 3
    'The view at Skyline Lounge was amazing!',
    NOW() - INTERVAL '3 hours'
  )
ON CONFLICT (id) DO UPDATE
SET last_message = EXCLUDED.last_message,
    last_message_at = EXCLUDED.last_message_at,
    updated_at = NOW();

-- Seed data for messages
INSERT INTO public.messages (
  id,
  conversation_id,
  sender_id,
  content,
  read
) VALUES
  (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a41',  -- Message 1
    '00000000-0000-0000-0000-000000000c01', -- Conversation between User 1 and User 2
    '00000000-0000-0000-0000-000000000001', -- Test User 1
    'Hi there! We matched at The Tipsy Tavern.',
    true
  ),
  (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a42',  -- Message 2
    '00000000-0000-0000-0000-000000000c01', -- Conversation between User 1 and User 2
    '00000000-0000-0000-0000-000000000002', -- Test User 2
    'Hey! Yes, I remember. That was a fun night!',
    true
  ),
  (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a43',  -- Message 3
    '00000000-0000-0000-0000-000000000c01', -- Conversation between User 1 and User 2
    '00000000-0000-0000-0000-000000000001', -- Test User 1
    'Would you like to meet up there again sometime?',
    true
  ),
  (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',  -- Message 4
    '00000000-0000-0000-0000-000000000c01', -- Conversation between User 1 and User 2
    '00000000-0000-0000-0000-000000000002', -- Test User 2
    'Definitely! How about this weekend?',
    true
  ),
  (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a45',  -- Message 5
    '00000000-0000-0000-0000-000000000c01', -- Conversation between User 1 and User 2
    '00000000-0000-0000-0000-000000000001', -- Test User 1
    'Hey, are you going to The Tipsy Tavern tonight?',
    false
  ),
  (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a46',  -- Message 6
    '00000000-0000-0000-0000-000000000c02', -- Conversation between User 1 and User 3
    '00000000-0000-0000-0000-000000000003', -- Test User 3
    'Hi! We matched at Skyline Lounge.',
    true
  ),
  (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a47',  -- Message 7
    '00000000-0000-0000-0000-000000000c02', -- Conversation between User 1 and User 3
    '00000000-0000-0000-0000-000000000001', -- Test User 1
    'Hello! Yes, that place has an amazing view!',
    true
  ),
  (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a48',  -- Message 8
    '00000000-0000-0000-0000-000000000c02', -- Conversation between User 1 and User 3
    '00000000-0000-0000-0000-000000000003', -- Test User 3
    'Have you tried their signature cocktails?',
    true
  ),
  (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a49',  -- Message 9
    '00000000-0000-0000-0000-000000000c02', -- Conversation between User 1 and User 3
    '00000000-0000-0000-0000-000000000001', -- Test User 1
    'The view at Skyline Lounge was amazing!',
    false
  )
ON CONFLICT (id) DO UPDATE
SET content = EXCLUDED.content,
    read = EXCLUDED.read,
    updated_at = NOW();

-- Seed data for notifications
INSERT INTO public.notifications (
  id,
  user_id,
  type,
  title,
  message,
  read
) VALUES
  (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a51',  -- Notification 1
    '00000000-0000-0000-0000-000000000001', -- Test User 1
    'match',
    'New Match!',
    'You matched with Test User 2 at The Tipsy Tavern!',
    true
  ),
  (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a52',  -- Notification 2
    '00000000-0000-0000-0000-000000000002', -- Test User 2
    'match',
    'New Match!',
    'You matched with Test User 1 at The Tipsy Tavern!',
    false
  ),
  (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a53',  -- Notification 3
    '00000000-0000-0000-0000-000000000001', -- Test User 1
    'match',
    'New Match!',
    'You matched with Test User 3 at Skyline Lounge!',
    true
  ),
  (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a54',  -- Notification 4
    '00000000-0000-0000-0000-000000000003', -- Test User 3
    'match',
    'New Match!',
    'You matched with Test User 1 at Skyline Lounge!',
    false
  ),
  (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55',  -- Notification 5
    '00000000-0000-0000-0000-000000000001', -- Test User 1
    'message',
    'New Message',
    'Test User 2 sent you a message: "Hey! Yes, I remember. That was a fun night!"',
    true
  ),
  (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a56',  -- Notification 6
    '00000000-0000-0000-0000-000000000002', -- Test User 2
    'message',
    'New Message',
    'Test User 1 sent you a message: "Would you like to meet up there again sometime?"',
    false
  ),
  (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a57',  -- Notification 7
    '00000000-0000-0000-0000-000000000001', -- Test User 1
    'system',
    'Welcome to BarCrush!',
    'Complete your profile to start matching with people at your favorite venues.',
    true
  ),
  (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a58',  -- Notification 8
    '00000000-0000-0000-0000-000000000002', -- Test User 2
    'system',
    'Welcome to BarCrush!',
    'Complete your profile to start matching with people at your favorite venues.',
    true
  ),
  (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a59',  -- Notification 9
    '00000000-0000-0000-0000-000000000003', -- Test User 3
    'system',
    'Welcome to BarCrush!',
    'Complete your profile to start matching with people at your favorite venues.',
    true
  ),
  (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a5a',  -- Notification 10
    '00000000-0000-0000-0000-000000000004', -- Test User 4
    'system',
    'Welcome to BarCrush!',
    'Complete your profile to start matching with people at your favorite venues.',
    true
  ),
  (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a5b',  -- Notification 11
    '00000000-0000-0000-0000-000000000005', -- Test User 5
    'system',
    'Welcome to BarCrush!',
    'Complete your profile to start matching with people at your favorite venues.',
    true
  )
ON CONFLICT (id) DO UPDATE
SET type = EXCLUDED.type,
    title = EXCLUDED.title,
    message = EXCLUDED.message,
    read = EXCLUDED.read,
    updated_at = NOW();
