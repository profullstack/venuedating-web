-- Add RLS policy to allow anonymous users to insert into payments table
-- This allows the payment callback to process payments without authentication
CREATE POLICY payments_insert_policy ON payments
  FOR INSERT
  WITH CHECK (true);

-- Add comment explaining the policy
COMMENT ON POLICY payments_insert_policy ON payments IS 
  'Allows anonymous users to create payment records. This is necessary for the payment callback flow where payments are processed without authentication.';