-- Add phone_number column to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE;

-- Create index on phone_number for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_phone_number ON public.users(phone_number);

-- Add comment to explain the purpose of these columns
COMMENT ON COLUMN public.users.phone_number IS 'User phone number in E.164 format (+[country code][number])';
COMMENT ON COLUMN public.users.phone_verified IS 'Whether the phone number has been verified via OTP';
