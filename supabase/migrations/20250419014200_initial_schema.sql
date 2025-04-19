-- Create extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create API keys table
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT TRUE,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);

-- Create index on key for faster lookups
CREATE INDEX IF NOT EXISTS idx_api_keys_key ON api_keys(key);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  plan TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  interval TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  status TEXT NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  expiration_date TIMESTAMP WITH TIME ZONE NOT NULL,
  payment_address TEXT,
  payment_info JSONB,
  last_payment_date TIMESTAMP WITH TIME ZONE,
  reminder_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_email ON subscriptions(email);

-- Create index on status for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
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

-- Create document_generations table for storing document generation history
CREATE TABLE IF NOT EXISTS document_generations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_type TEXT NOT NULL,
  storage_path TEXT,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on document_type for faster lookups
CREATE INDEX IF NOT EXISTS idx_document_generations_document_type ON document_generations(document_type);

-- Create index on generated_at for faster lookups
CREATE INDEX IF NOT EXISTS idx_document_generations_generated_at ON document_generations(generated_at);

-- Create RLS policies for users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own data
CREATE POLICY users_select_policy ON users
  FOR SELECT
  USING (auth.uid()::text = email);

-- Allow service role to manage all users
CREATE POLICY users_all_policy ON users
  FOR ALL
  TO service_role
  USING (true);

-- Create RLS policies for API keys table
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own API keys
CREATE POLICY api_keys_select_policy ON api_keys
  FOR SELECT
  USING (
    user_id IN (
      SELECT id FROM users WHERE email = auth.uid()::text
    )
  );

-- Allow users to insert their own API keys
CREATE POLICY api_keys_insert_policy ON api_keys
  FOR INSERT
  WITH CHECK (
    user_id IN (
      SELECT id FROM users WHERE email = auth.uid()::text
    )
  );

-- Allow users to update their own API keys
CREATE POLICY api_keys_update_policy ON api_keys
  FOR UPDATE
  USING (
    user_id IN (
      SELECT id FROM users WHERE email = auth.uid()::text
    )
  );

-- Allow users to delete their own API keys
CREATE POLICY api_keys_delete_policy ON api_keys
  FOR DELETE
  USING (
    user_id IN (
      SELECT id FROM users WHERE email = auth.uid()::text
    )
  );

-- Allow service role to manage all API keys
CREATE POLICY api_keys_all_policy ON api_keys
  FOR ALL
  TO service_role
  USING (true);

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