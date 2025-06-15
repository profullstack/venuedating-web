/**
 * Profile gender selection page functionality
 * Handles gender selection and integration with Supabase
 */
import { supabaseClientPromise } from './supabase-client.js';
import { initProgressIndicator } from './components/progress-indicator.js';
import { showValidationFeedback } from './utils/validation.js';
import { getCurrentUser } from './auth.js';

// Session storage key for profile data during onboarding
const PROFILE_STORAGE_KEY = 'userProfile';

export async function initProfileGenderPage() {
  // Remove progress indicator initialization
  
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
  const genderButtons = document.querySelectorAll('.gender-option');
  const submitButton = document.getElementById('continue-btn');
  const skipButton = document.getElementById('skip-btn');
  const genderSelectionContainer = document.querySelector('.gender-selection');
  const validationFeedback = document.createElement('div');
  validationFeedback.className = 'validation-feedback';
  validationFeedback.style.textAlign = 'center';
  validationFeedback.style.marginTop = '12px';
  
  // Insert validation feedback element after the gender selection container
  if (genderSelectionContainer) {
    genderSelectionContainer.insertAdjacentElement('afterend', validationFeedback);
  }
  
  // State variables
  let selectedGender = null;
  let profileData = JSON.parse(localStorage.getItem('userProfile') || '{}');
  
  // Disable submit button initially until user makes a selection
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.classList.add('button-disabled');
  }
  
  // Create status message container
  const statusContainer = document.createElement('div');
  statusContainer.className = 'status-container';
  statusContainer.style.display = 'none';
  statusContainer.style.padding = '10px';
  statusContainer.style.marginTop = '10px';
  statusContainer.style.borderRadius = '8px';
  statusContainer.style.textAlign = 'center';
  submitButton.parentNode.insertBefore(statusContainer, submitButton);
  
  // Check if user is logged in and load profile data
  try {
    // First try to get user from Supabase auth
    const user = await getCurrentUser();
    if (user) {
      console.log('User authenticated:', user.id);
      
      // Try to load existing profile data from Supabase
      const loadedProfile = await loadProfileData(user.id);
      if (loadedProfile && loadedProfile.gender) {
        // Don't pre-select any gender
        // Instead, make sure we have no selection initially
        console.log('Loaded existing gender preference:', selectedGender);
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
      
      // If gender is stored in localStorage, use it
      if (profileData.gender) {
        selectedGender = profileData.gender;
        selectGender(selectedGender);
      }
    } catch (parseErr) {
      console.error('Error parsing stored profile data:', parseErr);
    }
  }
  
  // Function to handle gender selection
  function selectGender(gender) {
    // Update the selected gender
    selectedGender = gender;
    
    // Update UI to show selected gender
    // First, reset all options
    genderButtons.forEach(button => {
      button.classList.remove('selected');
      // Reset stroke color on all checkmarks
      const checkPath = button.querySelector('.check-icon path');
      if (checkPath) {
        checkPath.setAttribute('stroke', '#F44B74');
      }
    });
    
    // Select the chosen option
    const selectedButton = document.querySelector(`.gender-option[data-gender="${gender}"]`);
    if (selectedButton) {
      selectedButton.classList.add('selected');
      const checkPath = selectedButton.querySelector('.check-icon path');
      if (checkPath) {
        checkPath.setAttribute('stroke', 'white');
      }
    }
    
    // Clear validation feedback
    validationFeedback.textContent = '';
    validationFeedback.style.display = 'none';
    
    // Update submit button
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.classList.remove('button-disabled');
    }
  }
  
  // Add click event listeners to gender options
  genderButtons.forEach(button => {
    button.addEventListener('click', function() {
      const gender = this.getAttribute('data-gender');
      selectGender(gender);
    });
  });
  
  // Submit button click handler
  if (submitButton) {
    submitButton.addEventListener('click', function(e) {
      e.preventDefault();
      
      if (selectedGender) {
        // Save to localStorage
        profileData.gender = selectedGender;
        localStorage.setItem('userProfile', JSON.stringify(profileData));
        
        // Show loading state
        submitButton.disabled = true;
        submitButton.textContent = 'Saving...';
        submitButton.classList.add('button-loading');
        
        // Navigate to interests page after brief delay for feedback
        setTimeout(() => {
          window.location.href = '/profile-interests';
        }, 600);
      } else {
        // Show validation error
        validationFeedback.textContent = 'Please select a gender option';
        validationFeedback.style.display = 'block';
        submitButton.classList.add('error-shake');
        setTimeout(() => submitButton.classList.remove('error-shake'), 820);
      }
    });
  }
  
  // Skip button click handler
  if (skipButton) {
    skipButton.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Save to localStorage (with null gender to indicate skipped)
      profileData.gender = null;
      localStorage.setItem('userProfile', JSON.stringify(profileData));
      
      // Show loading state
      skipButton.disabled = true;
      skipButton.classList.add('button-loading');
      
      // Navigate to interests page
      setTimeout(() => {
        window.location.href = '/profile-interests';
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
  
  async function saveGenderToSupabase(gender) {
    const supabase = await supabaseClientPromise;
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('No authenticated user found');
      
      // Update profile with gender
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          gender: gender,
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;
      
      return true;
    } catch (err) {
      console.error('Error saving gender to Supabase:', err);
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
