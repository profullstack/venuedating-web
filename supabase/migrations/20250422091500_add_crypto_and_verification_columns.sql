-- Add cryptocurrency and verification columns
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS crypto_currency text,
ADD COLUMN IF NOT EXISTS crypto_amount numeric(20,8),
ADD COLUMN IF NOT EXISTS exchange_rate numeric(20,8);

-- Add verification source column to payments
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS verification_source text;
