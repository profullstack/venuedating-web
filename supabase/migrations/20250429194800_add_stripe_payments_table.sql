-- Create stripe_payments table for Stripe payment integration
CREATE TABLE IF NOT EXISTS stripe_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  session_id TEXT,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan TEXT NOT NULL,
  status TEXT NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'stripe',
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_stripe_payments_user_id ON stripe_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_payments_email ON stripe_payments(email);
CREATE INDEX IF NOT EXISTS idx_stripe_payments_session_id ON stripe_payments(session_id);
CREATE INDEX IF NOT EXISTS idx_stripe_payments_stripe_customer_id ON stripe_payments(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_stripe_payments_stripe_subscription_id ON stripe_payments(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_stripe_payments_status ON stripe_payments(status);

-- Enable Row Level Security
ALTER TABLE stripe_payments ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own stripe payments
CREATE POLICY stripe_payments_select_policy ON stripe_payments
  FOR SELECT
  USING (
    email = auth.uid()::text OR
    user_id IN (
      SELECT id FROM users WHERE email = auth.uid()::text
    )
  );

-- Allow service role to manage all stripe payments
CREATE POLICY stripe_payments_all_policy ON stripe_payments
  FOR ALL
  TO service_role
  USING (true);

-- Add STRIPE_WEBHOOK_SECRET to .env.example if it doesn't exist
DO $$
BEGIN
  -- Add a comment explaining the migration
  COMMENT ON TABLE stripe_payments IS 'Stores Stripe payment and subscription information';
END
$$;