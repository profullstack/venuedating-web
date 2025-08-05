-- Migration: add_is_admin_to_profiles
-- Generated at: 2025-08-05T04:22:00Z

-- Up Migration --------------------------------------------------------------
-- Add an `is_admin` boolean flag to the `profiles` table. Default is FALSE.
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- No additional RLS policies are required because existing policies already
-- permit users to SELECT all profiles and UPDATE their own profile. Admins
-- are still subject to the same restrictions; elevated privileges are 
-- enforced in the application layer.

-- Down Migration ------------------------------------------------------------
-- Remove the column if it exists (irreversible loss of data!).
ALTER TABLE public.profiles
DROP COLUMN IF EXISTS is_admin;
