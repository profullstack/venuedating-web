/**
 * API Test Script
 * 
 * This is a standalone script to test the venues API directly and log the exact responses.
 * Run this in the browser console or include it in an HTML file to see what data is coming 
 * from the backend.
 */

// Import Supabase client if needed
let supabaseJs;
if (typeof window.supabase === 'undefined') {
  try {
    // Try to use the global supabase object if available
    supabaseJs = window.supabaseJs || window.supabase;
  } catch (e) {
    console.warn('Supabase JS not found in global scope');
  }
}

// Only declare these variables if they don't already exist
// This prevents errors when the script is loaded multiple times
if (typeof window.DEFAULT_LAT === 'undefined') {
  window.DEFAULT_LAT = 32.7767; // Dallas, TX
  window.DEFAULT_LNG = -96.7970;
}

// Supabase configuration from the venues.js API module
const SUPABASE_URL = 'https://wdrzazoemadoxbxnxwop.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indkcnphem9lbWFkb3hieG54d29wIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODc4NTYwMzAsImV4cCI6MjAwMzQzMjAzMH0.YLBBTiTKJBMb0z-RjCHjKku1F4LwjWwpH775ufQ6Dv4';

// Create a Supabase client using the imported library
// First check if we already have a supabase client
if (typeof window.supabaseClient === 'undefined') {
  // Import the Supabase client from CDN if not already loaded
  if (typeof supabaseJs === 'undefined') {
    console.error('Supabase JS library not loaded. Please include the Supabase script in your HTML.');
  } else {
    window.supabaseClient = supabaseJs.createClient(SUPABASE_URL, SUPABASE_KEY);
  }
}

/**
 * Direct call to test the venues API endpoint and log the exact response
 */
async function testVenuesAPI() {
  console.group('🔍 API Test: Venues API');
  try {
    console.log('Making direct API call to get venues...');
    
    // Get user's location or use default
    let lat = DEFAULT_LAT;
    let lng = DEFAULT_LNG;
    
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        });
      });
      lat = position.coords.latitude;
      lng = position.coords.longitude;
      console.log(`Using current location: ${lat}, ${lng}`);
    } catch (error) {
      console.warn('Could not get current location, using default:', error);
    }
    
    // Make the API call to get venues within radius
    console.time('API call duration');
    let data, error;
    
    // Try to use the backend API endpoint first (recommended approach)
    try {
      // Get the current session token if available
      let accessToken = null;
      
      // First try to get the session from our test login
      try {
        // Try to get a fresh session
        const session = await testLogin();
        if (session && session.access_token) {
          accessToken = session.access_token;
          console.log('Using fresh test login session token');
        }
      } catch (loginError) {
        console.warn('Could not get fresh test login session:', loginError);
      }
      
      // If no token from test login, try localStorage
      if (!accessToken) {
        try {
          const storedSession = localStorage.getItem('supabase.auth.token');
          if (storedSession) {
            const sessionData = JSON.parse(storedSession);
            accessToken = sessionData?.currentSession?.access_token;
            console.log('Using localStorage session token');
          }
        } catch (storageError) {
          console.warn('Could not access localStorage for auth token:', storageError);
        }
      }
      
      // Try to get token from window.app if available
      if (!accessToken && window.app && window.app.auth && window.app.auth.session) {
        accessToken = window.app.auth.session.access_token;
        console.log('Using window.app session token');
      }
      
      // Try to get token from Supabase client directly
      if (!accessToken && window.supabaseClient) {
        try {
          const { data } = await window.supabaseClient.auth.getSession();
          if (data && data.session) {
            accessToken = data.session.access_token;
            console.log('Using Supabase client session token');
          }
        } catch (sessionError) {
          console.warn('Could not get session from Supabase client:', sessionError);
        }
      }
      
      // Log authentication status
      console.log('Authentication status:', accessToken ? 'Token available' : 'No token available');
      
      const headers = {
        'Content-Type': 'application/json'
      };
      
      // Add Authorization header if we have a token
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }
      
      const response = await fetch('/api/venues/nearby', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          lat,
          lng,
          radius: 10
        })
      });
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }
      
      data = await response.json();
    } catch (fetchError) {
      console.warn('Could not use backend API, falling back to direct Supabase call:', fetchError);
      
      // Fallback to direct Supabase call if available
      if (window.supabaseClient) {
        try {
          const result = await window.supabaseClient.rpc('get_venues_within_radius', {
            p_user_lat: lat,
            p_user_lng: lng,
            p_radius_km: 10
          });
          
          data = result.data;
          error = result.error;
        } catch (supabaseError) {
          error = supabaseError;
        }
      } else {
        error = new Error('Supabase client not available');
      }
    }
    console.timeEnd('API call duration');
    
    if (error) {
      console.error('🚨 API Error:', error);
      return;
    }
    
    console.log(`✅ API returned ${data.length} venues:`);
    console.table(data.map(v => ({
      id: v.id,
      name: v.name,
      lat: v.location_lat || (v.location?.coordinates ? v.location.coordinates[1] : 'N/A'),
      lng: v.location_lng || (v.location?.coordinates ? v.location.coordinates[0] : 'N/A'),
      images: v.images ? JSON.stringify(v.images).substring(0, 50) + '...' : 'None',
      has_location: !!v.location || (!!v.location_lat && !!v.location_lng)
    })));
    
    // Deep inspection of first venue
    if (data.length > 0) {
      console.log('🔍 Detailed inspection of first venue:');
      console.dir(data[0]);
    }
    
    // Check for any suspicious image URLs that might be profile photos
    const suspiciousImages = data
      .filter(v => v.images && v.images.length)
      .flatMap(v => v.images)
      .filter(img => img.includes('profile') || img.includes('avatar') || img.includes('user'));
    
    if (suspiciousImages.length > 0) {
      console.warn('⚠️ Found suspicious images that might be profile photos:', suspiciousImages);
    }
    
    return data;
  } catch (error) {
    console.error('🚨 Test error:', error);
  } finally {
    console.groupEnd();
  }
}

