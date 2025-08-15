-- Migration: seed_chats_database
-- Created at: 2025-08-08T18:55:00.000Z
-- Description: Seed the chats database with realistic conversations between existing users

-- Check if test users exist, if not create them
DO $$ 
BEGIN
  -- Test User 1: Alex Johnson
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000001') THEN
    INSERT INTO auth.users (
      id, instance_id, phone, phone_confirmed_at, last_sign_in_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000001',
      '00000000-0000-0000-0000-000000000000',
      '+15551234567', NOW(), NOW(),
      '{"provider":"phone","providers":["phone"]}',
      '{"full_name":"Alex Johnson","avatar_url":"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"}',
      NOW() - INTERVAL '30 days', NOW()
    );
  END IF;

  -- Test User 2: Sarah Chen
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000002') THEN
    INSERT INTO auth.users (
      id, instance_id, phone, phone_confirmed_at, last_sign_in_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000002',
      '00000000-0000-0000-0000-000000000000',
      '+15551234568', NOW(), NOW(),
      '{"provider":"phone","providers":["phone"]}',
      '{"full_name":"Sarah Chen","avatar_url":"https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face"}',
      NOW() - INTERVAL '25 days', NOW()
    );
  END IF;

  -- Test User 3: Mike Rodriguez
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000003') THEN
    INSERT INTO auth.users (
      id, instance_id, phone, phone_confirmed_at, last_sign_in_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000003',
      '00000000-0000-0000-0000-000000000000',
      '+15551234569', NOW(), NOW(),
      '{"provider":"phone","providers":["phone"]}',
      '{"full_name":"Mike Rodriguez","avatar_url":"https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"}',
      NOW() - INTERVAL '20 days', NOW()
    );
  END IF;
END $$;

-- Create corresponding profiles for the test users
INSERT INTO public.profiles (
  id, display_name, full_name, avatar_url, bio, birth_date,
  location_lat, location_lng, bypass_otp, created_at, updated_at
) VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'Alex Johnson', 'Alex Johnson',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    'Love exploring new bars and meeting interesting people! 📸🍺',
    '1995-03-15',
    37.7749, -122.4194, -- San Francisco coordinates
    true, -- bypass_otp flag for test account
    NOW() - INTERVAL '30 days', NOW()
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'Sarah Chen', 'Sarah Chen',
    'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    'Wine enthusiast and foodie. Always up for trying new places! 🍷✨',
    '1992-07-22',
    37.7849, -122.4094, -- SF coordinates (slightly different)
    true, -- bypass_otp flag for test account
    NOW() - INTERVAL '25 days', NOW()
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    'Mike Rodriguez', 'Mike Rodriguez',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    'Sports fan and craft cocktail lover. Let''s grab a drink! 🏈🍸',
    '1988-11-08',
    37.7649, -122.4294, -- SF coordinates (slightly different)
    true, -- bypass_otp flag for test account
    NOW() - INTERVAL '20 days', NOW()
  )
ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  full_name = EXCLUDED.full_name,
  avatar_url = EXCLUDED.avatar_url,
  bio = EXCLUDED.bio,
  updated_at = NOW();

-- Create matches between users
INSERT INTO public.matches (
  id, user1_id, user2_id, matched_at, status, created_at, updated_at
) VALUES
  (
    'c0000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001', -- Alex
    '00000000-0000-0000-0000-000000000002', -- Sarah
    NOW() - INTERVAL '5 days', 'active',
    NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'
  ),
  (
    'c0000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000002', -- Sarah
    '00000000-0000-0000-0000-000000000003', -- Mike
    NOW() - INTERVAL '3 days', 'active',
    NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'
  )
ON CONFLICT (id) DO NOTHING;

-- Create conversations between matched users
INSERT INTO public.conversations (
  id, user_id_1, user_id_2, match_id, last_message_text, last_message_at,
  user_1_unread_count, user_2_unread_count, is_active, created_at, updated_at
) VALUES
  (
    'd0000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001', -- Alex
    '00000000-0000-0000-0000-000000000002', -- Sarah
    'c0000000-0000-0000-0000-000000000001',
    'That sounds perfect! See you at 7pm 😊',
    NOW() - INTERVAL '2 hours', 0, 1, true,
    NOW() - INTERVAL '5 days', NOW() - INTERVAL '2 hours'
  ),
  (
    'd0000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000002', -- Sarah
    '00000000-0000-0000-0000-000000000003', -- Mike
    'c0000000-0000-0000-0000-000000000002',
    'I love their wine selection! Have you tried the Pinot Noir?',
    NOW() - INTERVAL '1 day', 1, 0, true,
    NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 day'
  )
