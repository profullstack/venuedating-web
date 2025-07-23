-- Migration: create_notifications_table
-- Created at: 2025-07-16T21:31:00.000Z

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  content TEXT,
  related_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  related_entity_id UUID,
  related_entity_type VARCHAR(50),
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);

-- Add RLS policies
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to view their own notifications
CREATE POLICY notifications_select_policy ON public.notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy to allow users to update their own notifications (e.g., mark as read)
CREATE POLICY notifications_update_policy ON public.notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Add trigger to update updated_at on update
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_notifications_updated_at_trigger
BEFORE UPDATE ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION update_notifications_updated_at();
