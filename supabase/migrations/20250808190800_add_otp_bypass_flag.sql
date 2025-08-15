-- Migration: add_otp_bypass_flag
-- Created at: 2025-08-08T19:08:00.000Z
-- Description: Add a bypass flag for test accounts to skip SMS OTP verification

-- Add bypass_otp column to auth.users table (if possible) or create a separate table
-- Since we can't modify auth.users directly, we'll add it to profiles table

-- Add bypass_otp flag to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS bypass_otp BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.bypass_otp IS 'Flag to bypass SMS OTP verification for test accounts';

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_bypass_otp ON public.profiles(bypass_otp) WHERE bypass_otp = true;

-- Update existing test users to have bypass flag
UPDATE public.profiles 
SET bypass_otp = true 
WHERE id IN (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002', 
  '00000000-0000-0000-0000-000000000003'
);
