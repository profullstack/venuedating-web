<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';

  // State variables
  let selectedCountry = {
    code: 'us',
    name: 'United States',
    dialCode: '+1',
    flag: '🇺🇸'
  };
  let phoneNumber = '';
  let isDropdownOpen = false;
  let isVerificationMode = false;
  let otpCode = '';
  let newPassword = '';
  let confirmPassword = '';
  let statusMessage = '';
  let isError = false;
  let isLoading = false;
  let countries = [];
  let storedFullPhone = '';

  // DOM references
  let countryDropdown;
  let phoneInput;
  let otpInput;
  let statusMessageEl;

  // Load countries data
  async function loadCountries() {
    try {
      console.log('Loading countries data...');
      const response = await fetch('/js/data/countries.js');
      if (!response.ok) throw new Error('Failed to load countries');
      
      const text = await response.text();
      // Extract countries array from the module
      const match = text.match(/export const countries = (\[[\s\S]*?\]);/);
      if (match) {
        countries = JSON.parse(match[1]);
        console.log(`Loaded ${countries.length} countries`);
      } else {
        throw new Error('Could not parse countries data');
      }
    } catch (err) {
      console.error('Error loading countries:', err);
      // Fallback countries
      countries = [
        { code: 'us', name: 'United States', dialCode: '+1', flag: '🇺🇸' },
        { code: 'gb', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧' },
        { code: 'ca', name: 'Canada', dialCode: '+1', flag: '🇨🇦' },
        { code: 'au', name: 'Australia', dialCode: '+61', flag: '🇦🇺' },
        { code: 'in', name: 'India', dialCode: '+91', flag: '🇮🇳' }
      ];
    }
  }

  // Get popular and sorted countries
  $: popularCountries = countries.filter(country => 
    ['us', 'gb', 'ca', 'au'].includes(country.code)
  );
  
  $: otherCountries = countries
    .filter(country => !['us', 'gb', 'ca', 'au'].includes(country.code))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Format phone number as user types
  function formatPhoneNumber(value) {
    const digits = value.replace(/\D/g, '');
    
    if (!digits) return '';
    
    if (digits.length <= 3) {
      return digits;
    } else if (digits.length <= 6) {
      return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    } else {
      return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    }
  }

  // Handle phone input
  function handlePhoneInput(event) {
    const formatted = formatPhoneNumber(event.target.value);
    phoneNumber = formatted;
    updateFullPhoneNumber();
  }

  // Update full phone number
  function updateFullPhoneNumber() {
    const digits = phoneNumber.replace(/\D/g, '');
    if (digits) {
      const cleanNumber = digits.startsWith('0') ? digits.substring(1) : digits;
      storedFullPhone = `${selectedCountry.dialCode}${cleanNumber}`;
    } else {
      storedFullPhone = '';
    }
  }

  // Select country
  function selectCountry(country) {
    selectedCountry = country;
    isDropdownOpen = false;
    updateFullPhoneNumber();
  }

  // Show status message
  function showStatus(message, error = false) {
    statusMessage = message;
    isError = error;
    
    if (statusMessageEl) {
      statusMessageEl.style.display = 'block';
      
      // Auto-hide after 5 seconds
      setTimeout(() => {
        if (statusMessageEl) {
          statusMessageEl.style.opacity = '0';
          setTimeout(() => {
            if (statusMessageEl) {
              statusMessageEl.style.display = 'none';
              statusMessageEl.style.opacity = '1';
            }
          }, 300);
        }
      }, 5000);
    }
  }

  // Handle form submission
  async function handleSubmit() {
    if (isVerificationMode) {
      // Handle password reset
      if (!otpCode.trim()) {
        return showStatus('Please enter the verification code', true);
      }
      
      if (!newPassword.trim()) {
        return showStatus('Please enter a new password', true);
      }
      
      if (newPassword !== confirmPassword) {
        return showStatus('Passwords do not match', true);
      }
      
      if (newPassword.length < 8) {
        return showStatus('Password must be at least 8 characters long', true);
      }
      
      if (!storedFullPhone) {
        return showStatus('Phone number not found. Please try again.', true);
      }
      
      isLoading = true;
      
      try {
        // Call API to verify OTP and reset password
        const response = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            phone: storedFullPhone,
            otp: otpCode,
            newPassword: newPassword
          })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error || 'Failed to reset password');
        }
        
        showStatus('Password reset successful!');
        
        // Redirect to login page after successful reset
        setTimeout(() => {
          goto('/auth/phone-login');
        }, 1500);
      } catch (err) {
        console.error('Error resetting password:', err);
        showStatus(err.message || 'Failed to reset password. Please try again.', true);
      } finally {
        isLoading = false;
      }
    } else {
      // Handle sending OTP
      if (!phoneNumber.trim()) {
        return showStatus('Please enter your phone number', true);
      }
      
      if (!selectedCountry.dialCode) {
        return showStatus('Please select your country', true);
      }
      
      updateFullPhoneNumber();
      
      if (!storedFullPhone) {
        return showStatus('Please enter a valid phone number', true);
      }
      
      isLoading = true;
      
      try {
        // Call API to check if phone exists and send OTP
        const response = await fetch('/api/auth/send-reset-otp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            phone: storedFullPhone
          })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error || 'Failed to send verification code');
        }
        
        showStatus('Verification code sent! Check your phone.');
        isVerificationMode = true;
        
        // Focus OTP input after a short delay
        setTimeout(() => {
          if (otpInput) otpInput.focus();
        }, 100);
      } catch (err) {
        console.error('Error sending verification code:', err);
        showStatus(err.message || 'Failed to send verification code. Please try again.', true);
      } finally {
        isLoading = false;
      }
    }
  }

  // Handle Enter key
  function handleKeyPress(event) {
    if (event.key === 'Enter') {
      handleSubmit();
    }
  }

  // Close dropdown when clicking outside
  function handleClickOutside(event) {
    if (countryDropdown && !countryDropdown.contains(event.target)) {
      isDropdownOpen = false;
    }
  }

  onMount(() => {
    loadCountries();
    
    if (browser) {
      document.addEventListener('click', handleClickOutside);
      return () => {
        document.removeEventListener('click', handleClickOutside);
      };
    }
  });
