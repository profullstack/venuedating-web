-- Migration: create_notifications_table
-- Created at: 2025-08-06T14:10:00.000Z

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('match', 'venue', 'system', 'message')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_notifications_updated_at();

-- Seed notifications data
-- Note: These will be inserted for the first test user in the system
-- In production, notifications would be created by the application logic

-- Get the first user ID for seeding (this is just for development)
DO $$
DECLARE
  test_user_id UUID;
BEGIN
  -- Get the first user from auth.users table
  SELECT id INTO test_user_id FROM auth.users LIMIT 1;
  
  -- Only insert if we have a user
  IF test_user_id IS NOT NULL THEN
    -- Insert sample notifications
    INSERT INTO public.notifications (user_id, type, title, message, read, data, created_at) VALUES
    (test_user_id, 'match', 'New Match!', 'You have a new match with Sarah at The Tipsy Tavern', false, '{"venue_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11", "match_user_name": "Sarah"}', NOW() - INTERVAL '5 minutes'),
    (test_user_id, 'venue', 'Venue Update', 'The Tipsy Tavern is now offering happy hour specials!', false, '{"venue_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11", "venue_name": "The Tipsy Tavern"}', NOW() - INTERVAL '1 hour'),
    (test_user_id, 'match', 'Match Liked You Back', 'Emma liked you back! Start a conversation now.', true, '{"match_user_name": "Emma", "action": "mutual_like"}', NOW() - INTERVAL '2 hours'),
    (test_user_id, 'venue', 'Popular Venue Alert', 'Skyline Lounge is trending tonight with 12 people checked in', false, '{"venue_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12", "venue_name": "Skyline Lounge", "people_count": 12}', NOW() - INTERVAL '3 hours'),
    (test_user_id, 'system', 'Welcome to BarCrush!', 'Complete your profile to start discovering amazing venues and meeting new people.', true, '{"action": "complete_profile"}', NOW() - INTERVAL '1 day'),
    (test_user_id, 'match', 'Someone Likes You', 'You have a new like! Check out who it is.', false, '{"action": "view_likes"}', NOW() - INTERVAL '6 hours'),
    (test_user_id, 'venue', 'Check-in Reminder', 'Don''t forget to check in at venues to meet people nearby!', true, '{"action": "check_in"}', NOW() - INTERVAL '2 days'),
    (test_user_id, 'system', 'Profile Views', 'Your profile has been viewed 5 times this week!', false, '{"view_count": 5, "period": "week"}', NOW() - INTERVAL '12 hours'),
    (test_user_id, 'match', 'Message Received', 'You have a new message from Alex', false, '{"match_user_name": "Alex", "message_preview": "Hey! How was your weekend?"}', NOW() - INTERVAL '30 minutes'),
    (test_user_id, 'venue', 'Event Tonight', 'Live music at The Rooftop Bar starting at 9 PM tonight!', false, '{"venue_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13", "venue_name": "The Rooftop Bar", "event_time": "21:00"}', NOW() - INTERVAL '4 hours');
  END IF;
END $$;
