-- Migration to clean out existing users and set up proper auth integration

-- First, clean out existing data from tables that depend on users
TRUNCATE TABLE api_keys CASCADE;
TRUNCATE TABLE document_generations CASCADE;

-- Clean out existing users
TRUNCATE TABLE users CASCADE;

-- Modify users table to ensure ID matches auth.users
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE users ADD CONSTRAINT users_pkey PRIMARY KEY (id);

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