</script>

<svelte:head>
  <title>Reset Password - BarCrush</title>
  <meta name="description" content="Reset your BarCrush account password using your phone number" />
</svelte:head>

<div class="phone-reset-container">
  <div class="phone-reset-header">
    <a href="/auth/phone-login" class="back-btn">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M15 18L9 12L15 6" stroke="#F44B74" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </a>
  </div>
  
  <div class="phone-reset-title">
    <h1>Reset Password</h1>
  </div>
  
  <div class="phone-reset-form">
    <div class="input-group">
      <label for="phone-number">Phone number</label>
      <div class="phone-input-container">
        <div class="country-select" class:active={isDropdownOpen} bind:this={countryDropdown}>
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <!-- svelte-ignore a11y-no-static-element-interactions -->
          <div class="selected-country" on:click={() => isDropdownOpen = !isDropdownOpen}>
            <div class="country-flag">{selectedCountry.flag}</div>
            <div class="country-code">{selectedCountry.dialCode}</div>
            <div class="dropdown-arrow">▼</div>
          </div>
          
          {#if isDropdownOpen}
            <div class="country-dropdown show">
              {#each popularCountries as country}
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <!-- svelte-ignore a11y-no-static-element-interactions -->
                <div class="country-option" on:click={() => selectCountry(country)}>
                  <div class="country-option-flag">{country.flag}</div>
                  <div class="country-option-name">{country.name}</div>
                  <div class="country-option-code">{country.dialCode}</div>
                </div>
              {/each}
              
              {#if popularCountries.length > 0 && otherCountries.length > 0}
                <div style="border-bottom: 1px solid #e0e0e0; margin: 5px 0;"></div>
              {/if}
              
              {#each otherCountries as country}
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <!-- svelte-ignore a11y-no-static-element-interactions -->
                <div class="country-option" on:click={() => selectCountry(country)}>
                  <div class="country-option-flag">{country.flag}</div>
                  <div class="country-option-name">{country.name}</div>
                  <div class="country-option-code">{country.dialCode}</div>
                </div>
              {/each}
            </div>
          {/if}
        </div>
        
        <input 
          type="tel" 
          bind:this={phoneInput}
          bind:value={phoneNumber}
          on:input={handlePhoneInput}
          on:keypress={handleKeyPress}
          placeholder="123-456-7890" 
          class="phone-input"
          disabled={isVerificationMode}
        />
      </div>
    </div>
    
    {#if isVerificationMode}
      <div class="otp-section">
        <div class="input-group">
          <label for="otp-input">Verification Code</label>
          <input 
            bind:this={otpInput}
            bind:value={otpCode}
            on:keypress={handleKeyPress}
            type="text" 
            class="otp-input" 
            maxlength="6" 
            placeholder="Enter 6-digit code"
          />
        </div>
        
        <div class="input-group">
          <label for="new-password">New Password</label>
          <input 
            bind:value={newPassword}
            on:keypress={handleKeyPress}
            type="password" 
            class="password-input" 
            placeholder="Enter new password"
          />
        </div>
        
        <div class="input-group">
          <label for="confirm-password">Confirm Password</label>
          <input 
            bind:value={confirmPassword}
            on:keypress={handleKeyPress}
            type="password" 
            class="password-input" 
            placeholder="Confirm new password"
          />
        </div>
      </div>
    {/if}
    
    <button 
      class="confirm-btn" 
      disabled={isLoading}
      on:click={handleSubmit}
    >
      {#if isLoading}
        {isVerificationMode ? 'Resetting...' : 'Checking...'}
      {:else}
        {isVerificationMode ? 'Reset Password' : 'Send Verification Code'}
      {/if}
    </button>
    
    <div 
      bind:this={statusMessageEl}
      class="status-message"
      class:error={isError}
      class:success={!isError}
      style="display: none;"
    >
      {statusMessage}
    </div>
  </div>
</div>

<style>
  .phone-reset-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    width: 100%;
    min-height: auto;
    background-color: #fff;
    padding: 0px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
    box-sizing: border-box;
  }
  
  .phone-reset-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 40px;
    width: 100%;
  }
  
  .back-btn {
    color: #F44B74;
    text-decoration: none;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
  }
  
  .phone-reset-title {
    margin-bottom: 60px;
  }
  
  .phone-reset-title h1 {
    font-size: 36px;
    font-weight: 700;
    margin: 0;
    color: #000;
    text-align: center;
  }
  
  .phone-reset-form {
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 340px;
    padding: 0;
  }
  
  .input-group {
    margin-bottom: 24px;
  }
  
  .input-group label {
    display: block;
    font-size: 16px;
    color: #666;
    margin-bottom: 8px;
    font-weight: 500;
  }
  
  .input-group input {
    width: 100%;
    height: 50px;
    border-radius: 8px;
    border: 1px solid #e0e0e0;
    padding: 0 15px;
    font-size: 16px;
    color: #333;
  }
  
  .phone-input-container {
    display: flex;
    width: 100%;
    margin-bottom: 10px;
  }
  
  .country-select {
    position: relative;
    display: flex;
    align-items: center;
    height: 50px;
    border: 1px solid #e0e0e0;
    border-radius: 8px 0 0 8px;
    padding: 0 10px;
    background-color: #f9f9f9;
    cursor: pointer;
    min-width: 90px;
    justify-content: center;
    transition: all 0.2s ease;
    outline: none;
  }
  
  .country-select:hover {
    background-color: #f5f5f5;
    border-color: #d0d0d0;
    box-shadow: 0 0 0 2px rgba(244, 75, 116, 0.1);
  }
  
  .country-select:active, .country-select.active {
    background-color: #f0f0f0;
    border-color: #F44B74;
    box-shadow: 0 0 0 2px rgba(244, 75, 116, 0.2);
  }
  
  .selected-country {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 0 2px;
  }
  
  .country-flag {
    margin-right: 5px;
    font-size: 18px;
  }
  
  .country-code {
    font-size: 16px;
    color: #333;
    font-weight: 500;
  }
  
  .dropdown-arrow {
    margin-left: 5px;
    font-size: 10px;
    color: #666;
    transition: transform 0.3s ease, color 0.2s ease;
  }
  
  .country-select:hover .dropdown-arrow {
    color: #333;
  }
  
  .country-select.active .dropdown-arrow {
    transform: rotate(180deg);
    color: #F44B74;
  }
  
  .phone-input {
    flex: 1;
    height: 50px;
    border-radius: 0 8px 8px 0;
    border: 1px solid #e0e0e0;
    border-left: none;
    padding: 0 15px;
    font-size: 16px;
    color: #333;
    outline: none;
    transition: all 0.2s ease;
    background-color: #fff;
  }
  
  .phone-input:focus {
    border-color: #F44B74;
    box-shadow: 0 0 0 2px rgba(244, 75, 116, 0.2);
  }
  
  .phone-input:hover {
    border-color: #d0d0d0;
  }
  
  .password-input {
    height: 50px;
    border-radius: 8px;
    border: 1px solid #e0e0e0;
    padding: 0 15px;
    font-size: 16px;
    color: #333;
    outline: none;
    transition: all 0.2s ease;
    background-color: #fff;
  }
  
  .password-input:focus {
    border-color: #F44B74;
    box-shadow: 0 0 0 2px rgba(244, 75, 116, 0.2);
  }
  
  .password-input:hover {
    border-color: #d0d0d0;
  }
  
  .confirm-btn {
    width: 100%;
    height: 52px;
    border-radius: 30px;
    border: none;
    background-color: #F44B74;
    color: white;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    margin-top: 30px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
    outline: none;
  }
  
  .confirm-btn:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(255, 255, 255, 0.1);
    transform: translateX(-100%);
    transition: transform 0.6s ease;
  }
  
  .confirm-btn:hover {
    background-color: #e03a63;
    box-shadow: 0 4px 12px rgba(248, 92, 138, 0.4);
    transform: translateY(-2px);
  }
  
  .confirm-btn:hover:before {
    transform: translateX(0);
  }
  
  .confirm-btn:active {
    transform: translateY(0);
    box-shadow: 0 2px 4px rgba(248, 92, 138, 0.3);
  }
  
  .confirm-btn:focus {
    box-shadow: 0 0 0 3px rgba(244, 75, 116, 0.3);
  }
  
  .confirm-btn:disabled {
    background-color: #f7a2b7;
    cursor: not-allowed;
    box-shadow: none;
    transform: none;
  }
  
  .confirm-btn:disabled:before {
    display: none;
  }
  
  .otp-section {
    margin-top: 30px;
    animation: slideDown 0.5s ease-in-out;
    transform-origin: top center;
  }
  
  @keyframes slideDown {
    0% { 
      opacity: 0;
      transform: translateY(-20px) scale(0.95);
    }
    70% {
      opacity: 0.9;
      transform: translateY(5px) scale(1.01);
    }
    100% { 
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
  
  .otp-input {
    width: 100%;
    height: 50px;
    border-radius: 8px;
    border: 1px solid #e0e0e0;
    padding: 0 15px;
    font-size: 18px;
    letter-spacing: 4px;
    text-align: center;
    color: #333;
    margin-bottom: 20px;
    outline: none;
    transition: all 0.2s ease;
    background-color: #fff;
  }
  
  .otp-input:focus {
    border-color: #F44B74;
    box-shadow: 0 0 0 2px rgba(244, 75, 116, 0.2);
  }
  
  .otp-input:hover {
    border-color: #d0d0d0;
  }
  
  .status-message {
    margin-top: 20px;
    padding: 14px;
    border-radius: 8px;
    text-align: center;
    font-size: 14px;
    animation: fadeIn 0.4s ease-in-out;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    font-weight: 500;
    transition: all 0.3s ease, opacity 0.3s ease;
    opacity: 1;
  }
  
  .status-message.error {
    background-color: #ffebee;
    color: #c62828;
    border: 1px solid #ffcdd2;
    box-shadow: 0 2px 8px rgba(198, 40, 40, 0.1);
  }
  
  .status-message.success {
    background-color: #e8f5e9;
    color: #2e7d32;
    border: 1px solid #c8e6c9;
    box-shadow: 0 2px 8px rgba(46, 125, 50, 0.1);
  }
  
  .country-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    width: 250px;
    max-height: 300px;
    overflow-y: auto;
    background-color: #fff;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    z-index: 100;
    margin-top: 5px;
    opacity: 0;
    transform: translateY(-10px);
    transition: opacity 0.3s ease, transform 0.3s ease;
    scrollbar-width: thin;
    scrollbar-color: #F44B74 #f1f1f1;
  }
  
  .country-dropdown::-webkit-scrollbar {
    width: 6px;
  }
  
  .country-dropdown::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }
  
  .country-dropdown::-webkit-scrollbar-thumb {
    background: #F44B74;
    border-radius: 3px;
  }
  
  .country-dropdown.show {
    opacity: 1;
    transform: translateY(0);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
  }
  
  .country-option {
    display: flex;
    align-items: center;
    padding: 12px 15px;
    cursor: pointer;
    border-bottom: 1px solid #f5f5f5;
    transition: all 0.2s ease;
  }
  
  .country-option:hover {
    background-color: #f5f5f5;
    transform: translateX(2px);
  }
  
  .country-option:active {
    background-color: #f0f0f0;
    transform: translateX(0);
  }
  
  .country-option:last-child {
    border-bottom: none;
  }
  
  .country-option-flag {
    margin-right: 10px;
    font-size: 18px;
    min-width: 24px;
    text-align: center;
    transition: transform 0.2s ease;
  }
  
  .country-option:hover .country-option-flag {
    transform: scale(1.1);
  }
  
  .country-option-name {
    font-size: 14px;
    color: #333;
    font-weight: 500;
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    transition: color 0.2s ease;
  }
  
  .country-option:hover .country-option-name {
    color: #F44B74;
  }
  
  .country-option-code {
    margin-left: 10px;
    font-size: 14px;
    color: #666;
    font-weight: 400;
    transition: color 0.2s ease;
  }
  
  .country-option:hover .country-option-code {
    color: #F44B74;
  }
  
  @keyframes fadeIn {
    0% { opacity: 0; transform: translateY(-10px); }
    70% { opacity: 0.7; transform: translateY(3px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  
  @media (max-width: 600px) {
    .phone-reset-title h1 {
      font-size: 24px;
    }
    
    .phone-reset-container {
      padding: 16px 8px;
    }
    
    .back-btn {
      width: 32px;
      height: 32px;
    }
    
    .phone-reset-title {
      margin-bottom: 30px;
    }
    
    .country-dropdown {
      width: 200px;
    }
  }
</style>