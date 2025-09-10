import 'dotenv/config';
import Stripe from 'stripe';
import { createServer } from 'http';

// Initialize Stripe with minimal configuration
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16'
});

// Create a very simple HTTP server with no dependencies
const server = createServer(async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  
  // Only handle POST requests to /create-checkout
  if (req.method === 'POST' && req.url === '/create-checkout') {
    try {
      // Read the request body
      const chunks = [];
      
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      
      const data = JSON.parse(Buffer.concat(chunks).toString());
      console.log('Received request:', data);
      
      // Extract email and plan
      const { email, plan } = data;
      
      if (!email || !plan) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Email and plan are required' }));
        return;
      }
      
      // Determine price ID
      const priceId = plan === 'monthly' 
        ? process.env.STRIPE_MONTHLY_PRICE_ID 
        : process.env.STRIPE_YEARLY_PRICE_ID;
      
      console.log(`Using price ID: ${priceId} for ${plan} plan`);
      
      // Create checkout session directly
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        success_url: `${process.env.API_BASE_URL || 'http://localhost:8099'}/dashboard?success=true`,
        cancel_url: `${process.env.API_BASE_URL || 'http://localhost:8099'}/register?canceled=true`,
        line_items: [{ price: priceId, quantity: 1 }]
      });
      
      console.log('Checkout session created:');
      console.log(`ID: ${session.id}`);
      console.log(`URL: ${session.url}`);
      
      // Send response immediately
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        id: session.id,
        session_id: session.id,
        checkout_url: session.url,
        url: session.url
      }));
      
      console.log('Response sent to client successfully');
    } catch (error) {
      console.error('Error creating checkout session:', error.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
    return;
  }
  
  // For any other endpoint, return 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

// Start server on port 8098
const PORT = 8098;
server.listen(PORT, () => {
  console.log(`Simple Stripe server running on http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log('POST /create-checkout - Create a Stripe checkout session');
});
