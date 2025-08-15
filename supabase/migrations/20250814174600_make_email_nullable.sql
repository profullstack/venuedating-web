-- Make email column nullable in users table
ALTER TABLE public.users ALTER COLUMN email DROP NOT NULL;

-- Add comment to explain the change
COMMENT ON COLUMN public.users.email IS 'User email address (nullable for phone-only users)';
