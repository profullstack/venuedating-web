-- Add source_doc column to document_generations table
-- This column will store the original input content for the conversion,
-- allowing users to edit and regenerate documents
ALTER TABLE document_generations ADD COLUMN source_doc TEXT;

-- Add comment to explain the purpose of the column
COMMENT ON COLUMN document_generations.source_doc IS 'Stores the original input content (HTML, Markdown, etc.) used for the document generation, enabling document editing and regeneration';

-- Create an index on document_type and source_doc for faster lookups when filtering by document type
CREATE INDEX IF NOT EXISTS idx_document_generations_type_source ON document_generations(document_type, (source_doc IS NOT NULL));

-- Update the RLS policies to ensure they still work with the new column
-- (No changes needed as the existing policies are based on user_id)