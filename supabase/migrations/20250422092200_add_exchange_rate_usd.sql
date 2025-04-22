-- Add USD exchange rate column
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS exchange_rate_usd numeric(20,8);
