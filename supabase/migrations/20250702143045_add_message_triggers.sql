-- Migration: add_message_triggers
-- Created at: 2025-07-02T17:20:00.000Z

-- This migration adds triggers that depend on both conversations and messages tables
-- It must be applied after both tables exist to avoid circular dependencies

-- Create trigger to update conversation on new message
-- This was moved from the conversations migration to resolve circular dependency
CREATE TRIGGER update_conversation_trigger
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE PROCEDURE public.update_conversation_on_new_message();
