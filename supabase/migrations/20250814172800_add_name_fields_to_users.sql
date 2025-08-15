-- Add name fields to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Add comment to explain the purpose of these columns
COMMENT ON COLUMN public.users.full_name IS 'User full name (first + last name)';
COMMENT ON COLUMN public.users.first_name IS 'User first name';
COMMENT ON COLUMN public.users.last_name IS 'User last name';
