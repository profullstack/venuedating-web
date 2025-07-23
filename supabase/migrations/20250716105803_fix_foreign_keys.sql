-- Migration: fix_foreign_keys
-- Created at: 2025-07-16T21:35:00.000Z

-- Fix foreign key relationships for matches table
ALTER TABLE public.matches 
  ADD CONSTRAINT fk_matches_user_id_1 
  FOREIGN KEY (user_id_1) 
  REFERENCES public.users(id) 
  ON DELETE CASCADE;

ALTER TABLE public.matches 
  ADD CONSTRAINT fk_matches_user_id_2 
  FOREIGN KEY (user_id_2) 
  REFERENCES public.users(id) 
  ON DELETE CASCADE;

ALTER TABLE public.matches 
  ADD CONSTRAINT fk_matches_venue_id 
  FOREIGN KEY (venue_id) 
  REFERENCES public.venues(id) 
  ON DELETE SET NULL;

-- Fix foreign key relationships for conversations table
ALTER TABLE public.conversations 
  ADD CONSTRAINT fk_conversations_user_id_1 
  FOREIGN KEY (user_id_1) 
  REFERENCES public.users(id) 
  ON DELETE CASCADE;

ALTER TABLE public.conversations 
  ADD CONSTRAINT fk_conversations_user_id_2 
  FOREIGN KEY (user_id_2) 
  REFERENCES public.users(id) 
  ON DELETE CASCADE;
