-- Add RLS policy to allow anonymous users to insert into subscriptions table
-- This allows users to create their own subscriptions without authentication
CREATE POLICY subscriptions_insert_policy ON subscriptions
  FOR INSERT
  WITH CHECK (true);

-- Add comment explaining the policy
COMMENT ON POLICY subscriptions_insert_policy ON subscriptions IS 
  'Allows anonymous users to create subscriptions. This is necessary for the payment flow where users subscribe before authentication.';