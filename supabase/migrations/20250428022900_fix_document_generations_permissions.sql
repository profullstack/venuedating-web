-- Drop existing policies to start fresh
DROP POLICY IF EXISTS document_generations_select_policy ON document_generations;
DROP POLICY IF EXISTS document_generations_insert_policy ON document_generations;
DROP POLICY IF EXISTS document_generations_all_policy ON document_generations;

-- Ensure the table has RLS enabled
ALTER TABLE document_generations ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own document generations
CREATE POLICY document_generations_select_policy ON document_generations
  FOR SELECT
  USING (
    user_id IN (
      SELECT id FROM users WHERE email = auth.uid()::text
    )
  );

-- Allow users to insert their own document generations
-- This policy ensures documents are only associated with authenticated users
CREATE POLICY document_generations_insert_policy ON document_generations
  FOR INSERT
  WITH CHECK (
    user_id IN (
      SELECT id FROM users WHERE email = auth.uid()::text
    )
  );

-- Allow service role to manage all document generations
CREATE POLICY document_generations_service_role_policy ON document_generations
  FOR ALL
  TO service_role
  USING (true);

-- Ensure user_id is required (NOT NULL)
-- This prevents anonymous document generations
ALTER TABLE document_generations ALTER COLUMN user_id SET NOT NULL;

-- Add an index for better performance
CREATE INDEX IF NOT EXISTS idx_document_generations_user_id ON document_generations(user_id);

-- Log the changes
DO $$
BEGIN
  RAISE NOTICE 'Updated document_generations table permissions';
  RAISE NOTICE 'Added strict INSERT policy requiring user authentication';
  RAISE NOTICE 'Ensured user_id is required (NOT NULL)';
  RAISE NOTICE 'Added service_role policy for all operations';
END $$;