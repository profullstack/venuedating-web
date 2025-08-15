-- Migration: add_create_profile_function
-- Created at: 2025-08-15T15:52:00.000Z

-- Create a function to safely create a profile for a user
CREATE OR REPLACE FUNCTION public.create_profile_for_user(
  user_id UUID,
  user_full_name TEXT,
  user_display_name TEXT,
  user_created_at TIMESTAMPTZ,
  user_updated_at TIMESTAMPTZ,
  user_is_verified BOOLEAN
) RETURNS BOOLEAN AS $$
DECLARE
  profile_exists BOOLEAN;
BEGIN
  -- Check if profile already exists
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = user_id) INTO profile_exists;
  
  -- If profile doesn't exist, create it
  IF NOT profile_exists THEN
    -- Insert the profile with minimal required fields
    INSERT INTO public.profiles (
      id, 
      full_name, 
      display_name, 
      created_at, 
      updated_at, 
      is_verified
    ) VALUES (
      user_id,
      user_full_name,
      user_display_name,
      user_created_at,
      user_updated_at,
      user_is_verified
    );
  END IF;
  
  RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
  -- Log the error (in production, you might want to use a proper logging mechanism)
  RAISE NOTICE 'Error creating profile: %', SQLERRM;
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users and service role
GRANT EXECUTE ON FUNCTION public.create_profile_for_user TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_profile_for_user TO service_role;

-- Add comment to function
COMMENT ON FUNCTION public.create_profile_for_user IS 'Creates a profile for a user, handling foreign key constraints safely';
