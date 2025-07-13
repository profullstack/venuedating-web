-- Seed script for BarCrush app
-- This will populate the database with test data for development

-- Clear existing test data if needed
DELETE FROM public.messages WHERE true;
DELETE FROM public.conversations WHERE true;
DELETE FROM public.matches WHERE true;
DELETE FROM public.venues WHERE true;
DELETE FROM public.profiles WHERE id NOT IN (SELECT id FROM auth.users);

-- Create a default test account for local development
-- Note: This should be run manually in the Supabase SQL editor to create the auth user

/*
-- Run this in Supabase SQL Editor to create the test user with phone authentication:
INSERT INTO auth.users (
  id,
  instance_id,
  phone,
  phone_confirmed_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000test',
  '00000000-0000-0000-0000-000000000000',
  '+15555555555',
  NOW(),
  NOW(),
  '{"provider":"phone","providers":["phone"]}',
  '{"full_name":"Test User"}',
  NOW(),
  NOW()
);
*/

-- Insert the test user profile
INSERT INTO public.profiles (id, full_name, phone_number, phone_verified, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000test', 'Test User', '+15555555555', true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE
SET full_name = EXCLUDED.full_name,
    phone_number = EXCLUDED.phone_number,
    phone_verified = EXCLUDED.phone_verified,
    updated_at = NOW();

-- Insert test user profiles
-- Note: These profiles will be linked to auth.users that already exist
-- For testing, you should create some test users through the Supabase authentication UI first
-- Then copy their UUIDs here
INSERT INTO public.profiles (
  id, 
  display_name, 
  full_name, 
  avatar_url, 
  bio, 
  birth_date, 
  gender, 
  interested_in, 
  location_lat, 
  location_lng, 
  theme_preference
) VALUES 
-- Replace these UUIDs with actual user UUIDs from your auth.users table
('00000000-0000-0000-0000-000000000001', 'jake89', 'Jake Johnson', 'https://randomuser.me/api/portraits/men/32.jpg', 'Coffee enthusiast and bar hopper. Looking for someone who enjoys craft beer!', '1989-04-15', 'male', ARRAY['female'], 37.7749, -122.4194, 'dark'),
('00000000-0000-0000-0000-000000000002', 'emma27', 'Emma Wilson', 'https://randomuser.me/api/portraits/women/29.jpg', 'Travel lover, cocktail connoisseur. Let''s find the best happy hour in town!', '1994-08-27', 'female', ARRAY['male'], 37.7833, -122.4167, 'light'),
('00000000-0000-0000-0000-000000000003', 'mike_t', 'Mike Thompson', 'https://randomuser.me/api/portraits/men/52.jpg', 'Whiskey fan and jazz lover. Always looking for new speakeasy bars.', '1991-06-12', 'male', ARRAY['female', 'non-binary'], 37.7694, -122.4862, 'system'),
('00000000-0000-0000-0000-000000000004', 'sarah_j', 'Sarah Jones', 'https://randomuser.me/api/portraits/women/57.jpg', 'Wine enthusiast and foodie. Let''s find a cozy wine bar!', '1993-11-05', 'female', ARRAY['male'], 37.7835, -122.4096, 'dark'),
('00000000-0000-0000-0000-000000000005', 'alex_nb', 'Alex Rivera', 'https://randomuser.me/api/portraits/lego/5.jpg', 'Craft beer expert and trivia night champion. Looking for fun bar scenes.', '1995-03-22', 'non-binary', ARRAY['male', 'female', 'non-binary'], 37.7879, -122.4075, 'dark');

-- Insert test venues
INSERT INTO public.venues (
  name, 
  description, 
  address, 
  venue_type, 
  location, 
  images, 
  rating, 
  price_level, 
  opening_hours, 
  created_by, 
  is_verified
) VALUES 
('The Crafty Brew', 'Hip craft beer bar with over 30 rotating taps and casual atmosphere', '123 Market St, San Francisco, CA', 'pub', ST_SetSRID(ST_MakePoint(-122.4194, 37.7749), 4326), ARRAY['https://images.unsplash.com/photo-1514933651103-005eec06c04b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80'], 4.7, 2, '{"mon":"12:00-23:00","tue":"12:00-23:00","wed":"12:00-23:00","thu":"12:00-00:00","fri":"12:00-01:00","sat":"14:00-01:00","sun":"14:00-22:00"}', '00000000-0000-0000-0000-000000000001', true),

('Moonlight Lounge', 'Upscale cocktail bar with speakeasy vibes and live jazz on weekends', '456 Valencia St, San Francisco, CA', 'bar', ST_SetSRID(ST_MakePoint(-122.4167, 37.7833), 4326), ARRAY['https://images.unsplash.com/photo-1470337458703-46ad1756a187?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80'], 4.9, 3, '{"mon":"17:00-00:00","tue":"17:00-00:00","wed":"17:00-00:00","thu":"17:00-01:00","fri":"17:00-02:00","sat":"17:00-02:00","sun":"17:00-00:00"}', '00000000-0000-0000-0000-000000000002', true),

('Vineyard Wine Bar', 'Cozy spot for wine lovers with extensive selection and cheese pairings', '789 Hayes St, San Francisco, CA', 'wine_bar', ST_SetSRID(ST_MakePoint(-122.4862, 37.7694), 4326), ARRAY['https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80'], 4.5, 3, '{"mon":"16:00-23:00","tue":"16:00-23:00","wed":"16:00-23:00","thu":"16:00-23:00","fri":"16:00-00:00","sat":"14:00-00:00","sun":"14:00-22:00"}', '00000000-0000-0000-0000-000000000003', true),

('Sports Corner', 'Lively sports bar with multiple screens, good beer, and classic bar food', '101 Irving St, San Francisco, CA', 'sports_bar', ST_SetSRID(ST_MakePoint(-122.4096, 37.7835), 4326), ARRAY['https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80'], 4.2, 2, '{"mon":"12:00-00:00","tue":"12:00-00:00","wed":"12:00-00:00","thu":"12:00-00:00","fri":"12:00-01:00","sat":"11:00-01:00","sun":"11:00-00:00"}', '00000000-0000-0000-0000-000000000004', true),

('Rooftop Garden', 'Trendy rooftop bar with panoramic city views and signature cocktails', '555 Mission St, San Francisco, CA', 'cocktail_bar', ST_SetSRID(ST_MakePoint(-122.4075, 37.7879), 4326), ARRAY['https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80'], 4.8, 4, '{"mon":"16:00-23:00","tue":"16:00-23:00","wed":"16:00-23:00","thu":"16:00-00:00","fri":"16:00-01:00","sat":"14:00-01:00","sun":"14:00-22:00"}', '00000000-0000-0000-0000-000000000005', true);

-- Insert test matches
INSERT INTO public.matches (
  user_id_1, 
  user_id_2, 
  venue_id, 
  status, 
  created_at
) VALUES 
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', (SELECT id FROM venues WHERE name = 'The Crafty Brew'), 'matched', NOW() - INTERVAL '3 days'),
('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004', (SELECT id FROM venues WHERE name = 'Moonlight Lounge'), 'matched', NOW() - INTERVAL '2 days'),
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', (SELECT id FROM venues WHERE name = 'Rooftop Garden'), 'matched', NOW() - INTERVAL '1 day'),
('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000005', (SELECT id FROM venues WHERE name = 'Vineyard Wine Bar'), 'pending', NOW() - INTERVAL '12 hours'),
('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000005', (SELECT id FROM venues WHERE name = 'Sports Corner'), 'disliked', NOW() - INTERVAL '5 hours');

-- Insert test conversations
INSERT INTO public.conversations (
  user_id_1, 
  user_id_2, 
  match_id, 
  last_message_text, 
  last_message_at, 
  user_1_unread_count, 
  user_2_unread_count
) VALUES 
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 
 (SELECT id FROM matches WHERE user_id_1 = '00000000-0000-0000-0000-000000000001' AND user_id_2 = '00000000-0000-0000-0000-000000000002'), 
 'Looking forward to meeting you at The Crafty Brew tonight!', NOW() - INTERVAL '6 hours', 0, 1),
 
