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
  if (sendCodeBtn) {
    sendCodeBtn.addEventListener('click', async function() {
      // Show loading state
      sendCodeBtn.disabled = true;
      sendCodeBtn.textContent = 'Sending...';
      sendCodeBtn.classList.add('button-loading');
      
      try {
        // In a real app, you would send the verification code
        // For this demo, we'll simulate the process
        await simulateResendCode();
        
        // Show success message
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
        showStatus('Failed to send code. Please try again.', 'error');
        
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
        // In a real app, you would verify the code with your backend or SMS provider
        // For this demo, we'll simulate a verification process
        await simulateVerification(code);
        
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
        // In a real app, you would resend the verification code
        // For this demo, we'll simulate the process
        await simulateResendCode();
        
        // Focus on verification code input
        if (verificationCodeInput) {
          verificationCodeInput.focus();
        }
        
        showStatus('Verification code resent!', 'success');
      } catch (err) {
        console.error('Error resending code:', err);
        showStatus('Failed to resend code. Please try again.', 'error');
        
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
  
  // Simulate verification process (for demo purposes)
  async function simulateVerification(code) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // For demo purposes, accept any code except "000000"
        if (code === '000000') {
          reject(new Error('Invalid verification code'));
        } else {
          resolve();
        }
      }, 1500);
    });
  }
  
  // Simulate resend code process (for demo purposes)
  async function simulateResendCode() {
    return new Promise((resolve) => {
      setTimeout(resolve, 1000);
    });
  }
  
  // Update profile in Supabase
  async function updateProfileInSupabase() {
    const supabase = await supabaseClientPromise;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: currentUser.id,
          phone_verified: true,
          updated_at: new Date().toISOString()
        });
      
      if (error) {
        console.error('Error updating profile in Supabase:', error);
        throw error;
      }
      
      console.log('Profile updated in Supabase');
    } catch (err) {
      console.error('Error updating profile:', err);
      // Don't throw here - we want to continue even if Supabase update fails
    }
  }
}
