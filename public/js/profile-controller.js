import { handleProfileSubmission, verifyOtpAndCompleteProfile, uploadProfilePhoto } from './profile.js';

document.addEventListener('DOMContentLoaded', function() {
  // DOM elements
  const confirmBtn = document.querySelector('.confirm-btn');
  const firstNameInput = document.getElementById('first-name');
  const lastNameInput = document.getElementById('last-name');
  const phoneInput = document.getElementById('phone-number');
  const fullPhoneInput = document.getElementById('full-phone');
  const birthdayBtn = document.getElementById('birthday-btn');
  const locationBtn = document.getElementById('location-btn');
  const profileImage = document.getElementById('profile-image');
  const skipBtn = document.querySelector('.skip-btn');

  // Store the selected profile image file
  let profileImageFile = null;

  // Handle camera button click for profile photo
  const cameraBtn = document.querySelector('.camera-btn');
  cameraBtn.addEventListener('click', function() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    
    fileInput.addEventListener('change', function(e) {
      if (e.target.files && e.target.files[0]) {
        profileImageFile = e.target.files[0];
        const reader = new FileReader();
        
        reader.onload = function(event) {
          profileImage.src = event.target.result;
        };
        
        reader.readAsDataURL(profileImageFile);
      }
    });
    
    fileInput.click();
  });

  // Handle confirm button click
  confirmBtn.addEventListener('click', async function(e) {
    e.preventDefault();
    
    // Validate form
    const firstName = firstNameInput.value.trim();
    const lastName = lastNameInput.value.trim();
    const phoneNumber = fullPhoneInput.value;
    const birthday = birthdayBtn.getAttribute('data-birthday') || '';
    const location = locationBtn.getAttribute('data-location') || '';
    
    // Basic validation
    if (!firstName || !lastName) {
      showMessage('Please enter your first and last name', true);
      return;
    }
    
    if (!phoneNumber || phoneNumber.length < 8) {
      showMessage('Please enter a valid phone number', true);
      return;
    }
    
    // Disable button and show loading state
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Processing...';
    
    // Prepare profile data
    const profileData = {
      firstName,
      lastName,
      phoneNumber,
      birthday,
      location
    };
    
    // Submit profile data
    try {
      const result = await handleProfileSubmission(profileData);
      
      if (result.success) {
        // Show OTP verification modal
        showMessage('Profile data saved. Proceeding to verification...', false);
        setTimeout(() => {
          showOtpVerificationModal(phoneNumber);
        }, 1000);
      } else {
        // Show error message
        showMessage(result.error?.message || 'An error occurred. Please try again.', true);
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'Confirm';
      }
    } catch (error) {
      console.error('Error in profile submission:', error);
      
      // Special handling for Twilio initialization error
      if (error.message && error.message.includes('Twilio')) {
        showMessage('Phone verification is currently unavailable. Please try again later.', true);
      } else {
        showMessage(error.message || 'An error occurred. Please try again.', true);
      }
      
      confirmBtn.disabled = false;
      confirmBtn.textContent = 'Confirm';
    }
  });

  // Handle skip button
  skipBtn.addEventListener('click', function(e) {
    e.preventDefault();
    // Redirect to discover page or another page
    window.location.href = '/views/discover.html';
  });

  // Function to show OTP verification modal
  function showOtpVerificationModal(phoneNumber) {
    // Create modal element
    const modal = document.createElement('div');
    modal.className = 'otp-modal';
    modal.innerHTML = `
      <div class="otp-container">
        <h2>Verify Your Phone</h2>
        <p>We've sent a verification code to ${phoneNumber}</p>
        <div class="otp-input-container">
          <input type="text" maxlength="6" placeholder="Enter 6-digit code" id="otp-input">
        </div>
        <button id="verify-btn" class="verify-btn">Verify</button>
        <button id="cancel-btn" class="cancel-btn">Cancel</button>
      </div>
    `;
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      .otp-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }
      
      .otp-container {
        background-color: white;
        border-radius: 12px;
        padding: 24px;
        width: 90%;
        max-width: 360px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }
      
      .otp-container h2 {
        font-size: 18px;
        margin: 0 0 12px;
        color: #333;
      }
      
      .otp-container p {
        font-size: 14px;
        color: #666;
        margin-bottom: 20px;
      }
      
      .otp-input-container {
        margin-bottom: 20px;
      }
      
      #otp-input {
        width: 100%;
        height: 48px;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        padding: 0 16px;
        font-size: 18px;
        letter-spacing: 2px;
        text-align: center;
      }
      
      .verify-btn {
        width: 100%;
        height: 44px;
        border-radius: 22px;
        border: none;
        background-color: #F44B74;
        color: white;
        font-size: 16px;
        font-weight: 500;
        cursor: pointer;
        margin-bottom: 12px;
      }
      
      .cancel-btn {
        width: 100%;
        height: 44px;
        border-radius: 22px;
        border: 1px solid #e0e0e0;
        background-color: white;
        color: #666;
        font-size: 16px;
        font-weight: 500;
        cursor: pointer;
      }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(modal);
    
    // Add event listeners
    const verifyBtn = document.getElementById('verify-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const otpInput = document.getElementById('otp-input');
    
    verifyBtn.addEventListener('click', async function() {
      const otp = otpInput.value.trim();
      
      if (!otp || otp.length !== 6) {
        alert('Please enter a valid 6-digit verification code');
        return;
      }
      
      verifyBtn.disabled = true;
      verifyBtn.textContent = 'Verifying...';
      
      // Verify OTP and complete profile creation
      const result = await verifyOtpAndCompleteProfile(phoneNumber, otp);
      
      if (result.success) {
        // Upload profile photo if selected
        if (profileImageFile) {
          const { data: { user } } = await (await import('./supabase-client.js')).supabaseClientPromise.then(supabase => supabase.auth.getUser());
          await uploadProfilePhoto(profileImageFile, user.id);
        }
        
        // Show success message and redirect
        showMessage('Account created successfully! Redirecting...');
        setTimeout(() => {
          window.location.href = '/views/discover.html';
        }, 2000);
      } else {
        // Show error message
        alert(result.error.message || 'Verification failed. Please try again.');
        verifyBtn.disabled = false;
        verifyBtn.textContent = 'Verify';
      }
    });
    
    cancelBtn.addEventListener('click', function() {
      modal.remove();
      confirmBtn.disabled = false;
      confirmBtn.textContent = 'Confirm';
    });
  }

  // Function to show message
  function showMessage(message, isError = false) {
    // Check if message element exists
    let messageEl = document.querySelector('.status-message');
    
    // Create message element if it doesn't exist
    if (!messageEl) {
      messageEl = document.createElement('div');
      messageEl.className = 'status-message';
      document.querySelector('.profile-form').appendChild(messageEl);
    }
    
    // Set message content and style
    messageEl.textContent = message;
    messageEl.style.display = 'block';
    
    if (isError) {
      messageEl.classList.add('error');
      messageEl.classList.remove('success');
    } else {
      messageEl.classList.add('success');
      messageEl.classList.remove('error');
    }
    
    // Hide message after 5 seconds
    setTimeout(() => {
      messageEl.style.display = 'none';
    }, 5000);
  }
});
