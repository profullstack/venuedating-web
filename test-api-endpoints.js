// Test script for API endpoints
import fetch from 'node-fetch';

// Test user credentials
const testUser = {
  email: 'test1@example.com',
  password: 'password123'
};

// Base URL for API
const baseUrl = 'http://localhost:8097';

// Function to authenticate and get JWT token
async function authenticate() {
  try {
    const response = await fetch(`${baseUrl}/api/1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password
      })
    });
    
    if (!response.ok) {
      throw new Error(`Authentication failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Authentication successful');
    return data.token;
  } catch (error) {
    console.error('Authentication error:', error.message);
    return null;
  }
}

// Function to test an endpoint
async function testEndpoint(endpoint, token, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };
    
    if (body && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(body);
    }
    
    console.log(`Testing ${method} ${endpoint}...`);
    const response = await fetch(`${baseUrl}${endpoint}`, options);
    
    if (!response.ok) {
      console.error(`Error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error('Response:', errorText);
      return false;
    }
    
    const data = await response.json();
    console.log(`Success: ${endpoint}`);
    console.log('Response data:', JSON.stringify(data, null, 2).substring(0, 200) + '...');
    return true;
  } catch (error) {
    console.error(`Error testing ${endpoint}:`, error.message);
    return false;
  }
}

// Main function to run all tests
async function runTests() {
  // Authenticate first
  const token = await authenticate();
  if (!token) {
    console.error('Cannot proceed without authentication');
    return;
  }
  
  // Test user endpoint
  await testEndpoint('/api/users/00000000-0000-0000-0000-000000000001', token);
  
  // Test venues endpoint
  await testEndpoint('/api/venues', token);
  
  // Test matches endpoint
  await testEndpoint('/api/matches', token);
  
  // Test conversations endpoint
  await testEndpoint('/api/conversations', token);
  
  // Test notifications endpoint
  await testEndpoint('/api/notifications', token);
  
  console.log('All tests completed');
}

// Run the tests
runTests().catch(console.error);