('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004', 
 (SELECT id FROM matches WHERE user_id_1 = '00000000-0000-0000-0000-000000000003' AND user_id_2 = '00000000-0000-0000-0000-000000000004'), 
 'I love their jazz nights. Perfect for a first date!', NOW() - INTERVAL '1 day', 2, 0),
 
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', 
 (SELECT id FROM matches WHERE user_id_1 = '00000000-0000-0000-0000-000000000001' AND user_id_2 = '00000000-0000-0000-0000-000000000004'), 
 'The view from Rooftop Garden is amazing at sunset', NOW() - INTERVAL '5 hours', 1, 1);

-- Insert test messages
-- Conversation 1: Jake and Emma
WITH conv1 AS (SELECT id FROM conversations WHERE user_id_1 = '00000000-0000-0000-0000-000000000001' AND user_id_2 = '00000000-0000-0000-0000-000000000002')
INSERT INTO public.messages (
  conversation_id, 
  sender_id, 
  message_type, 
  content, 
  created_at,
  is_read
) VALUES 
((SELECT id FROM conv1), '00000000-0000-0000-0000-000000000001', 'text', 'Hey Emma! I saw we matched at The Crafty Brew. Their IPA selection is amazing!', NOW() - INTERVAL '2 days', true),
((SELECT id FROM conv1), '00000000-0000-0000-0000-000000000002', 'text', 'Hi Jake! Yes, I love that place. Their sour beers are my favorite.', NOW() - INTERVAL '2 days' + INTERVAL '30 minutes', true),
((SELECT id FROM conv1), '00000000-0000-0000-0000-000000000001', 'text', 'Definitely! Would you like to meet up there sometime this week?', NOW() - INTERVAL '1 day', true),
((SELECT id FROM conv1), '00000000-0000-0000-0000-000000000002', 'text', 'That sounds great! How about Thursday around 7pm?', NOW() - INTERVAL '1 day' + INTERVAL '45 minutes', true),
((SELECT id FROM conv1), '00000000-0000-0000-0000-000000000001', 'text', 'Thursday works perfectly. Looking forward to meeting you at The Crafty Brew tonight!', NOW() - INTERVAL '6 hours', false);

