/**
 * Profile Flow Integration Tests
 * Tests the complete profile setup flow with Supabase integration
 */

// Mock dependencies
const mockSupabase = {
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
        single: () => Promise.resolve({ data: null, error: null })
      })
    }),
    upsert: (data) => Promise.resolve({ data, error: null })
  })
};

// Mock localStorage
const mockLocalStorage = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value.toString(); },
    clear: () => { store = {}; },
    removeItem: (key) => { delete store[key]; },
    getAll: () => store
  };
})();

// Mock DOM elements
function createMockDOM() {
  // Profile page elements
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
  
  // Gender page elements
  document.body.innerHTML += `
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
  
  // Interests page elements
  document.body.innerHTML += `
    <div id="interests-container">
      <div class="interests-options">
        <button class="interest-option" data-interest="Photography">
          <span><img src="/images/cam.svg" data-unselected="/images/cam.svg" data-selected="/images/cam-white.svg">Photography</span>
        </button>
        <button class="interest-option" data-interest="Shopping">
          <span><img src="/images/shopping.svg" data-unselected="/images/shopping.svg" data-selected="/images/shopping.white.svg">Shopping</span>
        </button>
        <button class="interest-option" data-interest="Music">
          <span><img src="/images/music.svg" data-unselected="/images/music.svg" data-selected="/images/music.white.svg">Music</span>
        </button>
      </div>
      <button class="continue-btn">Continue</button>
      <button class="skip-btn">Skip</button>
      <div class="status-container"></div>
    </div>
  `;
  
  // Mock window.router
  window.router = {
    navigate: (path) => console.log(`Navigating to: ${path}`)
  };
  
  // Mock FileReader
  window.FileReader = class {
    constructor() {
      this.result = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD';
      this.onload = null;
    }
    readAsDataURL() {
      setTimeout(() => this.onload({ target: this }), 0);
    }
  };
  
  // Mock createObjectURL
  URL.createObjectURL = () => 'blob:test-url';
  
  // Mock geolocation
  navigator.geolocation = {
    getCurrentPosition: (success) => {
      success({ 
        coords: { 
          latitude: 37.7749, 
          longitude: -122.4194 
        } 
      });
    }
  };
  
  // Mock fetch for reverse geocoding
  window.fetch = (url) => {
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
}

// Test utilities
function createTestFile() {
  return new File(['test file content'], 'test-image.jpg', { type: 'image/jpeg' });
}

// Test the profile page
async function testProfilePage() {
  console.log('Testing profile page...');
  
  // Import the module under test
  const { initProfilePage } = await import('../profile-page.js');
  
  // Initialize the profile page
  await initProfilePage();
  
  // Fill in the form
  const firstNameInput = document.getElementById('first-name');
  const lastNameInput = document.getElementById('last-name');
  const phoneInput = document.getElementById('phone');
  const birthdayInput = document.getElementById('birthday');
  const photoInput = document.getElementById('profile-photo-input');
  const confirmBtn = document.getElementById('confirm-btn');
  
  // Test photo upload
  const file = createTestFile();
  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(file);
  photoInput.files = dataTransfer.files;
  
  // Trigger change event
  const photoChangeEvent = new Event('change');
  photoInput.dispatchEvent(photoChangeEvent);
  
  // Test birthday selection
  const birthdayClickEvent = new MouseEvent('click');
  birthdayInput.dispatchEvent(birthdayClickEvent);
  
  // Manually set birthday since we can't interact with the modal in tests
  birthdayInput.value = '6/12/1990';
  
  // Test location selection
  const locationDisplay = document.getElementById('location-display');
  const locationClickEvent = new MouseEvent('click');
  locationDisplay.dispatchEvent(locationClickEvent);
  
  // Manually set location since we can't interact with the map in tests
  document.getElementById('latitude').value = '37.7749';
  document.getElementById('longitude').value = '-122.4194';
  document.getElementById('location-name').value = 'San Francisco';
  locationDisplay.textContent = 'San Francisco, California, USA';
  
  // Submit the form
  const submitEvent = new Event('submit');
  confirmBtn.form.dispatchEvent(submitEvent);
  
  // Check localStorage
  const profileData = JSON.parse(mockLocalStorage.getItem('userProfile'));
  console.assert(profileData.firstName === 'John', 'First name should be saved');
  console.assert(profileData.lastName === 'Doe', 'Last name should be saved');
  console.assert(profileData.phone === '5551234567', 'Phone should be saved');
  console.assert(profileData.birthday === '6/12/1990', 'Birthday should be saved');
  console.assert(profileData.latitude === '37.7749', 'Latitude should be saved');
  console.assert(profileData.longitude === '-122.4194', 'Longitude should be saved');
  console.assert(profileData.locationName === 'San Francisco', 'Location name should be saved');
  
  console.log('Profile page test completed');
}

// Test the gender page
async function testGenderPage() {
  console.log('Testing gender page...');
  
  // Import the module under test
  const { initProfileGenderPage } = await import('../profile-gender.js');
  
  // Initialize the gender page
  await initProfileGenderPage();
  
  // Select a gender
  const genderOptions = document.querySelectorAll('.gender-option');
  const nonbinaryOption = Array.from(genderOptions).find(opt => opt.getAttribute('data-gender') === 'nonbinary');
  const clickEvent = new MouseEvent('click');
  nonbinaryOption.dispatchEvent(clickEvent);
  
  // Submit the form
  const continueBtn = document.querySelector('.continue-btn');
  const clickContinueEvent = new MouseEvent('click');
  continueBtn.dispatchEvent(clickContinueEvent);
  
  // Check localStorage
  const profileData = JSON.parse(mockLocalStorage.getItem('userProfile'));
  console.assert(profileData.gender === 'nonbinary', 'Gender should be saved');
  
  console.log('Gender page test completed');
}

// Test the interests page
async function testInterestsPage() {
  console.log('Testing interests page...');
  
  // Import the module under test
  const { initProfileInterestsPage } = await import('../profile-interests.js');
  
  // Initialize the interests page
  await initProfileInterestsPage();
  
  // Select interests
  const interestOptions = document.querySelectorAll('.interest-option');
  const photographyOption = Array.from(interestOptions).find(opt => opt.getAttribute('data-interest') === 'Photography');
  const musicOption = Array.from(interestOptions).find(opt => opt.getAttribute('data-interest') === 'Music');
  
  const clickEvent = new MouseEvent('click');
  photographyOption.dispatchEvent(clickEvent);
  musicOption.dispatchEvent(clickEvent);
  
  // Submit the form
  const continueBtn = document.querySelector('.continue-btn');
  const clickContinueEvent = new MouseEvent('click');
  continueBtn.dispatchEvent(clickContinueEvent);
  
  // Check localStorage
  const profileData = JSON.parse(mockLocalStorage.getItem('userProfile'));
  console.assert(Array.isArray(profileData.interests), 'Interests should be an array');
  console.assert(profileData.interests.includes('Photography'), 'Photography should be in interests');
  console.assert(profileData.interests.includes('Music'), 'Music should be in interests');
  console.assert(profileData.interests.length === 2, 'Should have 2 interests');
  
  console.log('Interests page test completed');
}

// Run all tests
async function runTests() {
  try {
    console.log('Starting profile flow integration tests...');
    
    // Setup mocks
    createMockDOM();
    Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });
    
    // Mock imports
    window.supabaseClientPromise = Promise.resolve(mockSupabase);
    window.getCurrentUser = () => Promise.resolve({ id: 'test-user-id' });
    
    // Run tests in sequence
    await testProfilePage();
    await testGenderPage();
    await testInterestsPage();
    
    console.log('All tests completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run tests when the script is loaded
runTests();

// Export for manual testing
export { runTests };
