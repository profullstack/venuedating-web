-- Migration: add_payment_fields_to_profiles
-- Created at: 2025-08-20T14:00:00.000Z
-- Description: Add payment-related fields to profiles table for Square integration

-- Add payment fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS has_paid BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS payment_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS square_payment_id TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_has_paid ON public.profiles(has_paid);
CREATE INDEX IF NOT EXISTS idx_profiles_payment_date ON public.profiles(payment_date);
CREATE INDEX IF NOT EXISTS idx_profiles_square_payment_id ON public.profiles(square_payment_id);

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.has_paid IS 'Whether user has paid for premium features';
COMMENT ON COLUMN public.profiles.payment_date IS 'Timestamp when user made payment';
COMMENT ON COLUMN public.profiles.square_payment_id IS 'Square payment transaction ID';
