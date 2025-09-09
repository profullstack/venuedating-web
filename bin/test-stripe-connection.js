import 'dotenv/config';
import Stripe from 'stripe';

// Basic script to test Stripe connection and price lookup

async function main() {
  try {
    console.log('Stripe environment variables:');
    console.log('- STRIPE_SECRET_KEY exists:', !!process.env.STRIPE_SECRET_KEY);
    console.log('- STRIPE_PUBLISHABLE_KEY exists:', !!process.env.STRIPE_PUBLISHABLE_KEY);
    console.log('- STRIPE_MONTHLY_PRICE_ID:', process.env.STRIPE_MONTHLY_PRICE_ID);
    console.log('- STRIPE_YEARLY_PRICE_ID:', process.env.STRIPE_YEARLY_PRICE_ID);
    
    // Initialize Stripe with the secret key
    console.log('\nInitializing Stripe...');
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16'
    });
    
    // Test basic connectivity
    console.log('\nTesting API connectivity...');
    const balance = await stripe.balance.retrieve();
    console.log('Connection successful! Balance available:', !!balance);
    
    // Try to retrieve the price
    console.log('\nAttempting to retrieve monthly price...');
    try {
      const price = await stripe.prices.retrieve(process.env.STRIPE_MONTHLY_PRICE_ID);
      console.log('Price retrieved successfully!');
      console.log('- Product ID:', price.product);
      console.log('- Amount:', price.unit_amount);
      console.log('- Currency:', price.currency);
      console.log('- Active:', price.active);
    } catch (priceError) {
      console.error('Failed to retrieve price:', priceError.message);
    }
    
    // Try creating a minimal checkout session
    console.log('\nAttempting to create a test checkout session...');
    try {
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        success_url: 'https://example.com/success',
        cancel_url: 'https://example.com/cancel',
        line_items: [{
          price: process.env.STRIPE_MONTHLY_PRICE_ID,
          quantity: 1
        }]
      });
      
      console.log('Checkout session created successfully!');
      console.log('- Session ID:', session.id);
      console.log('- URL:', session.url);
      console.log('\nAll tests passed! Your Stripe integration should be working.');
    } catch (sessionError) {
      console.error('Failed to create checkout session:', sessionError.message);
      if (sessionError.type) console.error('Error type:', sessionError.type);
      console.error('This is the exact error happening in your app.');
    }
    
  } catch (error) {
    console.error('Fatal error:', error.message);
  }
}

main().catch(err => console.error('Unhandled error:', err));
