import { supabase } from '../utils/supabase.js';
import { authMiddleware } from '../middleware/auth-middleware.js';

// Square Payment Route Handlers

// Get Square credentials
async function getSquareCredentials(c) {
  try {
    // Return Square sandbox credentials for development
    // In production, these should come from environment variables
    const credentials = {
      applicationId: process.env.SQUARE_APPLICATION_ID || 'sandbox-sq0idb-your-app-id',
      locationId: process.env.SQUARE_LOCATION_ID || 'sandbox-location-id',
      environment: process.env.SQUARE_ENVIRONMENT || 'sandbox'
    };
    
    return c.json(credentials);
  } catch (error) {
    console.error('Error fetching Square credentials:', error);
    return c.json({ error: 'Failed to fetch Square credentials' }, 500);
  }
}

// Process Square payment
async function processPayment(c) {
  try {
    const { token, amount, currency = 'USD' } = await c.req.json();
    const user = c.get('user');
    
    if (!token || !amount) {
      return c.json({ error: 'Payment token and amount are required' }, 400);
    }
    
    // In a real implementation, you would process the payment with Square here
    // For now, we'll simulate a successful payment
    console.log(`Processing payment for user ${user.id}: $${amount/100} ${currency}`);
    
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update user's payment status in the database
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ has_paid: true })
      .eq('id', user.id);
    
    if (updateError) {
      console.error('Error updating payment status:', updateError);
      return c.json({ error: 'Failed to update payment status' }, 500);
    }
    
    return c.json({
      success: true,
      paymentId: `payment_${Date.now()}`,
      amount,
      currency,
      status: 'completed'
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    return c.json({ error: 'Payment processing failed' }, 500);
  }
}

// Get user profile
async function getUserProfile(c) {
  try {
    const user = c.get('user');
    
    // Get user profile from database
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (error) {
      console.error('Error fetching user profile:', error);
      return c.json({ error: 'Failed to fetch user profile' }, 500);
    }
    
    return c.json(profile);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return c.json({ error: 'Failed to fetch user profile' }, 500);
  }
}

// Check payment status
async function getPaymentStatus(c) {
  try {
    const user = c.get('user');
    
    // Get payment status from database
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('has_paid')
      .eq('id', user.id)
      .single();
    
    if (error) {
      console.error('Error fetching payment status:', error);
      return c.json({ error: 'Failed to fetch payment status' }, 500);
    }
    
    return c.json({ has_paid: profile.has_paid || false });
  } catch (error) {
    console.error('Error fetching payment status:', error);
    return c.json({ error: 'Failed to fetch payment status' }, 500);
  }
}

// Update payment status
async function updatePaymentStatus(c) {
  try {
    const { has_paid } = await c.req.json();
    const user = c.get('user');
    
    if (typeof has_paid !== 'boolean') {
      return c.json({ error: 'has_paid must be a boolean value' }, 400);
    }
    
    // Update payment status in database
    const { error } = await supabase
      .from('profiles')
      .update({ has_paid })
      .eq('id', user.id);
    
    if (error) {
      console.error('Error updating payment status:', error);
      return c.json({ error: 'Failed to update payment status' }, 500);
    }
    
    return c.json({ success: true, has_paid });
  } catch (error) {
    console.error('Error updating payment status:', error);
    return c.json({ error: 'Failed to update payment status' }, 500);
  }
}

// Export Square routes
export const squareRoutes = [
  {
    method: 'GET',
    path: '/api/square-credentials',
    handler: getSquareCredentials,
    middleware: [authMiddleware]
  },
  {
    method: 'POST',
    path: '/api/process-payment',
    handler: processPayment,
    middleware: [authMiddleware]
  },
  {
    method: 'GET',
    path: '/api/user-profile',
    handler: getUserProfile,
    middleware: [authMiddleware]
  },
  {
    method: 'GET',
    path: '/api/user/payment-status',
    handler: getPaymentStatus,
    middleware: [authMiddleware]
  },
  {
    method: 'POST',
    path: '/api/user/payment-status',
    handler: updatePaymentStatus,
    middleware: [authMiddleware]
  }
];
