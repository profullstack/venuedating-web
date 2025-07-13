-- Migration: add_real_test_user

-- Create a real test user with phone authentication for testing real account login flow

-- First, check if the real test user already exists in auth.users
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE phone = '+15555555556') THEN
    -- Insert the real test user into auth.users
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
      '00000000-0000-0000-0000-000000000real',
      '00000000-0000-0000-0000-000000000000',
      '+15555555556',
      NOW(),
      NOW(),
      '{"provider":"phone","providers":["phone"]}',
      '{"full_name":"Real Test User"}',
      NOW(),
      NOW()
    );
  END IF;
END $$;

-- Insert or update the real test user profile
INSERT INTO public.profiles (id, full_name, phone_number, phone_verified, created_at, updated_at, avatar_url)
VALUES (
  '00000000-0000-0000-0000-000000000real', 
  'Real Test User', 
  '+15555555556', 
  true, 
  NOW(), 
  NOW(),
  '/images/avatar.jpg'
)
ON CONFLICT (id) DO UPDATE
SET full_name = EXCLUDED.full_name,
    phone_number = EXCLUDED.phone_number,
    phone_verified = EXCLUDED.phone_verified,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = NOW();
