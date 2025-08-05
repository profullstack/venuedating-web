/**
 * Square Payment Processing API Endpoint
 * 
 * Handles payment processing using Square's Payment API
 */

import { Client, Environment } from 'square';
import { createClient } from '@supabase/supabase-js';

// Initialize Square client
const squareClient = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  environment: process.env.NODE_ENV === 'production' ? Environment.Production : Environment.Sandbox
});

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { token, amount, currency = 'USD' } = req.body;

    if (!token || !amount) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: token and amount' 
      });
    }

    // Get user from session/auth
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authorization required' 
      });
    }

    // Verify user session
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid authentication' 
      });
    }

    // Generate unique idempotency key
    const idempotencyKey = `${user.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Process payment with Square
    const { result, statusCode } = await squareClient.paymentsApi.createPayment({
      sourceId: token,
      idempotencyKey: idempotencyKey,
      amountMoney: {
        amount: amount, // Amount in cents
        currency: currency
      },
      note: 'BarCrush Matching Access Payment',
      buyerEmailAddress: user.email,
      referenceId: user.id
    });

    if (statusCode === 200 && result.payment) {
      // Payment successful - update user's payment status in database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          has_paid: true,
          payment_date: new Date().toISOString(),
          square_payment_id: result.payment.id
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Failed to update user payment status:', updateError);
        // Payment went through but DB update failed - log for manual reconciliation
      }

      return res.status(200).json({
        success: true,
        paymentId: result.payment.id,
        status: result.payment.status
      });

    } else {
      // Payment failed
      console.error('Square payment failed:', result);
      return res.status(400).json({
        success: false,
        error: result.errors?.[0]?.detail || 'Payment processing failed'
      });
    }

  } catch (error) {
    console.error('Payment processing error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

// Configuration for API route
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};
