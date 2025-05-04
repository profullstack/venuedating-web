-- Fix permissions for crypto_payments table

-- Grant permissions to the authenticated role
GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE crypto_payments
TO authenticated;

-- Grant permissions to the anon role for initial registration flow
GRANT SELECT, INSERT, UPDATE
ON TABLE crypto_payments
TO anon;

-- Grant permissions on the ID sequence as well
GRANT USAGE, SELECT ON SEQUENCE crypto_payments_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE crypto_payments_id_seq TO anon;

-- Add RLS policies to ensure users can only access their own records
CREATE POLICY "Users can view their own crypto payments"
  ON crypto_payments
  FOR SELECT
  USING (subscription_id IN (
    SELECT id FROM subscriptions WHERE user_id = auth.uid() OR email = current_setting('request.jwt.claims')::json->>'email'
  ));

CREATE POLICY "Users can insert their own crypto payments"
  ON crypto_payments
  FOR INSERT
  WITH CHECK (subscription_id IN (
    SELECT id FROM subscriptions WHERE user_id = auth.uid() OR email = current_setting('request.jwt.claims')::json->>'email'
  ));

CREATE POLICY "Users can update their own crypto payments"
  ON crypto_payments
  FOR UPDATE
  USING (subscription_id IN (
    SELECT id FROM subscriptions WHERE user_id = auth.uid() OR email = current_setting('request.jwt.claims')::json->>'email'
  ));
