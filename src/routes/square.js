import { supabase } from '../utils/supabase.js';
import { authMiddleware } from '../middleware/auth-middleware.js';

// Square Payment Route Handlers

// Get Square credentials
async function getSquareCredentials(c) {
  try {
    const isProduction = process.env.SQUARE_ENV === 'production';
    
    const credentials = {
      applicationId: isProduction 
        ? process.env.SQUARE_APP_ID 
        : process.env.SQUARE_SANDBOX_APP_ID,
      locationId: isProduction 
        ? process.env.SQUARE_LOCATION_ID 
        : process.env.SQUARE_SANDBOX_LOCATION_ID,
      environment: process.env.SQUARE_ENV || 'sandbox'
    };
    
    // Validate that required credentials are present
    if (!credentials.applicationId || !credentials.locationId) {
      return c.json({ error: 'Square credentials not properly configured' }, 500);
    }
    
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

// Create Square Online Checkout session
async function createCheckoutSession(c) {
  try {
    // Get user data from request body (phone-based auth)
    const { userId, phone } = await c.req.json();
    
    if (!userId || !phone) {
      return c.json({ error: 'User ID and phone number required' }, 400);
    }
    
    console.log('Creating checkout for user:', userId, 'with phone:', phone);
    
    // Create user object from provided data (skip database verification for now)
    const user = {
      id: userId,
      phone: phone,
      name: 'User' // Default name
    };
    
    // Validate required Square credentials
    const isProduction = process.env.SQUARE_ENV === 'production';
    const accessToken = isProduction ? process.env.SQUARE_ACCESS_TOKEN : process.env.SQUARE_SANDBOX_ACCESS_TOKEN;
    const locationId = isProduction ? process.env.SQUARE_LOCATION_ID : process.env.SQUARE_SANDBOX_LOCATION_ID;
    
    console.log('Square config:', {
      environment: process.env.SQUARE_ENV || 'sandbox',
      isProduction,
      hasAccessToken: !!accessToken,
      hasLocationId: !!locationId,
      locationId: locationId
    });
    
    if (!accessToken) {
      return c.json({ error: 'Square access token not configured for ' + (isProduction ? 'production' : 'sandbox') }, 500);
    }
    
    if (!locationId) {
      return c.json({ error: 'Square location ID not configured for ' + (isProduction ? 'production' : 'sandbox') }, 500);
    }
    
    // Use Square SDK
    const { Client, Environment } = await import('square');
    
    const client = new Client({
      accessToken: accessToken,
      environment: isProduction ? Environment.Production : Environment.Sandbox
    });
    
    const { checkoutApi } = client;
    
    const requestBody = {
      idempotencyKey: `checkout-${user.id}-${Date.now()}`,
      order: {
        locationId: locationId,
        lineItems: [
          {
            quantity: '1',
            basePriceMoney: {
              amount: BigInt(200), // $2.00 in cents
              currency: 'USD'
            },
            name: 'BarCrush Premium Access',
            note: 'Unlock venue information and premium features'
          }
        ]
      },
      checkoutOptions: {
        redirectUrl: `${process.env.API_BASE_URL || 'http://localhost:8097'}/payment-success?user_id=${user.id}`,
        askForShippingAddress: false,
        merchantSupportEmail: 'support@barcrush.app'
      },
      prePopulatedData: {
        buyerEmail: user.email
      }
    };
    
    const response = await checkoutApi.createPaymentLink(requestBody);
    
    if (response.result.paymentLink) {
      return c.json({
        success: true,
        checkoutUrl: response.result.paymentLink.url,
        paymentLinkId: response.result.paymentLink.id
      });
    } else {
      return c.json({ error: 'Failed to create checkout session' }, 400);
    }
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return c.json({ error: 'Checkout session creation failed' }, 500);
  }
}

// Handle Square webhook events
async function handleSquareWebhook(c) {
  try {
    const body = await c.req.text();
    const signature = c.req.header('x-square-signature');
    
    // TODO: Implement webhook signature verification
    console.log('Received Square webhook:', body);
    
    // Parse webhook payload
    const event = JSON.parse(body);
    
    // Handle different event types
    switch (event.type) {
      case 'payment.updated':
        // Handle payment status updates
        console.log('Payment updated:', event.data);
        break;
      default:
        console.log('Unhandled webhook event type:', event.type);
    }
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Error handling Square webhook:', error);
    return c.json({ error: 'Webhook processing failed' }, 500);
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
  },
  {
    method: 'POST',
    path: '/api/create-checkout-session',
    handler: createCheckoutSession,
  },
  {
    method: 'POST',
    path: '/api/square-webhook',
    handler: handleSquareWebhook
    // No auth middleware for webhooks - Square will send signature for verification
  }
];
