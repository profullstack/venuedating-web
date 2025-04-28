-- Drop foreign key constraints first
ALTER TABLE IF EXISTS payments
  DROP CONSTRAINT IF EXISTS payments_subscription_id_fkey;

-- Drop the payments table
DROP TABLE IF EXISTS payments;

-- Drop any related policies
DROP POLICY IF EXISTS payments_select_policy ON payments;
DROP POLICY IF EXISTS payments_insert_policy ON payments;
DROP POLICY IF EXISTS payments_all_policy ON payments;

-- Comment explaining the migration
COMMENT ON SCHEMA public IS 'Removed payments table as CryptAPI integration has been deprecated';