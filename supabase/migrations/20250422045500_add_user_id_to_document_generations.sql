-- Add user_id column to document_generations table
ALTER TABLE document_generations ADD COLUMN user_id UUID REFERENCES users(id);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_document_generations_user_id ON document_generations(user_id);

-- Update RLS policies for document_generations table
DROP POLICY IF EXISTS document_generations_all_policy ON document_generations;

-- Allow users to read their own document generations
CREATE POLICY document_generations_select_policy ON document_generations
  FOR SELECT
  USING (
    user_id IN (
      SELECT id FROM users WHERE email = auth.uid()::text
    )
  );

-- Allow service role to manage all document generations
CREATE POLICY document_generations_all_policy ON document_generations
  FOR ALL
  TO service_role
  USING (true);