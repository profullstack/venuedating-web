/**
 * Profile interests selection page functionality
 * Handles interests selection and integration with Supabase
 */
import { supabaseClientPromise } from './supabase-client.js';
import { getCurrentUser } from './auth.js';

// Session storage key for profile data during onboarding
const PROFILE_STORAGE_KEY = 'userProfile';

export async function initProfileInterestsPage() {
  
  // Load validation and animation CSS
  if (!document.getElementById('form-validation-css')) {
    const link = document.createElement('link');
    link.id = 'form-validation-css';
    link.rel = 'stylesheet';
    link.href = '/css/form-validation.css';
    document.head.appendChild(link);
  }
  
  if (!document.getElementById('animations-css')) {
    const link = document.createElement('link');
    link.id = 'animations-css';
    link.rel = 'stylesheet';
    link.href = '/css/animations.css';
    document.head.appendChild(link);
  }
  
  // DOM elements
  const interestOptions = document.querySelectorAll('.interest-option');
  const continueBtn = document.getElementById('continue-btn') || document.querySelector('.continue-btn');
  const skipBtn = document.getElementById('skip-btn') || document.querySelector('.skip-btn');
  
  // State variables
  let selectedInterests = [];
  let currentUser = null;
  let profileData = {};
  
  // Add validation feedback element
  const validationFeedback = document.createElement('div');
  validationFeedback.className = 'validation-feedback';
  validationFeedback.style.textAlign = 'center';
  validationFeedback.style.marginTop = '10px';
  const interestsContainer = document.querySelector('.interests-container');
  
  // Add counter for selected interests
  const interestCounter = document.createElement('div');
  interestCounter.className = 'interest-counter';
  interestCounter.style.textAlign = 'center';
  interestCounter.style.marginBottom = '15px';
  interestCounter.style.fontSize = '14px';
  interestCounter.style.color = '#777';
  interestCounter.textContent = 'Selected: 0 / 5 (minimum 1 required)';
  
  // Insert elements in the correct order
  if (interestsContainer) {
    // Insert before continue button if it exists
    if (continueBtn) {
      interestsContainer.insertBefore(validationFeedback, continueBtn);
      interestsContainer.insertBefore(interestCounter, validationFeedback);
    } else {
      // Otherwise append to the container
      interestsContainer.appendChild(interestCounter);
      interestsContainer.appendChild(validationFeedback);
    }
  }
  
  // Initially disable continue button
  if (continueBtn) {
    continueBtn.disabled = true;
    continueBtn.classList.add('button-disabled');
  }
  
  // Create status message container
  const statusContainer = document.createElement('div');
  statusContainer.className = 'status-container';
  statusContainer.style.display = 'none';
  statusContainer.style.padding = '10px';
  statusContainer.style.marginTop = '10px';
  statusContainer.style.borderRadius = '8px';
  statusContainer.style.textAlign = 'center';
  
  // Insert status container before continue button if it exists
  if (interestsContainer && continueBtn) {
    interestsContainer.insertBefore(statusContainer, continueBtn);
  } else if (interestsContainer) {
    interestsContainer.appendChild(statusContainer);
  }
  
  // Check if user is logged in and load profile data
  try {
    // First try to get user from Supabase auth
    const user = await getCurrentUser();
    if (user) {
      currentUser = user;
      console.log('User authenticated:', user.id);
      
      // Try to load existing profile data from Supabase
      const loadedProfile = await loadProfileData(user.id);
      if (loadedProfile && loadedProfile.interests) {
        selectedInterests = loadedProfile.interests;
        updateInterestsUI();
        console.log('Loaded existing interests:', selectedInterests);
      }
    }
  } catch (err) {
    console.log('No authenticated user found', err);
  }
  
  // Load profile data from localStorage
  const storedProfile = localStorage.getItem(PROFILE_STORAGE_KEY);
  if (storedProfile) {
    try {
      profileData = JSON.parse(storedProfile);
      console.log('Found profile data in localStorage:', profileData);
      
      // If interests are stored in localStorage, use them
      if (profileData.interests && Array.isArray(profileData.interests)) {
        selectedInterests = profileData.interests;
        updateInterestsUI();
      }
    } catch (parseErr) {
      console.error('Error parsing stored profile data:', parseErr);
    }
  }
  
  // Update UI based on selected interests
  function updateInterestsUI() {
    interestOptions.forEach(btn => {
      const interest = btn.getAttribute('data-interest');
      const img = btn.querySelector('img');
      
      if (selectedInterests.includes(interest)) {
        btn.classList.add('selected');
        if (img) img.src = img.getAttribute('data-selected');
      } else {
        btn.classList.remove('selected');
        if (img) img.src = img.getAttribute('data-unselected');
      }
    });
  }
  
  // Function to toggle interest selection
  function toggleInterest(option) {
    const interest = option.getAttribute('data-interest');
    const img = option.querySelector('img');
    
    // Toggle selection state in UI
    option.classList.toggle('selected');
    
    // Update image based on selection state
    if (img) {
      if (option.classList.contains('selected')) {
        img.src = img.getAttribute('data-selected');
      } else {
        img.src = img.getAttribute('data-unselected');
      }
    }
    
    // Update selected interests array
    if (option.classList.contains('selected')) {
      if (!selectedInterests.includes(interest)) {
        selectedInterests.push(interest);
      }
    } else {
      selectedInterests = selectedInterests.filter(i => i !== interest);
    }
    
    // Update counter if it exists
    if (interestCounter) {
      interestCounter.textContent = `Selected: ${selectedInterests.length} / 5 ${selectedInterests.length < 1 ? '(minimum 1 required)' : ''}`;
    }
    
    // Update continue button based on selection count
    if (continueBtn) {
      const isValid = selectedInterests.length >= 1;
      continueBtn.disabled = !isValid;
      if (isValid) {
        continueBtn.classList.remove('button-disabled');
        if (validationFeedback) validationFeedback.style.display = 'none';
      } else {
        continueBtn.classList.add('button-disabled');
      }
    }
    
    // Update profileData with current selections
    profileData.interests = [...selectedInterests];
    saveToLocalStorage();
    
    console.log('Selected interests:', selectedInterests);
  }
  
  // Add click listeners to interest options
  interestOptions.forEach(option => {
    option.addEventListener('click', function() {
      toggleInterest(this);
    });
  });
  
  // Continue button click handler
  if (continueBtn) {
    continueBtn.addEventListener('click', async function(e) {
      e.preventDefault();
      
      // Validate minimum required interests (changed to 1)
      if (selectedInterests.length < 1) {
        validationFeedback.textContent = 'Please select at least 1 interest';
        validationFeedback.style.display = 'block';
        continueBtn.classList.add('error-shake');
        setTimeout(() => continueBtn.classList.remove('error-shake'), 820);
        return;
      }
      
      // Update profileData with current selections and save
      profileData.interests = [...selectedInterests];
      saveToLocalStorage();
      
      // Show loading state
      continueBtn.disabled = true;
      continueBtn.textContent = 'Saving...';
      continueBtn.classList.add('button-loading');
      
      // If user is authenticated, save to Supabase
      if (currentUser) {
        try {
          showStatus('Saving your interests...', 'loading');
          await saveInterestsToSupabase(selectedInterests);
          showStatus('Interests saved!', 'success');
          
          // Short delay before redirecting
          setTimeout(() => {
            window.location.href = '/profile-verify';
          }, 500);
        } catch (err) {
          console.error('Error saving interests:', err);
          showStatus('Error saving interests. Continuing anyway...', 'error');
          
          // Continue despite error
          setTimeout(() => {
            window.location.href = '/profile-verify';
          }, 1500);
        }
      } else {
        // No authenticated user, just redirect to verification
        window.location.href = '/profile-verify';
      }
    });
  }
  
  // Skip button click handler
  if (skipBtn) {
    skipBtn.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Update existing profileData with empty interests
      profileData.interests = [];
      saveToLocalStorage();
      
      // Show loading state
      skipBtn.disabled = true;
      skipBtn.classList.add('button-loading');
      
      // Navigate to verification page after brief delay
      setTimeout(() => {
        window.location.href = '/profile-verify';
      }, 400);
    });
  }
  
  // Helper functions
  async function loadProfileData(userId) {
    try {
      const supabase = await supabaseClientPromise;
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
        profileData = { ...profileData, ...data };
        saveToLocalStorage();
        return data;
      }
      return null;
    } catch (err) {
      console.error('Error loading profile data:', err);
      return null;
    }
  }
  
  async function saveInterestsToSupabase(interests) {
    const supabase = await supabaseClientPromise;
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('No authenticated user found');
      
      // Update profile with interests
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          interests: interests,
          updated_at: new Date().toISOString()
        });
      
      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`Failed to save interests: ${error.message}`);
      }
      
      return true;
    } catch (err) {
      console.error('Error saving interests to Supabase:', err);
      throw err;
    }
  }
  
  // Save profile data to localStorage for persistence across pages
  function saveToLocalStorage() {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profileData));
    console.log('Profile data saved to localStorage');
  }
  
  // Show status message with different styles based on type
  function showStatus(message, type = 'info') {
    statusContainer.textContent = message;
    statusContainer.style.display = 'block';
    
    // Reset previous styles
    statusContainer.style.backgroundColor = '';
    statusContainer.style.color = '';
    
    // Apply styles based on type
    switch (type) {
      case 'error':
        statusContainer.style.backgroundColor = '#FFEBEE';
        statusContainer.style.color = '#F44336';
        break;
      case 'success':
        statusContainer.style.backgroundColor = '#E8F5E9';
        statusContainer.style.color = '#4CAF50';
        break;
      case 'loading':
        statusContainer.style.backgroundColor = '#E3F2FD';
        statusContainer.style.color = '#2196F3';
        break;
      default: // info
        statusContainer.style.backgroundColor = '#E3F2FD';
        statusContainer.style.color = '#2196F3';
    }
    
    // Hide after 5 seconds for non-loading messages
    if (type !== 'loading') {
      setTimeout(() => {
        statusContainer.style.display = 'none';
      }, 5000);
    }
  }
}
