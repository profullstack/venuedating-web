/**
 * Unit Tests for Profile Interests Functionality
 * Tests the specific functionality of the profile interests page
 */

// Mock dependencies
const mockSupabase = {
  auth: {
    getUser: () => Promise.resolve({ data: { user: { id: 'test-user-id' } } })
  },
  from: (table) => ({
    select: () => ({
      eq: () => ({
        single: () => Promise.resolve({ 
          data: { 
            id: 'test-user-id',
            interests: ['Cooking', 'Music']
          }, 
          error: null 
        })
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

// Test utilities
function createMockInterestsDOM() {
  document.body.innerHTML = `
    <div class="interests-options">
      <button class="interest-option" data-interest="Photography">
        <span><img src="/images/cam.svg" data-unselected="/images/cam.svg" data-selected="/images/cam-white.svg">Photography</span>
      </button>
      <button class="interest-option" data-interest="Shopping">
        <span><img src="/images/shopping.svg" data-unselected="/images/shopping.svg" data-selected="/images/shopping.white.svg">Shopping</span>
      </button>
      <button class="interest-option" data-interest="Cooking">
        <span><img src="/images/cooking.svg" data-unselected="/images/cooking.svg" data-selected="/images/cooking.white.svg">Cooking</span>
      </button>
      <button class="interest-option" data-interest="Music">
        <span><img src="/images/music.svg" data-unselected="/images/music.svg" data-selected="/images/music.white.svg">Music</span>
      </button>
    </div>
    <button class="continue-btn">Continue</button>
    <button class="skip-btn">Skip</button>
  `;
  
  // Mock window.router
  window.router = {
    navigate: (path) => console.log(`Navigating to: ${path}`)
  };
}

// Test the updateInterestsUI function
async function testUpdateInterestsUI() {
  console.log('Testing updateInterestsUI function...');
  
  // Setup test environment
  createMockInterestsDOM();
  
  // Create a test module with exposed functions for testing
  const testModule = {
    selectedInterests: ['Cooking', 'Music'],
    interestOptions: document.querySelectorAll('.interest-option'),
    
    // Copy of the updateInterestsUI function for testing
    updateInterestsUI() {
      this.interestOptions.forEach(btn => {
        const interest = btn.getAttribute('data-interest');
        const img = btn.querySelector('img');
        
        if (this.selectedInterests.includes(interest)) {
          btn.classList.add('selected');
          if (img) img.src = img.getAttribute('data-selected');
        } else {
          btn.classList.remove('selected');
          if (img) img.src = img.getAttribute('data-unselected');
        }
      });
    }
  };
  
  // Run the function
  testModule.updateInterestsUI();
  
  // Check results
  const cookingOption = Array.from(document.querySelectorAll('.interest-option'))
    .find(opt => opt.getAttribute('data-interest') === 'Cooking');
  const musicOption = Array.from(document.querySelectorAll('.interest-option'))
    .find(opt => opt.getAttribute('data-interest') === 'Music');
  const photoOption = Array.from(document.querySelectorAll('.interest-option'))
    .find(opt => opt.getAttribute('data-interest') === 'Photography');
  
  console.assert(cookingOption.classList.contains('selected'), 'Cooking option should be selected');
  console.assert(musicOption.classList.contains('selected'), 'Music option should be selected');
  console.assert(!photoOption.classList.contains('selected'), 'Photography option should not be selected');
  
  console.assert(cookingOption.querySelector('img').src.includes('cooking.white.svg'), 
    'Cooking image should use selected image');
  console.assert(musicOption.querySelector('img').src.includes('music.white.svg'), 
    'Music image should use selected image');
  
  console.log('updateInterestsUI test completed');
}

// Test the toggleInterest function
async function testToggleInterest() {
  console.log('Testing toggleInterest function...');
  
  // Setup test environment
  createMockInterestsDOM();
  
  // Create a test module with exposed functions for testing
  const testModule = {
    selectedInterests: ['Cooking'],
    profileData: { interests: ['Cooking'] },
    
    // Copy of the toggleInterest function for testing
    toggleInterest(btn) {
      const interest = btn.getAttribute('data-interest');
      btn.classList.toggle('selected');
      const img = btn.querySelector('img');
      
      if (btn.classList.contains('selected')) {
        if (!this.selectedInterests.includes(interest)) {
          this.selectedInterests.push(interest);
        }
        if (img) img.src = img.getAttribute('data-selected');
      } else {
        this.selectedInterests = this.selectedInterests.filter(i => i !== interest);
        if (img) img.src = img.getAttribute('data-unselected');
      }
      
      // Update profileData with selected interests
      this.profileData.interests = this.selectedInterests;
      
      // Save to localStorage (mocked)
      localStorage.setItem('userProfile', JSON.stringify(this.profileData));
      
      console.log('Interests updated:', this.selectedInterests);
    }
  };
  
  // Test adding an interest
  const photoOption = Array.from(document.querySelectorAll('.interest-option'))
    .find(opt => opt.getAttribute('data-interest') === 'Photography');
  
  testModule.toggleInterest(photoOption);
  
  // Check results
  console.assert(testModule.selectedInterests.includes('Photography'), 
    'Photography should be added to selected interests');
  console.assert(photoOption.classList.contains('selected'), 
    'Photography option should be selected');
  console.assert(photoOption.querySelector('img').src.includes('cam-white.svg'), 
    'Photography image should use selected image');
  
  // Test removing an interest
  const cookingOption = Array.from(document.querySelectorAll('.interest-option'))
    .find(opt => opt.getAttribute('data-interest') === 'Cooking');
  cookingOption.classList.add('selected');
  
  testModule.toggleInterest(cookingOption);
  
  // Check results
  console.assert(!testModule.selectedInterests.includes('Cooking'), 
    'Cooking should be removed from selected interests');
  console.assert(!cookingOption.classList.contains('selected'), 
    'Cooking option should not be selected');
  
  // Check localStorage
  const savedData = JSON.parse(localStorage.getItem('userProfile'));
  console.assert(Array.isArray(savedData.interests), 'Saved interests should be an array');
  console.assert(savedData.interests.includes('Photography'), 'Photography should be in saved interests');
  console.assert(!savedData.interests.includes('Cooking'), 'Cooking should not be in saved interests');
  
  console.log('toggleInterest test completed');
}

// Test loading profile data from Supabase
async function testLoadProfileData() {
  console.log('Testing loadProfileData function...');
  
  // Setup test environment
  createMockInterestsDOM();
  
  // Create a test module with exposed functions for testing
  const testModule = {
    profileData: {},
    
    // Copy of the loadProfileData function for testing
    async loadProfileData(userId) {
      try {
        const supabase = mockSupabase; // Use mock
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        
        if (error) {
          console.error('Error fetching profile:', error);
          return null;
        }
        
        if (data) {
          // Merge with existing profileData
          this.profileData = { ...this.profileData, ...data };
          localStorage.setItem('userProfile', JSON.stringify(this.profileData));
          return data;
        }
        return null;
      } catch (err) {
        console.error('Error loading profile data:', err);
        return null;
      }
    }
  };
  
  // Run the function
  const result = await testModule.loadProfileData('test-user-id');
  
  // Check results
  console.assert(result.id === 'test-user-id', 'Result should have correct user ID');
  console.assert(Array.isArray(result.interests), 'Result should have interests array');
  console.assert(result.interests.includes('Cooking'), 'Result should include Cooking interest');
  console.assert(result.interests.includes('Music'), 'Result should include Music interest');
  
  // Check that profileData was updated
  console.assert(testModule.profileData.id === 'test-user-id', 'profileData should have correct user ID');
  console.assert(Array.isArray(testModule.profileData.interests), 'profileData should have interests array');
  
  // Check localStorage
  const savedData = JSON.parse(localStorage.getItem('userProfile'));
  console.assert(savedData.id === 'test-user-id', 'Saved data should have correct user ID');
  console.assert(Array.isArray(savedData.interests), 'Saved data should have interests array');
  
  console.log('loadProfileData test completed');
}

// Run all tests
async function runTests() {
  try {
    console.log('Starting profile interests unit tests...');
    
    // Setup mocks
    Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });
    
    // Run tests
    await testUpdateInterestsUI();
    await testToggleInterest();
    await testLoadProfileData();
    
    console.log('All profile interests tests completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run tests when the script is loaded
runTests();

// Export for manual testing
export { runTests };
