// Test script for API endpoints in demo mode
import { Hono } from 'hono';
import { supabase } from './src/utils/supabase.js';

// Create a simple test server
const app = new Hono();

// Import route handlers
import { conversationRoutes } from './src/routes/conversations.js';
import { matchRoutes } from './src/routes/matches.js';
import { notificationRoutes } from './src/routes/notifications.js';
import { venueRoutes } from './src/routes/venues.js';

// Create a demo middleware that bypasses authentication
const demoAuthMiddleware = async (c, next) => {
  // Set a demo user in the context
  c.set('user', {
    id: '00000000-0000-0000-0000-000000000001', // Test User 1 from seed data
    email: 'test1@example.com',
    is_admin: true
  });
  
  // Continue to the next middleware/handler
  return next();
};

// Register routes with demo auth middleware
app.use('/api/conversations/*', demoAuthMiddleware);
app.use('/api/matches/*', demoAuthMiddleware);
app.use('/api/notifications/*', demoAuthMiddleware);
app.use('/api/venues/*', demoAuthMiddleware);

// Register API routes
conversationRoutes.forEach(route => {
  app[route.method.toLowerCase()](route.path, route.handler);
});

matchRoutes.forEach(route => {
  app[route.method.toLowerCase()](route.path, route.handler);
});

notificationRoutes.forEach(route => {
  app[route.method.toLowerCase()](route.path, route.handler);
});

venueRoutes.forEach(route => {
  app[route.method.toLowerCase()](route.path, route.handler);
});

// Test endpoints
async function testEndpoint(endpoint) {
  try {
    console.log(`Testing ${endpoint}...`);
    
    // Create a mock request
    const req = new Request(`http://localhost${endpoint}`);
    
    // Process the request with our app
    const res = await app.fetch(req);
    
    if (!res.ok) {
      console.error(`Error: ${res.status} ${res.statusText}`);
      const errorText = await res.text();
      console.error('Response:', errorText);
      return false;
    }
    
    const data = await res.json();
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
  console.log('Testing API endpoints in demo mode...');
  
  // Test venues endpoint
  await testEndpoint('/api/venues');
  
  // Test matches endpoint
  await testEndpoint('/api/matches');
  
  // Test conversations endpoint
  await testEndpoint('/api/conversations');
  
  // Test notifications endpoint
  await testEndpoint('/api/notifications');
  
  console.log('All tests completed');
}

// Run the tests
runTests().catch(console.error);
