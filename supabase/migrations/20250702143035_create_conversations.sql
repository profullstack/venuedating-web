-- Migration: create_conversations
-- Created at: 2025-07-02T14:39:12.616Z

-- Create conversations table to manage chat conversations between users
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id_1 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id_2 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  match_id UUID REFERENCES public.matches(id) ON DELETE SET NULL,
  last_message_text TEXT,
  last_message_at TIMESTAMPTZ,
  user_1_unread_count INTEGER DEFAULT 0,
  user_2_unread_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  CONSTRAINT unique_conversation UNIQUE (user_id_1, user_id_2)
);

-- Add RLS policies
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to see their own conversations
CREATE POLICY "Users can view their own conversations" 
  ON public.conversations 
  FOR SELECT 
  USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2);

-- Create policy to allow users to create conversations
CREATE POLICY "Users can create conversations" 
  ON public.conversations 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id_1 OR auth.uid() = user_id_2);

-- Create policy to allow users to update their own conversations
CREATE POLICY "Users can update their own conversations" 
  ON public.conversations 
  FOR UPDATE 
  USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2);

-- Create function to update conversation on new message
CREATE OR REPLACE FUNCTION public.update_conversation_on_new_message()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the conversation with the last message details
  UPDATE public.conversations
  SET 
    last_message_text = NEW.content,
    last_message_at = NEW.created_at,
    updated_at = NOW(),
    user_1_unread_count = CASE 
      WHEN NEW.sender_id != user_id_1 THEN user_1_unread_count + 1 
      ELSE user_1_unread_count 
    END,
    user_2_unread_count = CASE 
      WHEN NEW.sender_id != user_id_2 THEN user_2_unread_count + 1 
      ELSE user_2_unread_count 
    END
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger moved to a separate migration to avoid circular dependency
-- Will be created after both tables exist

-- Create function to reset unread count
CREATE OR REPLACE FUNCTION public.reset_conversation_unread_count(
  p_conversation_id UUID,
  p_user_id UUID
) 
RETURNS void AS $$
BEGIN
  UPDATE public.conversations
  SET 
    user_1_unread_count = CASE 
      WHEN p_user_id = user_id_1 THEN 0 
      ELSE user_1_unread_count 
    END,
    user_2_unread_count = CASE 
      WHEN p_user_id = user_id_2 THEN 0 
      ELSE user_2_unread_count 
    END
  WHERE id = p_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.handle_conversation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating timestamps
CREATE TRIGGER set_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_conversation_updated_at();

-- Create index for faster querying
CREATE INDEX idx_conversations_user_id_1 ON public.conversations(user_id_1);
CREATE INDEX idx_conversations_user_id_2 ON public.conversations(user_id_2);
CREATE INDEX idx_conversations_match_id ON public.conversations(match_id);
CREATE INDEX idx_conversations_last_message_at ON public.conversations(last_message_at);
