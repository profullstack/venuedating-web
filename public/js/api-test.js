/**
 * API Test Script
 * 
 * This is a standalone script to test the venues API directly and log the exact responses.
 * Run this in the browser console or include it in an HTML file to see what data is coming 
 * from the backend.
 */

// Default coordinates (Dallas, TX)
const DEFAULT_LAT = 32.7767;
const DEFAULT_LNG = -96.7970;

// Supabase configuration from the venues.js API module
const SUPABASE_URL = 'https://wdrzazoemadoxbxnxwop.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indkcnphem9lbWFkb3hieG54d29wIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODc4NTYwMzAsImV4cCI6MjAwMzQzMjAzMH0.YLBBTiTKJBMb0z-RjCHjKku1F4LwjWwpH775ufQ6Dv4';

// Create a Supabase client
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

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
    const { data, error } = await supabase.rpc('get_venues_within_radius', {
      p_user_lat: lat,
      p_user_lng: lng,
      p_radius_km: 10
    });
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

// Initialize the test UI when the script is loaded
document.addEventListener('DOMContentLoaded', createTestUI);

// Allow direct console usage
window.testVenuesAPI = testVenuesAPI;

// Auto-run the test
setTimeout(testVenuesAPI, 1000);
