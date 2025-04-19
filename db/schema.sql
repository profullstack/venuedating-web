-- Create extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  plan TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  interval TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  payment_address TEXT,
  payment_info JSONB,
  status TEXT NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  expiration_date TIMESTAMP WITH TIME ZONE NOT NULL,
  last_payment_date TIMESTAMP WITH TIME ZONE,
  reminder_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_email ON subscriptions(email);

-- Create index on status and expiration_date for faster filtering
CREATE INDEX IF NOT EXISTS idx_subscriptions_status_expiration ON subscriptions(status, expiration_date);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id),
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL,
  transaction_id TEXT,
  status TEXT NOT NULL,
  payment_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on subscription_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_payments_subscription_id ON payments(subscription_id);

-- Create document_generations table
CREATE TABLE IF NOT EXISTS document_generations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  metadata JSONB
);

-- Create index on generated_at for faster sorting
CREATE INDEX IF NOT EXISTS idx_document_generations_generated_at ON document_generations(generated_at DESC);

-- Create RLS policies for subscriptions table
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own subscriptions
CREATE POLICY subscriptions_select_policy ON subscriptions
  FOR SELECT
  USING (auth.uid()::text = email);

-- Allow service role to manage all subscriptions
CREATE POLICY subscriptions_all_policy ON subscriptions
  FOR ALL
  TO service_role
  USING (true);

-- Create RLS policies for payments table
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own payments
CREATE POLICY payments_select_policy ON payments
  FOR SELECT
  USING (
    subscription_id IN (
      SELECT id FROM subscriptions WHERE email = auth.uid()::text
    )
  );

-- Allow service role to manage all payments
CREATE POLICY payments_all_policy ON payments
  FOR ALL
  TO service_role
  USING (true);

-- Create RLS policies for document_generations table
ALTER TABLE document_generations ENABLE ROW LEVEL SECURITY;

-- Allow service role to manage all document generations
CREATE POLICY document_generations_all_policy ON document_generations
  FOR ALL
  TO service_role
  USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to update updated_at column
CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
BEFORE UPDATE ON payments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();