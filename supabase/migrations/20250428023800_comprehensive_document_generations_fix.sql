-- This migration provides a comprehensive fix for document_generations permissions
-- by addressing both the table structure and RLS policies

-- First, ensure the table has RLS enabled
ALTER TABLE document_generations ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS document_generations_select_policy ON document_generations;
DROP POLICY IF EXISTS document_generations_insert_policy ON document_generations;
DROP POLICY IF EXISTS document_generations_all_policy ON document_generations;
DROP POLICY IF EXISTS document_generations_service_role_policy ON document_generations;

-- Ensure user_id is properly set up (NOT NULL and with proper reference)
ALTER TABLE document_generations 
  ALTER COLUMN user_id SET NOT NULL,
  ADD CONSTRAINT fk_document_generations_user 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Create a policy for users to select their own document generations
CREATE POLICY document_generations_select_policy ON document_generations
  FOR SELECT
  USING (
    auth.uid()::text = (SELECT email FROM users WHERE id = user_id)
  );

-- Create a policy for users to insert their own document generations
CREATE POLICY document_generations_insert_policy ON document_generations
  FOR INSERT
  WITH CHECK (
    auth.uid()::text = (SELECT email FROM users WHERE id = user_id)
  );

-- Create a policy for the service role to manage all document generations
CREATE POLICY document_generations_service_role_policy ON document_generations
  FOR ALL
  TO service_role
  USING (true);

-- Add an index for better performance
CREATE INDEX IF NOT EXISTS idx_document_generations_user_id ON document_generations(user_id);

-- Log the changes
DO $$
BEGIN
  RAISE NOTICE 'Comprehensive fix for document_generations table applied';
  RAISE NOTICE 'Updated RLS policies to use direct auth.uid() comparison';
  RAISE NOTICE 'Added foreign key constraint to ensure referential integrity';
  RAISE NOTICE 'Added service_role policy for all operations';
END $$;