-- Conversation 2: Mike and Sarah
WITH conv2 AS (SELECT id FROM conversations WHERE user_id_1 = '00000000-0000-0000-0000-000000000003' AND user_id_2 = '00000000-0000-0000-0000-000000000004')
INSERT INTO public.messages (
  conversation_id, 
  sender_id, 
  message_type, 
  content, 
  created_at,
  is_read
) VALUES 
((SELECT id FROM conv2), '00000000-0000-0000-0000-000000000003', 'text', 'Hi Sarah, nice to match with you! Have you been to Moonlight Lounge before?', NOW() - INTERVAL '2 days', true),
((SELECT id FROM conv2), '00000000-0000-0000-0000-000000000004', 'text', 'Hi Mike! Yes, a few times. Their cocktails are incredible.', NOW() - INTERVAL '2 days' + INTERVAL '15 minutes', true),
((SELECT id FROM conv2), '00000000-0000-0000-0000-000000000003', 'text', 'Absolutely! I especially love their Old Fashioned. Would you be interested in checking out their jazz night this weekend?', NOW() - INTERVAL '1 day' + INTERVAL '5 hours', true),
((SELECT id FROM conv2), '00000000-0000-0000-0000-000000000004', 'text', 'That sounds perfect! I love jazz. Saturday night?', NOW() - INTERVAL '1 day' + INTERVAL '6 hours', true),
((SELECT id FROM conv2), '00000000-0000-0000-0000-000000000003', 'text', 'Saturday is great. They have a new band playing that night.', NOW() - INTERVAL '1 day' + INTERVAL '6 hours' + INTERVAL '10 minutes', true),
((SELECT id FROM conv2), '00000000-0000-0000-0000-000000000003', 'text', 'I love their jazz nights. Perfect for a first date!', NOW() - INTERVAL '1 day', false);

-- Conversation 3: Jake and Sarah
WITH conv3 AS (SELECT id FROM conversations WHERE user_id_1 = '00000000-0000-0000-0000-000000000001' AND user_id_2 = '00000000-0000-0000-0000-000000000004')
INSERT INTO public.messages (
  conversation_id, 
  sender_id, 
  message_type, 
  content, 
  created_at,
  is_read
) VALUES 
((SELECT id FROM conv3), '00000000-0000-0000-0000-000000000001', 'text', 'Hey Sarah! Looks like we matched at Rooftop Garden!', NOW() - INTERVAL '1 day', true),
((SELECT id FROM conv3), '00000000-0000-0000-0000-000000000004', 'text', 'Hi Jake! Yes, I love that place. Have you been before?', NOW() - INTERVAL '1 day' + INTERVAL '20 minutes', true),
((SELECT id FROM conv3), '00000000-0000-0000-0000-000000000001', 'text', 'Once for a friend''s birthday. Their cocktails are amazing and the view is incredible.', NOW() - INTERVAL '12 hours', true),
((SELECT id FROM conv3), '00000000-0000-0000-0000-000000000004', 'text', 'Agreed! Would you like to meet there for drinks sometime?', NOW() - INTERVAL '10 hours', false),
((SELECT id FROM conv3), '00000000-0000-0000-0000-000000000001', 'text', 'The view from Rooftop Garden is amazing at sunset', NOW() - INTERVAL '5 hours', false);
