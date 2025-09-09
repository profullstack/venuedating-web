import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

// Load environment variables
dotenv.config();

// Create Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// API base URL
const API_BASE_URL = 'http://localhost:8097/api';

// Test user credentials
const TEST_USER = {
  email: 'user1@example.com',
  password: 'Password123!'
};

async function runTests() {
  console.log('Starting API endpoint tests...');
  
  // Step 1: Authenticate with Supabase
  console.log('\n1. Authenticating with Supabase...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: TEST_USER.email,
    password: TEST_USER.password
  });
  
  if (authError) {
    console.error('Authentication failed:', authError);
    process.exit(1);
  }
  
  console.log('Authentication successful!');
  console.log(`User ID: ${authData.user.id}`);
  console.log(`Access Token: ${authData.session.access_token.substring(0, 20)}...`);
  
  // Store auth token for API requests
  const accessToken = authData.session.access_token;
  const userId = authData.user.id;
  
  // Helper function to make authenticated API requests
  async function apiRequest(method, endpoint, body = null) {
    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    };
    
    if (body && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(body);
    }
    
    try {
      console.log(`Making ${method} request to ${endpoint}...`);
      const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
      const data = await response.json();
      
      return {
        status: response.status,
        data
      };
    } catch (error) {
      console.error(`Error making ${method} request to ${endpoint}:`, error);
      return {
        status: 500,
        data: { error: error.message }
      };
    }
  }
  
  // Step 2: Test User Endpoint
  console.log('\n2. Testing User Endpoint...');
  const userResponse = await apiRequest('GET', `/users/${userId}`);
  console.log(`Status: ${userResponse.status}`);
  console.log('User Data:', JSON.stringify(userResponse.data, null, 2));
  
  // Step 3: Test Venues Endpoint
  console.log('\n3. Testing Venues Endpoint...');
  const venuesResponse = await apiRequest('GET', '/venues');
  console.log(`Status: ${venuesResponse.status}`);
  console.log(`Found ${venuesResponse.data.length} venues`);
  
  if (venuesResponse.data.length > 0) {
    console.log('First venue:', JSON.stringify(venuesResponse.data[0], null, 2));
    
    // Test single venue endpoint
    const venueId = venuesResponse.data[0].id;
    console.log(`\n3.1 Testing Single Venue Endpoint (ID: ${venueId})...`);
    const venueResponse = await apiRequest('GET', `/venues/${venueId}`);
    console.log(`Status: ${venueResponse.status}`);
    console.log('Venue Data:', JSON.stringify(venueResponse.data, null, 2));
  }
  
  // Step 4: Test Matches Endpoint
  console.log('\n4. Testing Matches Endpoint...');
  const matchesResponse = await apiRequest('GET', '/matches');
  console.log(`Status: ${matchesResponse.status}`);
  console.log('Matches Data:', JSON.stringify(matchesResponse.data, null, 2));
  
  // Step 5: Test Conversations Endpoint
  console.log('\n5. Testing Conversations Endpoint...');
  const conversationsResponse = await apiRequest('GET', '/conversations');
  console.log(`Status: ${conversationsResponse.status}`);
  console.log('Conversations Data:', JSON.stringify(conversationsResponse.data, null, 2));
  
  // Step 6: Test Notifications Endpoint
  console.log('\n6. Testing Notifications Endpoint...');
  const notificationsResponse = await apiRequest('GET', '/notifications');
  console.log(`Status: ${notificationsResponse.status}`);
  console.log('Notifications Data:', JSON.stringify(notificationsResponse.data, null, 2));
  
  console.log('\nAPI endpoint tests completed!');
}

// Run the tests
runTests().catch(error => {
  console.error('Error running tests:', error);
  process.exit(1);
});
