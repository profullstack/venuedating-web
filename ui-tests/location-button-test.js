/**
 * UI Test for Location Button Functionality
 * Tests the location selection button and map modal in the profile page
 * 
 * This test assumes you have a local server running at http://localhost:8080
 * You can start the server with: python -m http.server 8080 --directory public
 */

import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Test configuration
const TEST_TIMEOUT = 30000; // 30 seconds
const BASE_URL = `http://localhost:8080`;

console.log(`
=================================================
🧪 LOCATION BUTTON UI TEST 🧪
=================================================

Make sure your local server is running with:
python -m http.server 8080 --directory public

=================================================
`);


/**
 * Main test function
 */
async function runTest() {
  let browser;
  
  try {
    // Launch browser with explicit Chrome path
    browser = await puppeteer.launch({
      headless: false, // Set to true for headless mode
      executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', // macOS path
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 375, height: 812 } // Mobile viewport
    });
    
    const page = await browser.newPage();
    
    // Mock geolocation
    await page.evaluateOnNewDocument(() => {
      const mockGeolocation = {
        getCurrentPosition: (cb) => {
          cb({
            coords: {
              latitude: 37.7749,
              longitude: -122.4194,
              accuracy: 10
            }
          });
        },
        watchPosition: (cb) => {
          cb({
            coords: {
              latitude: 37.7749,
              longitude: -122.4194,
              accuracy: 10
            }
          });
          return 1;
        },
        clearWatch: () => {}
      };
      
      navigator.geolocation = mockGeolocation;
    });
    
    // Mock localStorage with test profile data
    await page.evaluateOnNewDocument(() => {
      const profileData = {
        firstName: 'Test',
        lastName: 'User',
        phoneNumber: '123-456-7890'
      };
      
      localStorage.setItem('userProfile', JSON.stringify(profileData));
    });
    
    // Mock Nominatim API response for reverse geocoding
    await page.setRequestInterception(true);
    page.on('request', request => {
      if (request.url().includes('nominatim.openstreetmap.org')) {
        request.respond({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            address: {
              city: 'San Francisco',
              state: 'California',
              country: 'United States'
            },
            display_name: 'San Francisco, California, USA'
          })
        });
      } else {
        request.continue();
      }
    });
    
    // Navigate to profile page
    console.log('Navigating to profile page...');
    await page.goto(`${BASE_URL}/profile`);
    await page.waitForSelector('.profile-container', { timeout: TEST_TIMEOUT });
    
    // Test 1: Verify location button exists
    console.log('Test 1: Verifying location button exists...');
    const locationButton = await page.$('.location-btn');
    if (!locationButton) {
      throw new Error('Location button not found');
    }
    console.log('✅ Location button found');
    
    // Test 2: Click location button and verify map modal appears
    console.log('Test 2: Testing location button click...');
    await locationButton.click();
    await page.waitForSelector('#map-modal.visible', { timeout: TEST_TIMEOUT });
    console.log('✅ Map modal appeared after clicking location button');
    
    // Test 3: Verify map is loaded in modal
    console.log('Test 3: Verifying map is loaded...');
    await page.waitForSelector('.leaflet-container', { timeout: TEST_TIMEOUT });
    console.log('✅ Leaflet map loaded successfully');
    
    // Test 4: Test "Use Current Location" button
    console.log('Test 4: Testing "Use Current Location" button...');
    const currentLocationButton = await page.$('.current-location-btn');
    await currentLocationButton.click();
    
    // Wait for location to be set
    await page.waitForFunction(() => {
      const text = document.querySelector('#selected-location-text').textContent;
      return text.includes('Selected:') && !text.includes('Loading');
    }, { timeout: TEST_TIMEOUT });
    
    const locationText = await page.$eval('#selected-location-text', el => el.textContent);
    console.log(`Location text: ${locationText}`);
    console.log('✅ Current location button works');
    
    // Test 5: Test confirm button
    console.log('Test 5: Testing confirm button...');
    const confirmButton = await page.$('.modal-buttons .confirm-btn');
    await confirmButton.click();
    
    // Wait for modal to close
    await page.waitForFunction(() => {
      return !document.querySelector('#map-modal.visible');
    }, { timeout: TEST_TIMEOUT });
    console.log('✅ Confirm button closes the modal');
    
    // Test 6: Verify location button text is updated
    console.log('Test 6: Verifying location button text is updated...');
    await page.waitForFunction(() => {
      const btnText = document.querySelector('.location-btn span').textContent;
      return btnText.includes('San Francisco') || btnText.includes('Location set');
    }, { timeout: TEST_TIMEOUT });
    
    const updatedButtonText = await page.$eval('.location-btn span', el => el.textContent);
    console.log(`Updated button text: ${updatedButtonText}`);
    console.log('✅ Location button text updated successfully');
    
    // Test 7: Verify location button has "has-value" class
    console.log('Test 7: Verifying location button has "has-value" class...');
    const hasValueClass = await page.$eval('.location-btn', el => el.classList.contains('has-value'));
    if (!hasValueClass) {
      throw new Error('Location button does not have "has-value" class');
    }
    console.log('✅ Location button has "has-value" class');
    
    // Test 8: Verify location data is saved to localStorage
    console.log('Test 8: Verifying location data is saved to localStorage...');
    const localStorage = await page.evaluate(() => {
      return JSON.parse(window.localStorage.getItem('userProfile'));
    });
    
    if (!localStorage.location || !localStorage.latitude || !localStorage.longitude) {
      throw new Error('Location data not saved to localStorage');
    }
    console.log('✅ Location data saved to localStorage successfully');
    
    console.log('\n✅✅✅ All tests passed! ✅✅✅');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // Cleanup
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
runTest();
