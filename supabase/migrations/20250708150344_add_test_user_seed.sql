-- Migration: add_test_user_seed

-- Create a test user with phone authentication for local development

-- First, check if the test user already exists in auth.users
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE phone = '+15555555555') THEN
    -- Insert the test user into auth.users
    INSERT INTO auth.users (
      id,
      instance_id,
      phone,
      phone_confirmed_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000test',
      '00000000-0000-0000-0000-000000000000',
      '+15555555555',
      NOW(),
      NOW(),
      '{"provider":"phone","providers":["phone"]}',
      '{"full_name":"Test User"}',
      NOW(),
      NOW()
    );
  END IF;
END $$;

-- Insert or update the test user profile
INSERT INTO public.profiles (id, full_name, phone_number, phone_verified, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000test', 'Test User', '+15555555555', true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE
SET full_name = EXCLUDED.full_name,
    phone_number = EXCLUDED.phone_number,
    phone_verified = EXCLUDED.phone_verified,
    updated_at = NOW();