-- Migration to improve integration between Supabase Auth and custom users table

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

-- Update existing users to ensure they have correct IDs matching auth.users
-- This will run for existing users to ensure consistency
DO $$
DECLARE
  auth_user RECORD;
BEGIN
  FOR auth_user IN 
    SELECT id, email FROM auth.users
  LOOP
    -- Update or insert the user record
    INSERT INTO public.users (id, email, is_admin, created_at, updated_at)
    VALUES (auth_user.id, auth_user.email, false, now(), now())
    ON CONFLICT (email) 
    DO UPDATE SET
      id = EXCLUDED.id,
      updated_at = now();
  END LOOP;
END $$;

-- Add a comment explaining the auth integration
COMMENT ON TABLE public.users IS 'Custom users table that integrates with auth.users. The id column should match the id in auth.users.';