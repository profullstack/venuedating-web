-- Migration to set up proper auth integration between auth.users and public.users

-- Check if users table exists and create it if it doesn't
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'users'
  ) THEN
    CREATE TABLE public.users (
      id UUID PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      is_admin BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    RAISE NOTICE 'Created users table';
  ELSE
    RAISE NOTICE 'Users table already exists';
  END IF;
END
$$;

-- Create a function to automatically create a user record when a new auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, is_admin, created_at, updated_at)
  VALUES (new.id, new.email, false, now(), now())
  ON CONFLICT (email) 
  DO UPDATE SET
    id = EXCLUDED.id,
    updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to call the function when a new auth user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add a comment explaining the auth integration
COMMENT ON TABLE public.users IS 'Custom users table that integrates with auth.users. The id column should match the id in auth.users.';