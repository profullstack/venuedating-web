#!/usr/bin/env node

/**
 * Test script for Square checkout session endpoint
 * Usage: node test-checkout-endpoint.js
 */

const API_BASE_URL = 'http://localhost:8097';

async function testCheckoutEndpoint() {
  try {
    console.log('🧪 Testing Square checkout session endpoint...\n');
    
    // Mock JWT token for testing (you'll need a real one)
    const mockToken = 'your-jwt-token-here';
    
    const response = await fetch(`${API_BASE_URL}/api/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mockToken}`
      }
    });
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    
    const data = await response.json();
    console.log('\nResponse body:');
    console.log(JSON.stringify(data, null, 2));
    
    if (response.ok && data.success) {
      console.log('\n✅ Success! Checkout URL:', data.checkoutUrl);
    } else {
      console.log('\n❌ Failed:', data.error || 'Unknown error');
    }
    
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

// Test with curl command example
function showCurlExample() {
  console.log('\n📋 Curl command example:');
  console.log(`curl -X POST ${API_BASE_URL}/api/create-checkout-session \\`);
  console.log(`  -H "Content-Type: application/json" \\`);
  console.log(`  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\`);
  console.log(`  -v`);
}

// Run the test
testCheckoutEndpoint();
showCurlExample();
