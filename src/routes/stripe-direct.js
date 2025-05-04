import { Hono } from 'hono';
import Stripe from 'stripe';
import 'dotenv/config';

const router = new Hono();

// Initialize Stripe with minimal configuration
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16'
});

// Minimal checkout endpoint that bypasses all other code
router.post('/create-checkout', async (c) => {
  try {
    const body = await c.req.json();
    const { email, plan, tempClientId } = body;
    
    if (!email || !plan) {
      return c.json({ error: 'Email and plan are required' }, 400);
    }
    
    console.log(`Direct checkout for: ${email}, plan: ${plan}`);
    
    // Determine price ID
    const priceId = plan === 'monthly' 
      ? process.env.STRIPE_MONTHLY_PRICE_ID 
      : process.env.STRIPE_YEARLY_PRICE_ID;
    
    if (!priceId) {
      return c.json({ error: 'Price ID not configured' }, 500);
    }
    
    // Create session with minimal parameters
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      success_url: `${process.env.API_BASE_URL || 'http://localhost:8099'}/dashboard?success=true`,
      cancel_url: `${process.env.API_BASE_URL || 'http://localhost:8099'}/register?canceled=true`,
      line_items: [{ price: priceId, quantity: 1 }]
    });
    
    // Return immediately
    return c.json({
      id: session.id,
      session_id: session.id,
      checkout_url: session.url,
      url: session.url,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Direct checkout error:', error.message);
    return c.json({
      error: 'Payment processing error',
      message: error.message
    }, 500);
  }
});

export default router;
