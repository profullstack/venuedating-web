-- Add INSERT policy for document_generations table
-- This allows users to insert records only for their own user_id
CREATE POLICY document_generations_insert_policy ON document_generations
  FOR INSERT
  WITH CHECK (
    user_id IN (
      SELECT id FROM users WHERE email = auth.uid()::text
    )
  );

-- Verify the SELECT policy exists (it should already be there from previous migrations)
-- This ensures users can only see their own document generations
DO $$
DECLARE
  policy_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'document_generations'
    AND policyname = 'document_generations_select_policy'
  ) INTO policy_exists;
  
  IF NOT policy_exists THEN
    EXECUTE 'CREATE POLICY document_generations_select_policy ON document_generations
      FOR SELECT
      USING (
        user_id IN (
          SELECT id FROM users WHERE email = auth.uid()::text
        )
      )';
    RAISE NOTICE 'Created SELECT policy for document_generations table';
  ELSE
    RAISE NOTICE 'SELECT policy for document_generations table already exists';
  END IF;
END $$;

-- Ensure the table has RLS enabled
ALTER TABLE document_generations ENABLE ROW LEVEL SECURITY;

-- Log the change
DO $$
BEGIN
  RAISE NOTICE 'Added INSERT policy for document_generations table';
  RAISE NOTICE 'Document generations are now properly secured - users can only insert and view their own records';
END $$;