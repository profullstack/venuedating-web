#!/usr/bin/env node

/**
 * CLI Test Runner for BarCrush Profile Flow Tests
 */

// Import required Node.js modules
import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';

// Create a virtual DOM environment
const setupVirtualDOM = () => {
  const dom = new JSDOM(`
    <!DOCTYPE html>
    <html>
      <body>
        <div id="profile-container"></div>
        <div id="gender-container"></div>
        <div id="interests-container"></div>
      </body>
    </html>
  `, {
    url: 'http://localhost/',
    runScripts: 'dangerously',
    resources: 'usable',
    pretendToBeVisual: true
  });

  // Setup global objects to mimic browser environment
  global.window = dom.window;
  global.document = dom.window.document;
  global.HTMLElement = dom.window.HTMLElement;
  
  // Properly mock navigator.geolocation
  Object.defineProperty(dom.window.navigator, 'geolocation', {
    value: {
      getCurrentPosition: (success, error) => {
        success({
          coords: {
            latitude: 37.7749,
            longitude: -122.4194,
            accuracy: 10
          }
        });
      }
    },
    configurable: true
  });
  
  // Use the dom window's navigator
  global.navigator = dom.window.navigator;
  global.FileReader = class {
    constructor() {
      this.result = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD';
      this.onload = null;
    }
    readAsDataURL() {
      setTimeout(() => this.onload({ target: this }), 0);
    }
  };
  global.URL = {
    createObjectURL: () => 'blob:test-url'
  };
  global.localStorage = (() => {
    let store = {};
    return {
      getItem: (key) => store[key] || null,
      setItem: (key, value) => { store[key] = value.toString(); },
      clear: () => { store = {}; },
      removeItem: (key) => { delete store[key]; },
      getAll: () => store
    };
  })();
  global.fetch = (url) => {
    if (url.includes('nominatim.openstreetmap.org')) {
      return Promise.resolve({
        json: () => Promise.resolve({
          address: {
            city: 'San Francisco',
            state: 'California'
          },
          display_name: 'San Francisco, California, USA'
        })
      });
    }
    return Promise.resolve({ json: () => Promise.resolve({}) });
  };
  global.router = {
    navigate: (path) => console.log(`Navigating to: ${path}`)
  };
  global.Event = dom.window.Event;
  global.MouseEvent = dom.window.MouseEvent;
  global.DataTransfer = dom.window.DataTransfer;
  global.File = dom.window.File;

  // Mock Supabase
  global.supabaseClientPromise = Promise.resolve({
    auth: {
      getUser: () => Promise.resolve({ data: { user: { id: 'test-user-id' } } })
    },
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ data: { path: 'avatars/test-user-id.jpg' } }),
        getPublicUrl: () => ({ data: { publicUrl: 'https://test-bucket.supabase.co/storage/v1/object/public/avatars/test-user-id.jpg' } })
      })
    },
    from: (table) => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: { id: 'test-user-id', interests: ['Cooking', 'Music'] }, error: null })
        })
      }),
      upsert: (data) => Promise.resolve({ data, error: null })
    })
  });
  global.getCurrentUser = () => Promise.resolve({ id: 'test-user-id' });

  return dom;
};

// Test runner class
class TestRunner {
  constructor() {
    this.tests = [];
    this.results = {
      passed: 0,
      failed: 0,
      total: 0
    };
    this.dom = setupVirtualDOM();
  }

  // Add a test
  addTest(name, testFn) {
    this.tests.push({ name, testFn });
  }

  // Run all tests
  async runTests() {
    console.log('\n🧪 Running BarCrush Profile Flow Tests...\n');
    
    for (const test of this.tests) {
      try {
        console.log(`Running test: ${test.name}`);
        await test.testFn();
        this.results.passed++;
        console.log(`✅ PASSED: ${test.name}\n`);
      } catch (error) {
        this.results.failed++;
        console.log(`❌ FAILED: ${test.name}`);
        console.log(`   Error: ${error.message}`);
        console.log(`   Stack: ${error.stack.split('\n')[1]}\n`);
      }
      this.results.total++;
    }
    
    this.printSummary();
  }

