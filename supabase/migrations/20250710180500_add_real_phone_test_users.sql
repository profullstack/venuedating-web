-- Migration: add_real_phone_test_users

-- Create 5 test users with REAL phone numback ers for Twilio testing
-- IMPORTANT: Replace the phone numbers below with actual phone numbers you want to test with

-- Test User 1: Replace with your real phone number (e.g., +1XXXXXXXXXX)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE phone = '+1XXXXXXXXXX') THEN -- Replace with real phone
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
      '00000000-0000-0000-0000-000000000r01', -- 'r' for real phone
      '00000000-0000-0000-0000-000000000000',
      '+1XXXXXXXXXX', -- Replace with real phone
      NOW(),
      NOW(),
      '{"provider":"phone","providers":["phone"]}',
      '{"full_name":"Real Phone User 1"}',
      NOW(),
      NOW()
    );
  END IF;
END $$;

-- Test User 2: Replace with your real phone number (e.g., +1XXXXXXXXXX)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE phone = '+1YYYYYYYYYY') THEN -- Replace with real phone
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
      '00000000-0000-0000-0000-000000000r02',
      '00000000-0000-0000-0000-000000000000',
      '+1YYYYYYYYYY', -- Replace with real phone
      NOW(),
      NOW(),
      '{"provider":"phone","providers":["phone"]}',
      '{"full_name":"Real Phone User 2"}',
      NOW(),
      NOW()
    );
  END IF;
END $$;

-- Test User 3: Replace with your real phone number (e.g., +1XXXXXXXXXX)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE phone = '+1ZZZZZZZZZZ') THEN -- Replace with real phone
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
      '00000000-0000-0000-0000-000000000r03',
      '00000000-0000-0000-0000-000000000000',
      '+1ZZZZZZZZZZ', -- Replace with real phone
      NOW(),
      NOW(),
      '{"provider":"phone","providers":["phone"]}',
      '{"full_name":"Real Phone User 3"}',
      NOW(),
      NOW()
    );
  END IF;
END $$;

-- Test User 4: Replace with your real phone number (e.g., +1XXXXXXXXXX)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE phone = '+1AAAAAAAAAA') THEN -- Replace with real phone
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
      '00000000-0000-0000-0000-000000000r04',
      '00000000-0000-0000-0000-000000000000',
      '+1AAAAAAAAAA', -- Replace with real phone
      NOW(),
      NOW(),
      '{"provider":"phone","providers":["phone"]}',
      '{"full_name":"Real Phone User 4"}',
      NOW(),
      NOW()
    );
  END IF;
END $$;

-- Test User 5: Replace with your real phone number (e.g., +1XXXXXXXXXX)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE phone = '+1BBBBBBBBBB') THEN -- Replace with real phone
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
      '00000000-0000-0000-0000-000000000r05',
      '00000000-0000-0000-0000-000000000000',
      '+1BBBBBBBBBB', -- Replace with real phone
      NOW(),
      NOW(),
      '{"provider":"phone","providers":["phone"]}',
      '{"full_name":"Real Phone User 5"}',
      NOW(),
      NOW()
    );
  END IF;
END $$;

-- Insert or update profiles for all real phone test users
-- IMPORTANT: Replace the phone numbers below with the same real phone numbers you used above
INSERT INTO public.profiles (id, full_name, phone_number, phone_verified, created_at, updated_at, avatar_url)
VALUES 
  ('00000000-0000-0000-0000-000000000r01', 'Real Phone User 1', '+1XXXXXXXXXX', true, NOW(), NOW(), '/images/avatar.jpg'), -- Replace with real phone
  ('00000000-0000-0000-0000-000000000r02', 'Real Phone User 2', '+1YYYYYYYYYY', true, NOW(), NOW(), '/images/avatar.jpg'), -- Replace with real phone
  ('00000000-0000-0000-0000-000000000r03', 'Real Phone User 3', '+1ZZZZZZZZZZ', true, NOW(), NOW(), '/images/avatar.jpg'), -- Replace with real phone
  ('00000000-0000-0000-0000-000000000r04', 'Real Phone User 4', '+1AAAAAAAAAA', true, NOW(), NOW(), '/images/avatar.jpg'), -- Replace with real phone
  ('00000000-0000-0000-0000-000000000r05', 'Real Phone User 5', '+1BBBBBBBBBB', true, NOW(), NOW(), '/images/avatar.jpg')  -- Replace with real phone
ON CONFLICT (id) DO UPDATE
SET full_name = EXCLUDED.full_name,
    phone_number = EXCLUDED.phone_number,
    phone_verified = EXCLUDED.phone_verified,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = NOW();