ON CONFLICT (id) DO NOTHING;

-- Create realistic messages for conversations
INSERT INTO public.messages (
  id, conversation_id, sender_id, message_type, content, is_read, read_at, created_at, updated_at
) VALUES
  -- Conversation 1: Alex and Sarah
  (
    'e0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001', -- Alex
    'text',
    'Hey Sarah! Great to match with you at The Tipsy Tavern. How did you like it there?',
    true, NOW() - INTERVAL '4 days 23 hours',
    NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'
  ),
  (
    'e0000000-0000-0000-0000-000000000002',
    'd0000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002', -- Sarah
    'text',
    'Hi Alex! I loved the atmosphere there. The live music was amazing! 🎵',
    true, NOW() - INTERVAL '4 days 22 hours',
    NOW() - INTERVAL '4 days 23 hours', NOW() - INTERVAL '4 days 23 hours'
  ),
  (
    'e0000000-0000-0000-0000-000000000003',
    'd0000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001', -- Alex
    'text',
    'Right? I''m a photographer so I really appreciate good ambiance. Did you try their craft beer selection?',
    true, NOW() - INTERVAL '4 days 21 hours',
    NOW() - INTERVAL '4 days 22 hours', NOW() - INTERVAL '4 days 22 hours'
  ),
  (
    'e0000000-0000-0000-0000-000000000004',
    'd0000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002', -- Sarah
    'text',
    'I''m more of a wine person actually! But their beer selection looked impressive. Photography sounds interesting - what do you like to shoot?',
    true, NOW() - INTERVAL '4 days',
    NOW() - INTERVAL '4 days 1 hour', NOW() - INTERVAL '4 days 1 hour'
  ),
  (
    'e0000000-0000-0000-0000-000000000005',
    'd0000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001', -- Alex
    'text',
    'Mostly urban landscapes and street photography. SF has so many great spots! Wine is great too - maybe we could check out that Vineyard Wine Bar sometime?',
    true, NOW() - INTERVAL '3 days 23 hours',
    NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'
  ),
  (
    'e0000000-0000-0000-0000-000000000006',
    'd0000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002', -- Sarah
    'text',
    'That sounds wonderful! I actually love wine tasting. When were you thinking?',
    true, NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '3 days 1 hour', NOW() - INTERVAL '3 days 1 hour'
  ),
  (
    'e0000000-0000-0000-0000-000000000007',
    'd0000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001', -- Alex
    'text',
    'How about this Friday evening? Around 7pm?',
    true, NOW() - INTERVAL '2 days 12 hours',
    NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'
  ),
  (
    'e0000000-0000-0000-0000-000000000008',
    'd0000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002', -- Sarah
    'text',
    'That sounds perfect! See you at 7pm 😊',
    false, NULL,
    NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours'
  ),
  -- Conversation 2: Sarah and Mike
  (
    'e0000000-0000-0000-0000-000000000009',
    'd0000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000003', -- Mike
    'text',
    'Hey Sarah! Saw we both were at Vineyard Wine Bar. What''s your favorite wine there?',
    true, NOW() - INTERVAL '2 days 23 hours',
    NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'
  ),
  (
    'e0000000-0000-0000-0000-000000000010',
    'd0000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000002', -- Sarah
    'text',
    'I love their wine selection! Have you tried the Pinot Noir?',
    false, NULL,
    NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created 
  ON public.messages(conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversations_users 
  ON public.conversations(user_id_1, user_id_2);

-- Update conversation statistics
UPDATE public.conversations 
SET 
  user_1_unread_count = (
    SELECT COUNT(*) FROM public.messages m 
    WHERE m.conversation_id = conversations.id 
    AND m.sender_id = conversations.user_id_2 
    AND m.is_read = false
  ),
  user_2_unread_count = (
    SELECT COUNT(*) FROM public.messages m 
    WHERE m.conversation_id = conversations.id 
    AND m.sender_id = conversations.user_id_1 
    AND m.is_read = false
  );