/**
 * Create a simple UI to run the tests
 */
function createTestUI() {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '10px';
  container.style.right = '10px';
  container.style.backgroundColor = '#fff';
  container.style.padding = '10px';
  container.style.borderRadius = '5px';
  container.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
  container.style.zIndex = '1000';
  
  const heading = document.createElement('h3');
  heading.textContent = 'API Test Controls';
  heading.style.margin = '0 0 10px 0';
  
  const button = document.createElement('button');
  button.textContent = 'Test Venues API';
  button.style.padding = '8px 16px';
  button.style.cursor = 'pointer';
  
  button.addEventListener('click', async () => {
    button.disabled = true;
    button.textContent = 'Testing...';
    
    await testVenuesAPI();
    
    button.disabled = false;
    button.textContent = 'Test Again';
  });
  
  container.appendChild(heading);
  container.appendChild(button);
  document.body.appendChild(container);
}

/**
 * Test login function to establish a Supabase session for testing
 * This uses a demo account for API testing purposes only
 */
async function testLogin() {
  console.group('🔑 API Test: Authentication');
  try {
    // Try to initialize Supabase client if not already done
    if (!window.supabaseClient && typeof supabaseJs !== 'undefined') {
      window.supabaseClient = supabaseJs.createClient(SUPABASE_URL, SUPABASE_KEY);
    }
    
    if (!window.supabaseClient) {
      throw new Error('Supabase client not available');
    }
    
    console.log('Attempting to sign in with demo account...');
    
    // Use anonymous key auth for testing
    // This is a workaround for testing only
    const { data, error } = await window.supabaseClient.auth.signInWithPassword({
      email: 'demo@barcrush.app',
      password: 'demo123456'
    });
    
    if (error) {
      console.error('Login error:', error);
      throw error;
    }
    
    console.log('Login successful!', data);
    return data.session;
  } catch (error) {
    console.error('Test login failed:', error);
    return null;
  } finally {
    console.groupEnd();
  }
}

// Initialize the test UI when the script is loaded
document.addEventListener('DOMContentLoaded', async () => {
  // Try to login first
  await testLogin();
  // Then create the test UI
  createTestUI();
});

// Allow direct console usage
window.testVenuesAPI = testVenuesAPI;

// Auto-run the test
setTimeout(testVenuesAPI, 1000);
