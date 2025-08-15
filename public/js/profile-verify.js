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
      
      // Debug: Check if firstName and lastName exist
      console.log('firstName exists:', profileData.firstName !== undefined);
      console.log('lastName exists:', profileData.lastName !== undefined);
      console.log('first_name exists:', profileData.first_name !== undefined);
      console.log('last_name exists:', profileData.last_name !== undefined);
      
      // If we have snake_case but not camelCase, convert them
      if (!profileData.firstName && profileData.first_name) {
        profileData.firstName = profileData.first_name;
        console.log('Converted first_name to firstName:', profileData.firstName);
      }
      
      if (!profileData.lastName && profileData.last_name) {
        profileData.lastName = profileData.last_name;
        console.log('Converted last_name to lastName:', profileData.lastName);
      }
      
      // Fallback for missing names - use placeholder if both formats are missing
      if (!profileData.firstName && !profileData.first_name) {
        profileData.firstName = "User";
        console.log('Using fallback firstName:', profileData.firstName);
      }
      
      if (!profileData.lastName && !profileData.last_name) {
        profileData.lastName = "";
        console.log('Using fallback lastName:', profileData.lastName);
      }
      
      // Ensure we have both formats for consistency
      if (profileData.firstName && !profileData.first_name) {
        profileData.first_name = profileData.firstName;
      }
      
      if (profileData.lastName && !profileData.last_name) {
        profileData.last_name = profileData.lastName;
      }
      
      // Save the normalized profile data back to localStorage to ensure consistency
      // This helps prevent race conditions by ensuring all keys exist
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profileData));
      
      // Ensure country code is set to US (+1) if not already set
      if (!profileData.countryCode) {
        profileData.countryCode = '+1'; // Default to US
        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profileData));
        console.log('Set default country code to US (+1)');
      }
      
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
      
      // Find US in the countries list and ensure it's used for +1
      const usCountry = countries.find(c => c.code === 'us');
      if (usCountry && profileData.countryCode === '+1') {
        // If country code is +1, explicitly set to US
        countryFlagElement.textContent = usCountry.flag;
        console.log('Setting country to US for +1 dial code');
      }
      
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
    // Always set US flag as default first
    countryFlagElement.textContent = '🇺🇸';
    
    if (profileData.countryCode) {
      // Import countries data to get the flag
      import('./data/countries.js').then(module => {
        const { countries } = module; // Use named export
        
        // Find country by dialCode (camelCase as in the countries.js file)
        const country = countries.find(c => c.dialCode === profileData.countryCode);
        
        // Only update flag if it's not US and we found a valid country
        if (country && country.flag && country.code !== 'us') {
          countryFlagElement.textContent = country.flag;
          console.log('Found country flag:', country.flag, 'for', country.name);
        } else if (!country || !country.flag) {
          // Fallback to default flag if country not found
          console.log('Country not found for dial code:', profileData.countryCode);
          // Ensure US flag is set
          countryFlagElement.textContent = '🇺🇸';
          // Update country code to US if not found
          if (profileData.countryCode !== '+1') {
            profileData.countryCode = '+1';
            countryCodeElement.textContent = '+1';
            localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profileData));
            console.log('Updated country code to US (+1)');
          }
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
      
      // Real-time validation feedback
      if (this.value.length === 6) {
        // Valid code length
        this.classList.remove('invalid');
        this.classList.add('valid');
        verifyBtn.disabled = false;
      } else if (this.value.length > 0) {
        // Incomplete code
        this.classList.remove('valid');
        this.classList.remove('invalid'); // Don't show as invalid while typing
        verifyBtn.disabled = true;
      } else {
        // Empty input
        this.classList.remove('valid');
        this.classList.remove('invalid');
        verifyBtn.disabled = true;
      }
      
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
      
      // Debug: Log what we're about to send
      console.log('[ACCOUNT] Sending to API:', {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        phoneNumber: phoneNumber,
        countryCode: countryCode
      });
      
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
  
  // Validate verification code format
  function isValidVerificationCode(code) {
    // Must be exactly 6 digits
    return /^\d{6}$/.test(code);
  }
  
  // Validate phone number format
  function isValidPhoneNumber(phone, countryCode) {
    if (!phone || !countryCode) return false;
    
    // Remove all non-digit characters
    const digitsOnly = phone.replace(/\D/g, '');
    
    // Different validation based on country code
    if (countryCode === '+1') { // US/Canada
      return /^\d{10}$/.test(digitsOnly); // Must be exactly 10 digits
    } else if (countryCode === '+44') { // UK
      return /^\d{10,11}$/.test(digitsOnly); // 10-11 digits
    } else {
      // Generic international validation - at least 7 digits, max 15
      return digitsOnly.length >= 7 && digitsOnly.length <= 15;
    }
  }
  
  // Handle verify button click
  if (verifyBtn) {
    verifyBtn.addEventListener('click', async function() {
      const code = verificationCodeInput.value.trim();
      
      // Enhanced validation with visual feedback
      if (!isValidVerificationCode(code)) {
        verificationCodeInput.classList.add('invalid');
        showVerificationError('Please enter a valid 6-digit code');
        return;
      }
      
      // Validate phone number before proceeding
      const phoneNumber = phoneNumberDisplay.textContent.replace(/\D/g, '');
      const countryCode = document.getElementById('country-code').textContent;
      
      if (!isValidPhoneNumber(phoneNumber, countryCode)) {
        showVerificationError('Invalid phone number format. Please go back and correct it.');
        return;
      }
      
      // Clear any validation styling
      verificationCodeInput.classList.remove('invalid');
      verificationCodeInput.classList.add('valid');
      
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
      
      // Reset countdown - use 60 seconds instead of 30
      // This is still shorter than server expiration (10 min) but provides better UX
      resendCountdown = 60;
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
    // Add note about code validity when timer is showing
    if (resendCountdown > 30) {
      resendTimer.textContent = `Resend in ${resendCountdown}s (current code valid for 10 min)`;
    } else {
      resendTimer.textContent = `Resend in ${resendCountdown}s`;
    }
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
      
      // Check if we have a user ID to update
      if (!currentUser || !currentUser.id) {
        console.warn('[PROFILE] No current user ID available for update');
        // Instead of throwing error, just show a message and continue
        showStatus('Note: Phone was verified but user ID is missing. Your profile will be updated on next login.', 'info');
        return; // Exit function but don't throw error
      }
      
      console.log('[PROFILE] Updating user with ID:', currentUser.id);
      
      // First, check if a profile already exists for this user
      // This prevents duplicate profile creation attempts
      const supabase = await supabaseClientPromise;
      const { data: existingProfile, error: profileCheckError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', currentUser.id)
        .single();
      
      if (profileCheckError && profileCheckError.code !== 'PGRST116') { // PGRST116 = not found
        console.error('[PROFILE] Error checking for existing profile:', profileCheckError);
      }
      
      if (existingProfile) {
        console.log('[PROFILE] Profile already exists, skipping profile creation');
      }
      
      // Only update the user record in the users table, not the profile
      // The profile is created server-side when the user is created
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
        
        // More specific error message based on status code
        let errorMsg = 'Failed to update your profile';
        if (response.status === 404) {
          errorMsg = 'Your user profile could not be found';
        } else if (response.status === 400) {
          errorMsg = 'Invalid profile data';
        } else if (response.status === 500) {
          errorMsg = 'Server error while updating your profile';
        }
        
        // Show non-blocking error
        showStatus(`Note: Phone was verified but ${errorMsg.toLowerCase()}. Please continue.`, 'info');
        return;
      }
      
      const result = await response.json();
      
      if (!result.success) {
        console.error('[PROFILE] API returned error:', result.error);
        showStatus(`Note: Phone was verified but ${result.error || 'there was an issue updating your account'}. Please continue.`, 'info');
        return;
      }
      
      console.log('[PROFILE] User updated successfully via API');
    } catch (err) {
      console.error('[PROFILE] Error updating user in users table:', err);
      // Show a non-blocking error message but continue
      showStatus('Note: Phone was verified but there was an issue updating your account. Please continue.', 'info');
      // Don't throw here - we want to continue even if update fails
    }
  }
}
