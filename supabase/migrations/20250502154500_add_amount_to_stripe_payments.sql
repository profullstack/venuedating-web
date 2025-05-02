-- Add missing amount and currency columns to stripe_payments table
ALTER TABLE stripe_payments ADD COLUMN IF NOT EXISTS amount DECIMAL(10, 2);
ALTER TABLE stripe_payments ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'USD';
