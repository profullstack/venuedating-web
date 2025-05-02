-- Migration to refactor payment tables and separate crypto/stripe payment concerns

-- Step 0: Create tables if they don't exist
-- Create crypto_payments table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'crypto_payments') THEN
    -- Check if original payments table exists
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'payments') THEN
      -- Step 1: Rename the existing payments table to crypto_payments
      ALTER TABLE payments RENAME TO crypto_payments;
      
      -- Update the sequence if it exists
      IF EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'payments_id_seq') THEN
        ALTER SEQUENCE payments_id_seq RENAME TO crypto_payments_id_seq;
      END IF;
      
      -- Update indexes
      IF EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_payments_subscription_id') THEN
        ALTER INDEX idx_payments_subscription_id RENAME TO idx_crypto_payments_subscription_id;
      END IF;
    ELSE
      -- Create crypto_payments table if payments table doesn't exist
      CREATE TABLE crypto_payments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        subscription_id UUID REFERENCES subscriptions(id),
        crypto_currency TEXT NOT NULL,
        crypto_amount NUMERIC(20, 8) NOT NULL,
        payment_address TEXT NOT NULL,
        usd_amount NUMERIC(10, 2),
        exchange_rate NUMERIC(20, 8),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        status TEXT DEFAULT 'pending',
        payment_info JSONB
      );
      
      -- Create index on subscription_id
      CREATE INDEX idx_crypto_payments_subscription_id ON crypto_payments(subscription_id);
    END IF;
  END IF;
  
  -- Create stripe_payments table if it doesn't exist
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'stripe_payments') THEN
    CREATE TABLE stripe_payments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id),
      email TEXT NOT NULL,
      session_id TEXT,
      customer_id TEXT,
      subscription_id TEXT,
      plan TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      payment_info JSONB
    );
    
    -- Create indexes
    CREATE INDEX idx_stripe_payments_user_id ON stripe_payments(user_id);
    CREATE INDEX idx_stripe_payments_email ON stripe_payments(email);
  END IF;
END
$$;

-- Step 2: Add reference columns to subscriptions table if they don't exist
DO $$
BEGIN
  -- Check if crypto_payments_id column exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' AND table_name = 'subscriptions' 
                AND column_name = 'crypto_payments_id') THEN
    ALTER TABLE subscriptions ADD COLUMN crypto_payments_id UUID REFERENCES crypto_payments(id) NULL;
  END IF;
  
  -- Check if stripe_payments_id column exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' AND table_name = 'subscriptions' 
                AND column_name = 'stripe_payments_id') THEN
    ALTER TABLE subscriptions ADD COLUMN stripe_payments_id UUID REFERENCES stripe_payments(id) NULL;
  END IF;
END
$$;

-- Create indexes for the new foreign keys
CREATE INDEX IF NOT EXISTS idx_subscriptions_crypto_payments_id ON subscriptions(crypto_payments_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_payments_id ON subscriptions(stripe_payments_id);

-- Step 3: Migrate data - set crypto_payments_id for existing subscriptions based on the payment records
UPDATE subscriptions s
SET crypto_payments_id = (
  SELECT cp.id 
  FROM crypto_payments cp 
  WHERE cp.subscription_id = s.id 
  ORDER BY cp.created_at DESC 
  LIMIT 1
)
WHERE EXISTS (
  SELECT 1 
  FROM crypto_payments cp 
  WHERE cp.subscription_id = s.id
);

-- Step 4: Remove crypto-specific fields from subscriptions table after migrating the data
-- First, backup these values to the payment_info jsonb field to prevent data loss
UPDATE subscriptions
SET payment_info = COALESCE(payment_info, '{}'::jsonb) || 
                   jsonb_build_object(
                     'crypto_currency', crypto_currency,
                     'crypto_amount', crypto_amount,
                     'payment_address', payment_address
                   )
WHERE crypto_currency IS NOT NULL OR crypto_amount IS NOT NULL OR payment_address IS NOT NULL;

-- Now, remove the fields
ALTER TABLE subscriptions
  DROP COLUMN IF EXISTS crypto_currency,
  DROP COLUMN IF EXISTS crypto_amount,
  DROP COLUMN IF EXISTS payment_address;

-- Step 5: Update RLS policies for the renamed table
DROP POLICY IF EXISTS payments_select_policy ON crypto_payments;
DROP POLICY IF EXISTS payments_all_policy ON crypto_payments;

-- Allow users to read their own crypto payments
CREATE POLICY crypto_payments_select_policy ON crypto_payments
  FOR SELECT
  USING (
    subscription_id IN (
      SELECT id FROM subscriptions WHERE email = auth.uid()::text
    )
  );

-- Allow service role to manage all crypto payments
CREATE POLICY crypto_payments_all_policy ON crypto_payments
  FOR ALL
  TO service_role
  USING (true);

-- Step 6: Add comments for documentation
COMMENT ON TABLE crypto_payments IS 'Stores cryptocurrency payment information, renamed from payments table';
COMMENT ON COLUMN subscriptions.crypto_payments_id IS 'Reference to the most recent crypto payment record';
COMMENT ON COLUMN subscriptions.stripe_payments_id IS 'Reference to the most recent Stripe payment record';
