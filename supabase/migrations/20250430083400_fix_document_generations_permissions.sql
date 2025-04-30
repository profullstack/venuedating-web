-- Fix permissions for document_generations table

-- First, ensure the table has RLS enabled
ALTER TABLE document_generations ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS document_generations_select_policy ON document_generations;
DROP POLICY IF EXISTS document_generations_insert_policy ON document_generations;
DROP POLICY IF EXISTS document_generations_all_policy ON document_generations;
DROP POLICY IF EXISTS document_generations_service_role_policy ON document_generations;

-- Create a policy for authenticated users to select their own document generations
CREATE POLICY document_generations_select_policy ON document_generations
  FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT id FROM users WHERE email = auth.uid()::text)
  );

-- Create a policy for authenticated users to insert their own document generations
CREATE POLICY document_generations_insert_policy ON document_generations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (SELECT id FROM users WHERE email = auth.uid()::text)
  );

-- Create a policy for the service role to manage all document generations
CREATE POLICY document_generations_service_role_policy ON document_generations
  FOR ALL
  TO service_role
  USING (true);

-- Grant specific permissions to authenticated users
GRANT SELECT, INSERT ON document_generations TO authenticated;

-- Grant all permissions to service_role
GRANT ALL ON document_generations TO service_role;

-- Log the changes
DO $$
BEGIN
  RAISE NOTICE 'Fixed permissions for document_generations table';
  RAISE NOTICE 'Created policies for authenticated users';
  RAISE NOTICE 'Granted explicit permissions to roles';
END $$;
