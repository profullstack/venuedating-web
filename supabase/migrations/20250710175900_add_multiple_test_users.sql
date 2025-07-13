-- Migration: add_multiple_test_users

-- Create 5 test users with phone authentication for testing real account login flow

-- Test User 1: +15555555556 (already created in previous migration)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE phone = '+15555555556') THEN
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
      '00000000-0000-0000-0000-000000000001',
      '00000000-0000-0000-0000-000000000000',
      '+15555555556',
      NOW(),
      NOW(),
      '{"provider":"phone","providers":["phone"]}',
      '{"full_name":"Test User 1"}',
      NOW(),
      NOW()
    );
  END IF;
END $$;

-- Test User 2: +15555555557
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE phone = '+15555555557') THEN
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
      '00000000-0000-0000-0000-000000000002',
      '00000000-0000-0000-0000-000000000000',
      '+15555555557',
      NOW(),
      NOW(),
      '{"provider":"phone","providers":["phone"]}',
      '{"full_name":"Test User 2"}',
      NOW(),
      NOW()
    );
  END IF;
END $$;

-- Test User 3: +15555555558
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE phone = '+15555555558') THEN
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
      '00000000-0000-0000-0000-000000000003',
      '00000000-0000-0000-0000-000000000000',
      '+15555555558',
      NOW(),
      NOW(),
      '{"provider":"phone","providers":["phone"]}',
      '{"full_name":"Test User 3"}',
      NOW(),
      NOW()
    );
  END IF;
END $$;

-- Test User 4: +15555555559
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE phone = '+15555555559') THEN
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
      '00000000-0000-0000-0000-000000000004',
      '00000000-0000-0000-0000-000000000000',
      '+15555555559',
      NOW(),
      NOW(),
      '{"provider":"phone","providers":["phone"]}',
      '{"full_name":"Test User 4"}',
      NOW(),
      NOW()
    );
  END IF;
END $$;

-- Test User 5: +15555555560
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE phone = '+15555555560') THEN
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
      '00000000-0000-0000-0000-000000000005',
      '00000000-0000-0000-0000-000000000000',
      '+15555555560',
      NOW(),
      NOW(),
      '{"provider":"phone","providers":["phone"]}',
      '{"full_name":"Test User 5"}',
      NOW(),
      NOW()
    );
  END IF;
END $$;

-- Insert or update profiles for all test users
INSERT INTO public.profiles (id, full_name, phone_number, phone_verified, created_at, updated_at, avatar_url)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Test User 1', '+15555555556', true, NOW(), NOW(), '/images/avatar.jpg'),
  ('00000000-0000-0000-0000-000000000002', 'Test User 2', '+15555555557', true, NOW(), NOW(), '/images/avatar.jpg'),
  ('00000000-0000-0000-0000-000000000003', 'Test User 3', '+15555555558', true, NOW(), NOW(), '/images/avatar.jpg'),
  ('00000000-0000-0000-0000-000000000004', 'Test User 4', '+15555555559', true, NOW(), NOW(), '/images/avatar.jpg'),
  ('00000000-0000-0000-0000-000000000005', 'Test User 5', '+15555555560', true, NOW(), NOW(), '/images/avatar.jpg')
ON CONFLICT (id) DO UPDATE
SET full_name = EXCLUDED.full_name,
    phone_number = EXCLUDED.phone_number,
    phone_verified = EXCLUDED.phone_verified,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = NOW();
