-- Migration: seed_messages_for_testing
-- Created at: 2025-08-07T09:58:00.000Z
-- Seed sample conversations and messages for testing chat functionality

-- Note: This migration assumes you have existing user profiles in the system
-- Replace the UUIDs below with actual user IDs from your auth.users table

-- First, let's create some sample conversations
-- You'll need to replace these UUIDs with actual user IDs from your database

-- Sample conversation 1: Between current user and another user
INSERT INTO public.conversations (
  id,
  user_id_1,
  user_id_2,
  match_id,
  last_message_text,
  last_message_at,
  user_1_unread_count,
  user_2_unread_count,
  is_active,
  created_at,
  updated_at
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  '0ffc9988-f55a-499b-85a0-4c4dd8e4966e', -- Replace with your current user ID
  '336192fe-eec5-4952-bbea-b0387a227dd4', -- Replace with Alex Chen's ID or another user
  NULL,
  'That sounds amazing! I love craft beer too 🍺',
  NOW() - INTERVAL '2 hours',
  0,
  1,
  true,
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '2 hours'
);

-- Sample conversation 2: Between current user and another user
INSERT INTO public.conversations (
  id,
  user_id_1,
  user_id_2,
  match_id,
  last_message_text,
  last_message_at,
  user_1_unread_count,
  user_2_unread_count,
  is_active,
  created_at,
  updated_at
) VALUES (
  '22222222-2222-2222-2222-222222222222',
  '0ffc9988-f55a-499b-85a0-4c4dd8e4966e', -- Replace with your current user ID
  '12345678-1234-1234-1234-123456789012', -- Replace with another user ID
  NULL,
  'See you at 8pm! 😊',
  NOW() - INTERVAL '30 minutes',
  2,
  0,
  true,
  NOW() - INTERVAL '3 days',
  NOW() - INTERVAL '30 minutes'
);

-- Sample messages for conversation 1
INSERT INTO public.messages (
  id,
  conversation_id,
  sender_id,
  message_type,
  content,
  is_read,
  read_at,
  created_at,
  updated_at
) VALUES 
-- Initial messages (older)
(
  'msg-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-111111111111',
  '0ffc9988-f55a-499b-85a0-4c4dd8e4966e', -- Current user sends first
  'text',
  'Hey! I saw we matched. How''s your evening going?',
  true,
  NOW() - INTERVAL '23 hours',
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '1 day'
),
(
  'msg-1111-1111-1111-111111111112',
  '11111111-1111-1111-1111-111111111111',
  '336192fe-eec5-4952-bbea-b0387a227dd4', -- Alex responds
  'text',
  'Hi there! Going great, just finished work. I see you''re into craft beer - me too! 🍺',
  true,
  NOW() - INTERVAL '22 hours',
  NOW() - INTERVAL '23 hours',
  NOW() - INTERVAL '23 hours'
),
(
  'msg-1111-1111-1111-111111111113',
  '11111111-1111-1111-1111-111111111111',
  '0ffc9988-f55a-499b-85a0-4c4dd8e4966e', -- Current user
  'text',
  'No way! What''s your favorite brewery in the city?',
  true,
  NOW() - INTERVAL '21 hours',
  NOW() - INTERVAL '22 hours',
  NOW() - INTERVAL '22 hours'
),
(
  'msg-1111-1111-1111-111111111114',
  '11111111-1111-1111-1111-111111111111',
  '336192fe-eec5-4952-bbea-b0387a227dd4', -- Alex
  'text',
  'I''m obsessed with Anchor Brewing! Their Steam Beer is incredible. Have you been to their taproom?',
  true,
  NOW() - INTERVAL '20 hours',
  NOW() - INTERVAL '21 hours',
  NOW() - INTERVAL '21 hours'
),
(
  'msg-1111-1111-1111-111111111115',
  '11111111-1111-1111-1111-111111111111',
  '0ffc9988-f55a-499b-85a0-4c4dd8e4966e', -- Current user
  'text',
  'Yes! I was just there last weekend. The tour was amazing. We should check out some breweries together sometime!',
  true,
  NOW() - INTERVAL '19 hours',
  NOW() - INTERVAL '20 hours',
  NOW() - INTERVAL '20 hours'
),
-- Recent unread message
(
  'msg-1111-1111-1111-111111111116',
  '11111111-1111-1111-1111-111111111111',
  '336192fe-eec5-4952-bbea-b0387a227dd4', -- Alex (unread)
  'text',
  'That sounds amazing! I love craft beer too 🍺 How about this weekend? I know a great brewery crawl route in the Mission.',
  false,
  NULL,
  NOW() - INTERVAL '2 hours',
  NOW() - INTERVAL '2 hours'
);

