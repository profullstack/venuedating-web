-- SIMPLIFIED PERMISSIONS FIX WITHOUT ESCAPING ISSUES

-- First, grant basic permissions directly to tables
GRANT ALL ON TABLE public.stripe_payments TO postgres;
GRANT ALL ON TABLE public.stripe_payments TO service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE public.stripe_payments TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.stripe_payments TO anon;

GRANT ALL ON TABLE public.crypto_payments TO postgres;
GRANT ALL ON TABLE public.crypto_payments TO service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE public.crypto_payments TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.crypto_payments TO anon;

-- Enable Row Level Security with permissive policies
ALTER TABLE public.stripe_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crypto_payments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS stripe_payments_policy ON public.stripe_payments;
DROP POLICY IF EXISTS crypto_payments_policy ON public.crypto_payments;

-- Create new policies
CREATE POLICY stripe_payments_policy ON public.stripe_payments USING (true) WITH CHECK (true);
CREATE POLICY crypto_payments_policy ON public.crypto_payments USING (true) WITH CHECK (true);

-- Grant schema usage
GRANT USAGE ON SCHEMA public TO public;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

-- Grant permissions on sequences if they exist
DO $$
BEGIN
  -- Grant permissions for all sequences in public schema
  EXECUTE (
    SELECT 'GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;'
  );
  
  EXECUTE (
    SELECT 'GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;'
  );
  
  EXECUTE (
    SELECT 'GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;'
  );
END
$$;
