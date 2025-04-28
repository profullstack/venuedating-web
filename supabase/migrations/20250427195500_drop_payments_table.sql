-- Check if the payments table exists before trying to drop it
DO $$
BEGIN
    -- Check if the table exists
    IF EXISTS (
        SELECT FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename = 'payments'
    ) THEN
        -- Drop foreign key constraints first
        ALTER TABLE IF EXISTS payments
        DROP CONSTRAINT IF EXISTS payments_subscription_id_fkey;

        -- Drop the payments table
        DROP TABLE IF EXISTS payments;
    END IF;

    -- Check if policies exist before dropping them
    IF EXISTS (
        SELECT FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'payments'
        AND policyname = 'payments_select_policy'
    ) THEN
        DROP POLICY IF EXISTS payments_select_policy ON payments;
    END IF;

    IF EXISTS (
        SELECT FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'payments'
        AND policyname = 'payments_insert_policy'
    ) THEN
        DROP POLICY IF EXISTS payments_insert_policy ON payments;
    END IF;

    IF EXISTS (
        SELECT FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'payments'
        AND policyname = 'payments_all_policy'
    ) THEN
        DROP POLICY IF EXISTS payments_all_policy ON payments;
    END IF;
END
$$;

-- Comment explaining the migration
COMMENT ON SCHEMA public IS 'Removed payments table as CryptAPI integration has been deprecated';