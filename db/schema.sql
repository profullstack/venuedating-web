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