-- Add phone column to profiles table for direct Twilio authentication
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone TEXT UNIQUE;

-- Create index for fast phone lookups
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.phone IS 'Phone number in E.164 format for authentication';
