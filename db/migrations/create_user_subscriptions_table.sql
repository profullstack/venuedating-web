-- Create the user_subscriptions table for payment verification
-- This table tracks user payment status and subscription information

CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT false NOT NULL,
  subscription_level VARCHAR(50) DEFAULT 'basic' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  expires_at TIMESTAMPTZ,
  payment_method VARCHAR(50),
  payment_id VARCHAR(255),
  payment_amount DECIMAL(10, 2),
  payment_currency VARCHAR(3) DEFAULT 'USD',
  metadata JSONB
);

-- Add RLS policies to secure the table
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own subscriptions
CREATE POLICY "Users can view their own subscriptions" 
ON public.user_subscriptions 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Only allow service role or admin to insert/update subscriptions
CREATE POLICY "Service role can manage subscriptions" 
ON public.user_subscriptions 
FOR ALL 
TO service_role 
USING (true);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);

-- Add some sample data for testing
INSERT INTO public.user_subscriptions (user_id, is_active, subscription_level, expires_at)
SELECT 
  id, 
  true, 
  'premium', 
  (now() + interval '30 days')
FROM 
  auth.users 
WHERE 
  email = 'demo@barcrush.app' 
  OR phone = '+15555555555'
ON CONFLICT (id) DO NOTHING;

-- Function to handle subscription payments
CREATE OR REPLACE FUNCTION process_subscription_payment(
  p_user_id UUID,
  p_subscription_level VARCHAR,
  p_payment_method VARCHAR,
  p_payment_id VARCHAR,
  p_payment_amount DECIMAL,
  p_duration_days INTEGER DEFAULT 30
) RETURNS UUID AS $$
DECLARE
  v_subscription_id UUID;
BEGIN
  -- Insert or update subscription
  INSERT INTO public.user_subscriptions (
    user_id,
    is_active,
    subscription_level,
    payment_method,
    payment_id,
    payment_amount,
    expires_at
  )
  VALUES (
    p_user_id,
    true,
    p_subscription_level,
    p_payment_method,
    p_payment_id,
    p_payment_amount,
    (now() + (p_duration_days || ' days')::interval)
  )
  ON CONFLICT (id) DO UPDATE SET
    is_active = true,
    subscription_level = p_subscription_level,
    payment_method = p_payment_method,
    payment_id = p_payment_id,
    payment_amount = p_payment_amount,
    expires_at = (now() + (p_duration_days || ' days')::interval),
    updated_at = now()
  RETURNING id INTO v_subscription_id;

  RETURN v_subscription_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE public.user_subscriptions IS 'User subscription and payment information';