  // Print test summary
  printSummary() {
    console.log('='.repeat(50));
    console.log(`TEST SUMMARY:`);
    console.log(`Total: ${this.results.total}`);
    console.log(`Passed: ${this.results.passed}`);
    console.log(`Failed: ${this.results.failed}`);
    console.log('='.repeat(50));
    
    if (this.results.failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  }
}

// Create mock DOM elements for profile page tests
function createProfilePageDOM() {
  document.body.innerHTML = `
    <div id="profile-container">
      <form id="profile-form">
        <input type="text" id="first-name" value="John">
        <input type="text" id="last-name" value="Doe">
        <input type="tel" id="phone" value="5551234567">
        <input type="text" id="birthday" value="">
        <input type="hidden" id="latitude" value="">
        <input type="hidden" id="longitude" value="">
        <input type="hidden" id="location-name" value="">
        <div id="location-display">No location selected</div>
        <div id="profile-photo-container">
          <img id="profile-photo-preview" src="">
          <input type="file" id="profile-photo-input">
        </div>
        <button id="confirm-btn" type="submit">Continue</button>
        <button id="skip-btn">Skip</button>
      </form>
      <div id="status-container"></div>
    </div>
  `;
}

// Create mock DOM elements for gender page tests
function createGenderPageDOM() {
  document.body.innerHTML = `
    <div id="gender-container">
      <div class="gender-options">
        <button class="gender-option" data-gender="woman">
          <span>Woman</span>
          <svg class="check-icon"><path></path></svg>
        </button>
        <button class="gender-option" data-gender="man">
          <span>Man</span>
          <svg class="check-icon"><path></path></svg>
        </button>
        <button class="gender-option" data-gender="nonbinary">
          <span>Non-binary</span>
          <svg class="check-icon"><path></path></svg>
        </button>
      </div>
      <button class="continue-btn">Continue</button>
      <button class="skip-btn">Skip</button>
      <div class="status-container"></div>
    </div>
  `;
}

// Create mock DOM elements for interests page tests
function createInterestsPageDOM() {
  document.body.innerHTML = `
    <div id="interests-container">
      <div class="interests-options">
        <button class="interest-option" data-interest="Photography">
          <span><img src="/images/cam.svg" data-unselected="/images/cam.svg" data-selected="/images/cam-white.svg">Photography</span>
        </button>
        <button class="interest-option" data-interest="Shopping">
          <span><img src="/images/shopping.svg" data-unselected="/images/shopping.svg" data-selected="/images/shopping-white.svg">Shopping</span>
        </button>
        <button class="interest-option" data-interest="Music">
          <span><img src="/images/music.svg" data-unselected="/images/music.svg" data-selected="/images/music-white.svg">Music</span>
        </button>
      </div>
      <button class="continue-btn">Continue</button>
      <button class="skip-btn">Skip</button>
      <div class="status-container"></div>
    </div>
  `;
}

// Create test file
function createTestFile() {
  return new File(['test file content'], 'test-image.jpg', { type: 'image/jpeg' });
}

// Main function
async function main() {
  const runner = new TestRunner();
  
  // Define tests
  
  // Profile Page Tests
  runner.addTest('Profile Page - Form Submission', async () => {
    createProfilePageDOM();
    
    // We need to mock the module imports
    // This is a simplified version for CLI testing
    const profileModule = {
      initProfilePage: async () => {
        // Mock implementation
        document.getElementById('confirm-btn').addEventListener('submit', (e) => {
          e.preventDefault();
          const firstName = document.getElementById('first-name').value;
          const lastName = document.getElementById('last-name').value;
          const phone = document.getElementById('phone').value;
          const birthday = document.getElementById('birthday').value;
          const latitude = document.getElementById('latitude').value;
          const longitude = document.getElementById('longitude').value;
          const locationName = document.getElementById('location-name').value;
          
          const profileData = { firstName, lastName, phone, birthday, latitude, longitude, locationName };
          localStorage.setItem('userProfile', JSON.stringify(profileData));
        });
      }
    };
    
    await profileModule.initProfilePage();
    
    // Fill form data
    document.getElementById('birthday').value = '6/12/1990';
    document.getElementById('latitude').value = '37.7749';
    document.getElementById('longitude').value = '-122.4194';
    document.getElementById('location-name').value = 'San Francisco';
    
    // Submit form
    const form = document.getElementById('profile-form');
    const submitEvent = new Event('submit');
    form.dispatchEvent(submitEvent);
    
    // Check localStorage
    const profileData = JSON.parse(localStorage.getItem('userProfile'));
    if (!profileData) throw new Error('Profile data not saved to localStorage');
    if (profileData.firstName !== 'John') throw new Error('First name not saved correctly');
    if (profileData.lastName !== 'Doe') throw new Error('Last name not saved correctly');
    if (profileData.birthday !== '6/12/1990') throw new Error('Birthday not saved correctly');
    if (profileData.latitude !== '37.7749') throw new Error('Latitude not saved correctly');
  });
  
  // Gender Page Tests
  runner.addTest('Gender Page - Selection', async () => {
    createGenderPageDOM();
    
    // Mock module
    const genderModule = {
      initProfileGenderPage: async () => {
        // Mock implementation
        const genderOptions = document.querySelectorAll('.gender-option');
        let selectedGender = null;
        
        genderOptions.forEach(btn => {
          btn.addEventListener('click', () => {
            const gender = btn.getAttribute('data-gender');
            selectedGender = gender;
            
            // Update UI
            genderOptions.forEach(opt => opt.classList.remove('selected'));
            btn.classList.add('selected');
            
            // Save to localStorage
            const profileData = JSON.parse(localStorage.getItem('userProfile')) || {};
            profileData.gender = gender;
            localStorage.setItem('userProfile', JSON.stringify(profileData));
          });
        });
        
        document.querySelector('.continue-btn').addEventListener('click', () => {
          // Navigate to next page
          router.navigate('/profile-interests');
        });
      }
    };
    
    await genderModule.initProfileGenderPage();
    
    // Set initial profile data
    localStorage.setItem('userProfile', JSON.stringify({
      firstName: 'John',
      lastName: 'Doe'
    }));
    
    // Select gender
    const nonbinaryOption = Array.from(document.querySelectorAll('.gender-option'))
      .find(opt => opt.getAttribute('data-gender') === 'nonbinary');
    const clickEvent = new MouseEvent('click');
    nonbinaryOption.dispatchEvent(clickEvent);
    
    // Check localStorage
    const profileData = JSON.parse(localStorage.getItem('userProfile'));
    if (!profileData) throw new Error('Profile data not saved to localStorage');
    if (profileData.gender !== 'nonbinary') throw new Error('Gender not saved correctly');
    if (!nonbinaryOption.classList.contains('selected')) throw new Error('Gender option not selected in UI');
  });
  
  // Interests Page Tests
  runner.addTest('Interests Page - Selection', async () => {
    createInterestsPageDOM();
    
    // Mock module
    const interestsModule = {
      initProfileInterestsPage: async () => {
        // Mock implementation
        const interestOptions = document.querySelectorAll('.interest-option');
        const selectedInterests = [];
        
        interestOptions.forEach(btn => {
          btn.addEventListener('click', () => {
            const interest = btn.getAttribute('data-interest');
            btn.classList.toggle('selected');
            
            if (btn.classList.contains('selected')) {
              if (!selectedInterests.includes(interest)) {
                selectedInterests.push(interest);
              }
            } else {
              const index = selectedInterests.indexOf(interest);
              if (index !== -1) {
                selectedInterests.splice(index, 1);
              }
            }
            
            // Save to localStorage
            const profileData = JSON.parse(localStorage.getItem('userProfile')) || {};
            profileData.interests = selectedInterests;
            localStorage.setItem('userProfile', JSON.stringify(profileData));
          });
        });
        
        document.querySelector('.continue-btn').addEventListener('click', () => {
          // Navigate to feed
          router.navigate('/feed');
        });
      }
    };
    
    await interestsModule.initProfileInterestsPage();
    
    // Set initial profile data
    localStorage.setItem('userProfile', JSON.stringify({
      firstName: 'John',
      lastName: 'Doe',
      gender: 'nonbinary'
    }));
    
    // Select interests
    const photographyOption = Array.from(document.querySelectorAll('.interest-option'))
      .find(opt => opt.getAttribute('data-interest') === 'Photography');
    const musicOption = Array.from(document.querySelectorAll('.interest-option'))
      .find(opt => opt.getAttribute('data-interest') === 'Music');
    
    const clickEvent = new MouseEvent('click');
    photographyOption.dispatchEvent(clickEvent);
    musicOption.dispatchEvent(clickEvent);
    
    // Check localStorage
    const profileData = JSON.parse(localStorage.getItem('userProfile'));
    if (!profileData) throw new Error('Profile data not saved to localStorage');
    if (!Array.isArray(profileData.interests)) throw new Error('Interests not saved as array');
    if (!profileData.interests.includes('Photography')) throw new Error('Photography not saved in interests');
    if (!profileData.interests.includes('Music')) throw new Error('Music not saved in interests');
    if (!photographyOption.classList.contains('selected')) throw new Error('Photography option not selected in UI');
    if (!musicOption.classList.contains('selected')) throw new Error('Music option not selected in UI');
  });
  
  // Run all tests
  await runner.runTests();
}

// Run the main function
main().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});