-- Sample messages for conversation 2
INSERT INTO public.messages (
  id,
  conversation_id,
  sender_id,
  message_type,
  content,
  is_read,
  read_at,
  created_at,
  updated_at
) VALUES 
(
  'msg-2222-2222-2222-222222222221',
  '22222222-2222-2222-2222-222222222222',
  '12345678-1234-1234-1234-123456789012', -- Other user starts
  'text',
  'Hey! Thanks for the match. I love your profile pics - especially the one at Golden Gate Park!',
  true,
  NOW() - INTERVAL '3 days',
  NOW() - INTERVAL '3 days',
  NOW() - INTERVAL '3 days'
),
(
  'msg-2222-2222-2222-222222222222',
  '22222222-2222-2222-2222-222222222222',
  '0ffc9988-f55a-499b-85a0-4c4dd8e4966e', -- Current user
  'text',
  'Thank you! That was such a fun day. Do you spend much time in the park?',
  true,
  NOW() - INTERVAL '2 days 20 hours',
  NOW() - INTERVAL '2 days 20 hours',
  NOW() - INTERVAL '2 days 20 hours'
),
(
  'msg-2222-2222-2222-222222222223',
  '22222222-2222-2222-2222-222222222222',
  '12345678-1234-1234-1234-123456789012', -- Other user
  'text',
  'All the time! I love running the trails there. We should meet up for a coffee at the Japanese Tea Garden sometime.',
  true,
  NOW() - INTERVAL '2 days 18 hours',
  NOW() - INTERVAL '2 days 18 hours',
  NOW() - INTERVAL '2 days 18 hours'
),
(
  'msg-2222-2222-2222-222222222224',
  '22222222-2222-2222-2222-222222222222',
  '0ffc9988-f55a-499b-85a0-4c4dd8e4966e', -- Current user
  'text',
  'I''d love that! How about this Saturday around 2pm?',
  true,
  NOW() - INTERVAL '2 days 16 hours',
  NOW() - INTERVAL '2 days 16 hours',
  NOW() - INTERVAL '2 days 16 hours'
),
-- Recent unread messages
(
  'msg-2222-2222-2222-222222222225',
  '22222222-2222-2222-2222-222222222222',
  '12345678-1234-1234-1234-123456789012', -- Other user (unread)
  'text',
  'Perfect! Let''s meet at the main entrance at 2pm.',
  false,
  NULL,
  NOW() - INTERVAL '1 hour',
  NOW() - INTERVAL '1 hour'
),
(
  'msg-2222-2222-2222-222222222226',
  '22222222-2222-2222-2222-222222222222',
  '12345678-1234-1234-1234-123456789012', -- Other user (unread)
  'text',
  'See you at 8pm! 😊',
  false,
  NULL,
  NOW() - INTERVAL '30 minutes',
  NOW() - INTERVAL '30 minutes'
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created_at ON public.messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender_created_at ON public.messages(sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_user_updated_at ON public.conversations(user_id_1, user_id_2, updated_at DESC);

-- Add some helpful comments
COMMENT ON TABLE public.conversations IS 'Stores chat conversations between matched users';
COMMENT ON TABLE public.messages IS 'Stores individual messages within conversations';
COMMENT ON COLUMN public.conversations.user_1_unread_count IS 'Number of unread messages for user_id_1';
COMMENT ON COLUMN public.conversations.user_2_unread_count IS 'Number of unread messages for user_id_2';
COMMENT ON COLUMN public.messages.is_read IS 'Whether the message has been read by the recipient';
