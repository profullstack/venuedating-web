-- Add payment fields to profiles table
-- Migration: add_payment_fields.sql

-- Add payment-related columns to the profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS has_paid BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS payment_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS square_payment_id TEXT;

-- Create index for faster payment status queries
CREATE INDEX IF NOT EXISTS idx_profiles_has_paid ON profiles(has_paid);
CREATE INDEX IF NOT EXISTS idx_profiles_payment_date ON profiles(payment_date);

-- Add comment for documentation
COMMENT ON COLUMN profiles.has_paid IS 'Whether the user has paid for matching access';
COMMENT ON COLUMN profiles.payment_date IS 'Timestamp when the user made the payment';
COMMENT ON COLUMN profiles.square_payment_id IS 'Square payment transaction ID for reference';
