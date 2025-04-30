#!/usr/bin/env node

import Stripe from 'stripe';
import dotenv from 'dotenv-flow';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

console.log('Testing Stripe API authentication...');

// Check if STRIPE_SECRET_KEY is set
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  console.error('ERROR: STRIPE_SECRET_KEY environment variable is not set or empty');
  console.error('Please check your .env file and ensure STRIPE_SECRET_KEY is properly configured');
  process.exit(1);
}

// Log the first few characters of the key (for debugging, don't log the full key)
console.log(`STRIPE_SECRET_KEY is set (starts with: ${stripeSecretKey.substring(0, 8)}...)`);

// Initialize Stripe with the secret key
let stripe;
try {
  stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2023-10-16',
    // Add explicit request timeout
    timeout: 30000,
    // Add explicit HTTP client configuration
    httpClient: Stripe.createNodeHttpClient(),
    // Enable telemetry
    telemetry: true,
    // Add app info
    appInfo: {
      name: 'PDF Service',
      version: '1.0.0',
    },
  });
  console.log('Stripe client initialized successfully');
} catch (error) {
  console.error('Failed to initialize Stripe client:', error);
  process.exit(1);
}

// Test a simple API call
async function testStripeAPI() {
  try {
    console.log('Making test API call to Stripe...');
    
    // Log the request details
    console.log('Request details:');
    console.log('- API Version:', stripe.getApiField('version'));
    
    // Make a simple API call to list prices
    const prices = await stripe.prices.list({
      limit: 1,
      active: true,
    });
    
    console.log('API call successful!');
    console.log(`Retrieved ${prices.data.length} prices`);
    console.log('First price ID:', prices.data[0]?.id || 'No prices found');
    
    return true;
  } catch (error) {
    console.error('API call failed with error:', error);
    console.error('Error details:', {
      message: error.message,
      type: error.type,
      code: error.code,
      statusCode: error.statusCode,
      requestId: error.requestId,
    });
    
    return false;
  }
}

// Run the test
testStripeAPI()
  .then(success => {
    if (success) {
      console.log('Stripe API authentication test passed!');
      process.exit(0);
    } else {
      console.error('Stripe API authentication test failed!');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Unexpected error during test:', error);
    process.exit(1);
  });