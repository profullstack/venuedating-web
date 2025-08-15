/**
 * Profile verification page functionality
 * Handles phone verification code entry and submission
 */
import { supabaseClientPromise } from './supabase-client.js';
import { getCurrentUser } from './auth.js';

// Session storage key for profile data during onboarding
const PROFILE_STORAGE_KEY = 'userProfile';

export async function initProfileVerifyPage() {
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
  const countryCodeElement = document.getElementById('country-code');
  const phoneNumberDisplay = document.getElementById('phone-number-display');
  const countryFlagElement = document.querySelector('.country-flag');
  const changeNumberBtn = document.getElementById('change-number-btn');
  const verificationCodeInput = document.getElementById('verification-code');
  const verifyBtn = document.getElementById('verify-btn');
  const resendCodeBtn = document.getElementById('resend-code-btn');
  const resendTimer = document.getElementById('resend-timer');
  const verificationError = document.getElementById('verification-error');
  const statusContainer = document.getElementById('status-container');
  
  // Country selector elements
  const countrySelectorTrigger = document.getElementById('country-selector-trigger');
  const countrySelectorModal = document.getElementById('country-selector-modal');
  const closeCountrySelector = document.getElementById('close-country-selector');
  const countrySelectorOverlay = document.querySelector('.country-selector-overlay');
  const countrySearch = document.getElementById('country-search');
  const countryList = document.getElementById('country-list');
  
  // Update subtitle to indicate code needs to be sent
  const profileSubtitle = document.querySelector('.profile-subtitle');
  if (profileSubtitle) {
    profileSubtitle.textContent = 'Click the button below to send a verification code to your phone.';
  }
  
  // Create and add a "Send Code" button
  const sendCodeBtn = document.createElement('button');
  sendCodeBtn.id = 'send-code-btn';
  sendCodeBtn.className = 'action-btn';
  sendCodeBtn.textContent = 'Send Verification Code';
  
  // Insert the button before the verification section
  const verificationSection = document.getElementById('verification-section');
  if (verificationSection) {
    verificationSection.style.display = 'none'; // Hide verification section initially
    verificationSection.parentNode.insertBefore(sendCodeBtn, verificationSection);
  }
  
  // State variables
  let profileData = {};
  let currentUser = null;
  let resendTimerInterval = null;
  let resendCountdown = 30;
  
  // Load profile data from localStorage
  const storedProfile = localStorage.getItem(PROFILE_STORAGE_KEY);
  if (storedProfile) {
    try {
      profileData = JSON.parse(storedProfile);
      console.log('Found profile data in localStorage:', profileData);
      
      // Update the UI with the phone number
      updatePhoneDisplay();
      
      // Initialize country selector
      initializeCountrySelector();
    } catch (parseErr) {
      console.error('Error parsing stored profile data:', parseErr);
      showStatus('Error loading profile data', 'error');
    }
  } else {
    showStatus('No profile data found. Please go back and complete your profile.', 'error');
  }
  
  // Check if user is logged in
  try {
    const user = await getCurrentUser();
    if (user) {
      currentUser = user;
      console.log('User authenticated:', user.id);
    }
  } catch (err) {
    console.log('No authenticated user found', err);
  }
  
  // Set up the country selector modal
  function initializeCountrySelector() {
    // Load countries data
    import('./data/countries.js').then(module => {
      const { countries } = module;
      
      // Populate country list
      populateCountryList(countries);
      
      // Set up event listeners
      setupCountrySelectorEvents(countries);
      
    }).catch(err => {
      console.error('Error loading countries data:', err);
      showStatus('Failed to load country data', 'error');
    });
  }
  
  // Populate the country list in the modal
  function populateCountryList(countries) {
    countryList.innerHTML = '';
    
    countries.forEach(country => {
      const li = document.createElement('li');
      li.dataset.code = country.code;
      li.dataset.dialCode = country.dialCode;
      
      // Mark the selected country
      if (country.dialCode === profileData.countryCode) {
        li.classList.add('selected');
      }
      
      li.innerHTML = `
        <span class="country-flag-item">${country.flag}</span>
        <span class="country-name">${country.name}</span>
        <span class="country-dial-code">${country.dialCode}</span>
      `;
      
      // Add click event to select country
      li.addEventListener('click', () => {
        selectCountry(country);
        closeModal();
      });
      
      countryList.appendChild(li);
    });
  }
  
  // Set up events for the country selector
  function setupCountrySelectorEvents(countries) {
    // Open modal on click
    if (countrySelectorTrigger) {
      countrySelectorTrigger.addEventListener('click', openModal);
    }
    
    // Close modal events
    if (closeCountrySelector) {
      closeCountrySelector.addEventListener('click', closeModal);
    }
    
    if (countrySelectorOverlay) {
      countrySelectorOverlay.addEventListener('click', closeModal);
    }
    
    // Search functionality
    if (countrySearch) {
      countrySearch.addEventListener('input', () => {
        const searchTerm = countrySearch.value.toLowerCase();
        filterCountries(countries, searchTerm);
      });
    }
  }
  
  // Filter countries based on search term
  function filterCountries(countries, searchTerm) {
    const filteredCountries = countries.filter(country => {
      return country.name.toLowerCase().includes(searchTerm) || 
             country.dialCode.toLowerCase().includes(searchTerm);
    });
    
    populateCountryList(filteredCountries);
  }
  
  // Open the country selector modal
  function openModal() {
    countrySelectorModal.classList.add('active');
    setTimeout(() => {
      countrySearch.focus();
    }, 300);
    
    // Prevent body scrolling when modal is open
    document.body.style.overflow = 'hidden';
  }
  
  // Close the country selector modal
  function closeModal() {
    countrySelectorModal.classList.remove('active');
    
    // Re-enable body scrolling
    document.body.style.overflow = '';
    
    // Clear search
    if (countrySearch) {
      countrySearch.value = '';
      
      // Reset country list if was filtered
      import('./data/countries.js').then(module => {
        const { countries } = module;
        populateCountryList(countries);
      });
    }
  }
  
  // Select a country and update the UI
  function selectCountry(country) {
    // Update profile data
    profileData.countryCode = country.dialCode;
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profileData));
    
    // Update UI
    countryCodeElement.textContent = country.dialCode;
    countryFlagElement.textContent = country.flag;
    
    console.log('Selected country:', country.name, country.dialCode);
  }
  
  // Update phone display with data from profile
  function updatePhoneDisplay() {
    if (profileData.countryCode) {
      countryCodeElement.textContent = profileData.countryCode;
    }
    
    if (profileData.phoneNumber) {
      phoneNumberDisplay.textContent = profileData.phoneNumber;
    }
    
    // Try to find the country flag based on the country code
    if (profileData.countryCode) {
      // Import countries data to get the flag
      import('./data/countries.js').then(module => {
        const { countries } = module; // Use named export
        
        // Find country by dialCode (camelCase as in the countries.js file)
        const country = countries.find(c => c.dialCode === profileData.countryCode);
        
        if (country && country.flag) {
          countryFlagElement.textContent = country.flag;
          console.log('Found country flag:', country.flag, 'for', country.name);
        } else {
          // Fallback to default flag if country not found
          console.log('Country not found for dial code:', profileData.countryCode);
          // Set US flag as default
          countryFlagElement.textContent = '🇺🇸';
        }
      }).catch(err => {
        console.error('Error loading countries data:', err);
        // Set US flag as default in case of error
        countryFlagElement.textContent = '🇺🇸';
      });
    }
  }
  
  // Change the background color of the verification code input
  if (verificationCodeInput) {
    verificationCodeInput.style.backgroundColor = '#f8f9fa';
    
    verificationCodeInput.addEventListener('input', function() {
      // Only allow digits
      this.value = this.value.replace(/[^0-9]/g, '');
      
      // Enable verify button if we have 6 digits
      verifyBtn.disabled = this.value.length !== 6;
      
      // Hide any previous error
      verificationError.classList.add('hidden');
      
      // Change background color when user starts typing
      if (this.value.length > 0) {
        this.style.backgroundColor = '#fff';
        this.style.borderColor = '#F44B74';
      } else {
        this.style.backgroundColor = '#f8f9fa';
        this.style.borderColor = '#ddd';
      }
    });
    
    // Auto-submit when 6 digits are entered
    verificationCodeInput.addEventListener('keyup', function(e) {
      if (this.value.length === 6 && e.key !== 'Enter') {
        verifyBtn.click();
      }
    });
  }
  
  // Handle send code button click
  // Function to create initial account using the API endpoint
  async function createInitialAccount() {
    try {
      console.log('[ACCOUNT] Creating initial account via API');
      
      // Format phone number for storage
      const phoneNumber = profileData.phoneNumber.replace(/[\s-]/g, '');
      const countryCode = profileData.countryCode;
      console.log('[ACCOUNT] Using phone:', countryCode + phoneNumber);
      
      // Create user via API
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          phoneNumber: phoneNumber,
          countryCode: countryCode,
          phoneVerified: false
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('[ACCOUNT] API error creating user:', errorData);
        return null;
      }
      
      const result = await response.json();
      
      if (!result.success) {
        console.error('[ACCOUNT] API returned error:', result.error);
        return null;
      }
      
      console.log('[ACCOUNT] User created/retrieved successfully:', result.user);
      return result.user;
    } catch (err) {
      console.error('[ACCOUNT] Error in createInitialAccount:', err);
      return null;
    }
  }

  if (sendCodeBtn) {
    sendCodeBtn.addEventListener('click', async function() {
      // Show loading state
      sendCodeBtn.disabled = true;
      sendCodeBtn.textContent = 'Sending...';
      sendCodeBtn.classList.add('button-loading');
      
      try {
        // Validate phone number and country code
        if (!profileData.phoneNumber || !profileData.countryCode) {
          console.error('Missing phone data:', profileData);
          throw new Error('Phone number and country code are required. Please go back and complete your profile.');
        }
        
        // Create initial account in Supabase before sending OTP
        showStatus('Creating your account...', 'loading');
        const user = await createInitialAccount();
        
        if (user) {
          currentUser = user;
          console.log('[ACCOUNT] Account created/found with ID:', user.id);
        } else {
          console.warn('[ACCOUNT] Could not create initial account, continuing with OTP');
        }
        
        // Check if this is a demo account (e.g., +15555555555)
        const isDemoAccount = profileData.phoneNumber === '5555555555' || 
                             profileData.phoneNumber === '555-555-5555';
        
        console.log('Sending verification code to:', profileData.countryCode + profileData.phoneNumber);
        
        // Send verification code via backend API
        const response = await fetch('/api/verify/send-code', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            phoneNumber: profileData.phoneNumber,
            countryCode: profileData.countryCode,
            isSignup: true // This is a signup flow
          })
        });
        
        const result = await response.json();
        
        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Failed to send verification code');
        }
        
        // For demo account, skip verification and proceed directly
        if (isDemoAccount || result.demo) {
          console.log('[DEMO ACCOUNT] Skipping verification for demo account');
          
          // Mark phone as verified in profile data
          profileData.phoneVerified = true;
          localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profileData));
          
          // Show success message
          showStatus('Demo account: Verification bypassed!', 'success');
          
          // Redirect to next page after a short delay
          setTimeout(() => {
            window.location.href = '/profile-complete';
          }, 1500);
          
          return;
        }
        
        // For regular accounts, show verification section
        showStatus('Verification code sent!', 'success');
        
        // Hide send button and show verification section
        sendCodeBtn.style.display = 'none';
        if (verificationSection) {
          verificationSection.style.display = 'block';
        }
        
        // Update subtitle
        if (profileSubtitle) {
          profileSubtitle.textContent = 'Enter the 6-digit code sent to your phone.';
        }
        
        // Focus on verification code input
        if (verificationCodeInput) {
          verificationCodeInput.focus();
        }
      } catch (err) {
        console.error('Error sending code:', err);
        showStatus(err.message || 'Failed to send code. Please try again.', 'error');
        
        // Reset button state
        sendCodeBtn.disabled = false;
        sendCodeBtn.textContent = 'Send Verification Code';
        sendCodeBtn.classList.remove('button-loading');
      }
    });
  }
  
  // Handle verify button click
  if (verifyBtn) {
    verifyBtn.addEventListener('click', async function() {
      const code = verificationCodeInput.value.trim();
      
      if (code.length !== 6) {
        showVerificationError('Please enter a valid 6-digit code');
        return;
      }
      
      // Show loading state
      verifyBtn.disabled = true;
      verifyBtn.textContent = 'Verifying...';
      verifyBtn.classList.add('button-loading');
      
      try {
        // Send verification code to backend API for validation
        const response = await fetch('/api/verify/check-code', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            phoneNumber: profileData.phoneNumber,
            countryCode: profileData.countryCode,
            code: code
          })
        });
        
        const result = await response.json();
        
        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Invalid verification code');
        }
        
        // Mark phone as verified in profile data
        profileData.phoneVerified = true;
        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profileData));
        
        // If user is authenticated, update profile in Supabase
        if (currentUser) {
          await updateProfileInSupabase();
        }
        
        // Show success message
        showStatus('Phone verified successfully!', 'success');
        
        // Redirect to next page after a short delay
        setTimeout(() => {
          window.location.href = '/profile-complete';
        }, 1500);
      } catch (err) {
        console.error('Verification error:', err);
        showVerificationError(err.message || 'Failed to verify code. Please try again.');
        
        // Reset button state
        verifyBtn.disabled = false;
        verifyBtn.textContent = 'Verify & Complete Profile';
        verifyBtn.classList.remove('button-loading');
      }
    });
  }
  
  // Handle change number button click
  if (changeNumberBtn) {
    changeNumberBtn.addEventListener('click', function() {
      // Navigate back to profile page
      window.location.href = '/profile';
    });
  }
  
  // Handle resend code button click
  if (resendCodeBtn) {
    resendCodeBtn.addEventListener('click', async function() {
      if (resendCodeBtn.disabled) return;
      
      // Disable resend button and show timer
      resendCodeBtn.disabled = true;
      resendCodeBtn.classList.add('hidden');
      resendTimer.classList.remove('hidden');
      
      // Reset countdown
      resendCountdown = 30;
      updateResendTimer();
      
      // Start countdown
      if (resendTimerInterval) {
        clearInterval(resendTimerInterval);
      }
      
      resendTimerInterval = setInterval(function() {
        resendCountdown--;
        updateResendTimer();
        
        if (resendCountdown <= 0) {
          clearInterval(resendTimerInterval);
          resendCodeBtn.disabled = false;
          resendCodeBtn.classList.remove('hidden');
          resendTimer.classList.add('hidden');
        }
      }, 1000);
      
      try {
        // Resend verification code via backend API
        const response = await fetch('/api/verify/send-code', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            phoneNumber: profileData.phoneNumber,
            countryCode: profileData.countryCode,
            isSignup: true // This is a signup flow
          })
        });
        
        const result = await response.json();
        
        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Failed to resend verification code');
        }
        
        // Focus on verification code input
        if (verificationCodeInput) {
          verificationCodeInput.focus();
        }
        
        showStatus('Verification code resent!', 'success');
      } catch (err) {
        console.error('Error resending code:', err);
        showStatus(err.message || 'Failed to resend code. Please try again.', 'error');
        
        // Reset resend button
        clearInterval(resendTimerInterval);
        resendCodeBtn.disabled = false;
        resendCodeBtn.classList.remove('hidden');
        resendTimer.classList.add('hidden');
      }
    });
  }
  
  // Update resend timer text
  function updateResendTimer() {
    resendTimer.textContent = `Resend in ${resendCountdown}s`;
  }
  
  // Show verification error
  function showVerificationError(message) {
    verificationError.textContent = message;
    verificationError.classList.remove('hidden');
    
    // Shake the verification input
    verificationCodeInput.classList.add('error-shake');
    setTimeout(() => {
      verificationCodeInput.classList.remove('error-shake');
    }, 820);
  }
  
  // Show status message
  function showStatus(message, type = 'info') {
    statusContainer.textContent = message;
    statusContainer.classList.remove('hidden');
    
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
        statusContainer.classList.add('hidden');
      }, 5000);
    }
  }
  
  // Note: Simulation functions have been removed and replaced with actual API calls to Twilio
  
  // Update profile in Supabase users table
  async function updateProfileInSupabase() {
    try {
      console.log('[PROFILE] Updating user in users table');
      // Properly await the Supabase client with error handling
      const supabase = await supabaseClientPromise;
      
      if (!supabase) {
        throw new Error('Supabase client initialization failed');
      }
      
      if (!currentUser || !currentUser.id) {
        console.error('[PROFILE] No current user ID available for update');
        throw new Error('No user ID available for update');
      }
      
      console.log('[PROFILE] Updating user with ID:', currentUser.id);
      
      // Update user via API
      const response = await fetch(`/api/users/${currentUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phone_verified: true,
          updated_at: new Date().toISOString()
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('[PROFILE] API error updating user:', errorData);
        throw new Error('Failed to update user via API');
      }
      
      const result = await response.json();
      
      if (!result.success) {
        console.error('[PROFILE] API returned error:', result.error);
        throw new Error(result.error || 'Unknown error updating user');
      }
      
      console.log('[PROFILE] User updated successfully via API');
    } catch (err) {
      console.error('[PROFILE] Error updating user in users table:', err);
      // Show a non-blocking error message but continue
      showStatus('Note: Phone was verified but there was an issue updating your account. Please continue.', 'info');
      // Don't throw here - we want to continue even if Supabase update fails
    }
  }
}
