<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth.js';

  let countryCode = '+1';
  let countryFlag = '🇺🇸';
  let phoneNumber = '';
  let verificationCode = '';
  let isLoading = false;
  let errorMessage = '';
  let successMessage = '';
  let isVerificationMode = false;
  let storedFullPhone = '';
  let showCountryDropdown = false;

  // Common countries with flags
  const countries = [
    { code: 'us', name: 'United States', dialCode: '+1', flag: '🇺🇸' },
    { code: 'gb', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧' },
    { code: 'ca', name: 'Canada', dialCode: '+1', flag: '🇨🇦' },
    { code: 'au', name: 'Australia', dialCode: '+61', flag: '🇦🇺' },
    { code: 'in', name: 'India', dialCode: '+91', flag: '🇮🇳' },
    { code: 'de', name: 'Germany', dialCode: '+49', flag: '🇩🇪' },
    { code: 'fr', name: 'France', dialCode: '+33', flag: '🇫🇷' },
    { code: 'jp', name: 'Japan', dialCode: '+81', flag: '🇯🇵' },
    { code: 'cn', name: 'China', dialCode: '+86', flag: '🇨🇳' },
    { code: 'br', name: 'Brazil', dialCode: '+55', flag: '🇧🇷' }
  ];

  function goBack() {
    goto('/auth');
  }

  function toggleCountryDropdown() {
    showCountryDropdown = !showCountryDropdown;
  }

  function selectCountry(country) {
    countryCode = country.dialCode;
    countryFlag = country.flag;
    showCountryDropdown = false;
    updateFullPhoneNumber();
  }

  function formatPhoneNumberInput(value) {
    // Get only digits from input
    let digits = value.replace(/\D/g, '');
    
    // Don't format if empty
    if (!digits) {
      return '';
    }
    
    // Format based on length for US numbers
    if (countryCode === '+1') {
      if (digits.length <= 3) {
        return digits;
      } else if (digits.length <= 6) {
        return digits.slice(0, 3) + '-' + digits.slice(3);
      } else {
        return digits.slice(0, 3) + '-' + digits.slice(3, 6) + '-' + digits.slice(6, 10);
      }
    }
    
    return digits;
  }

  function handlePhoneInput(event) {
    const formatted = formatPhoneNumberInput(event.target.value);
    phoneNumber = formatted;
    updateFullPhoneNumber();
  }

  function updateFullPhoneNumber() {
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (cleanPhone) {
      storedFullPhone = `${countryCode}${cleanPhone.startsWith('0') ? cleanPhone.substring(1) : cleanPhone}`;
    } else {
      storedFullPhone = '';
    }
  }

  function showStatus(message, isError = false) {
    if (isError) {
      errorMessage = message;
      successMessage = '';
    } else {
      successMessage = message;
      errorMessage = '';
    }
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      errorMessage = '';
      successMessage = '';
    }, 5000);
  }

  async function handleSubmit() {
    if (isVerificationMode) {
      // Handle OTP verification
      if (!verificationCode || verificationCode.length !== 6) {
        showStatus('Please enter a valid 6-digit code', true);
        return;
      }

      if (!storedFullPhone) {
        showStatus('Phone number not found. Please try again.', true);
        return;
      }

      isLoading = true;

      try {
        const response = await fetch('/api/auth/phone', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            phone: storedFullPhone,
            code: verificationCode,
            action: 'verify_code'
          })
        });

        const data = await response.json();

        if (response.ok) {
          authStore.setUser(data.user);
          showStatus('Login successful!');
          
          // Redirect after success
          setTimeout(() => {
            goto('/discover');
          }, 1500);
        } else {
          showStatus(data.error || 'Invalid verification code. Please try again.', true);
        }
      } catch (error) {
        console.error('Verify code error:', error);
        showStatus('Network error. Please try again.', true);
      } finally {
        isLoading = false;
      }
    } else {
      // Handle sending OTP
      if (!phoneNumber) {
        showStatus('Please enter your phone number', true);
        return;
      }

      if (!countryCode) {
        showStatus('Please select your country', true);
        return;
      }

      const cleanPhone = phoneNumber.replace(/\D/g, '');
      if (cleanPhone.length < 10) {
        showStatus('Please enter a valid phone number', true);
        return;
      }

      isLoading = true;

      try {
        const response = await fetch('/api/auth/phone', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            phone: storedFullPhone,
            action: 'send_code'
          })
        });

        const data = await response.json();

        if (response.ok) {
          showStatus('Verification code sent! Please check your messages.');
          isVerificationMode = true;
        } else {
          showStatus(data.error || 'Failed to send verification code. Please try again.', true);
        }
      } catch (error) {
        console.error('Send code error:', error);
        showStatus('Network error. Please try again.', true);
      } finally {
        isLoading = false;
      }
    }
  }

  function handleKeyPress(event) {
    if (event.key === 'Enter') {
      handleSubmit();
    }
  }

  // Close dropdown when clicking outside
  function handleClickOutside(event) {
    if (!event.target.closest('.country-select')) {
      showCountryDropdown = false;
    }
  }

  onMount(() => {
    // Check if user is already authenticated
    if ($authStore.user) {
      goto('/discover');
    }

    // Add click outside listener
    document.addEventListener('click', handleClickOutside);
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  });
</script>

<svelte:head>
  <title>Phone Login - BarCrush</title>
</svelte:head>

<div class="phone-login-container">
  <div class="phone-login-header">
    <button class="back-btn" on:click={goBack} aria-label="Go back">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M15 18L9 12L15 6" stroke="#F44B74" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
  </div>
  
  <div class="phone-login-title">
    <h1>Phone Login</h1>
  </div>
  
  <div class="phone-login-form">
    <div class="input-group">
      <label for="phone-number">Phone number</label>
      <div class="phone-input-container">
        <div class="country-select" class:active={showCountryDropdown} on:click={toggleCountryDropdown} role="button" tabindex="0" on:keydown={(e) => e.key === 'Enter' && toggleCountryDropdown()}>
          <div class="selected-country">
            <div class="country-flag">{countryFlag}</div>
            <div class="country-code">{countryCode}</div>
            <div class="dropdown-arrow">▼</div>
          </div>
          {#if showCountryDropdown}
            <div class="country-dropdown show">
              <div class="country-options-container">
                {#each countries as country}
                  <div class="country-option" on:click={() => selectCountry(country)} role="button" tabindex="0" on:keydown={(e) => e.key === 'Enter' && selectCountry(country)}>
                    <div class="country-option-flag">{country.flag}</div>
                    <div class="country-option-name">{country.name}</div>
                    <div class="country-option-code">{country.dialCode}</div>
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        </div>
        <input 
          type="tel" 
          id="phone-input" 
          placeholder="123-456-7890" 
          class="phone-input" 
          bind:value={phoneNumber}
          on:input={handlePhoneInput}
          on:keypress={handleKeyPress}
          disabled={isVerificationMode}
        />
      </div>
    </div>
    
    {#if isVerificationMode}
      <div class="otp-section">
        <div class="input-group">
          <label for="otp-input">Verification Code</label>
          <input 
            id="otp-input" 
            type="text" 
            class="otp-input" 
            maxlength="6" 
            placeholder="Enter 6-digit code"
            bind:value={verificationCode}
            on:keypress={handleKeyPress}
          />
        </div>
      </div>
    {/if}
    
    <button 
      class="confirm-btn" 
      on:click={handleSubmit}
      disabled={isLoading}
    >
      {#if isLoading}
        {isVerificationMode ? 'Verifying...' : 'Sending...'}
      {:else}
        {isVerificationMode ? 'Verify Code' : 'Send Verification Code'}
      {/if}
    </button>
    
    <div class="reset-password-link">
      <a href="/auth/forgot">Forgot your password?</a>
    </div>
    
    {#if errorMessage}
      <div class="status-message error">{errorMessage}</div>
    {/if}
    
    {#if successMessage}
      <div class="status-message success">{successMessage}</div>
    {/if}
  </div>
</div>

<style>
  .phone-login-container {
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
  
  .phone-login-header {
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
    background: none;
    border: none;
    cursor: pointer;
  }
  
  .phone-login-title {
    margin-bottom: 60px;
  }
  
  .phone-login-title h1 {
    font-size: 36px;
    font-weight: 700;
    margin: 0;
    color: #000;
    text-align: center;
  }
  
  .phone-login-form {
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
  
  .country-select:focus {
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
    display: block;
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
    border: 1px solid #F44B74;
    padding: 0 15px;
    font-size: 24px;
    letter-spacing: 6px;
    text-align: center;
    color: #F44B74;
    font-weight: 600;
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
  
  .reset-password-link {
    margin-top: 16px;
    text-align: center;
  }
  
  .reset-password-link a {
    color: #F44B74;
    font-size: 14px;
    text-decoration: none;
    font-weight: 500;
    transition: opacity 0.2s ease;
  }
  
  .reset-password-link a:hover {
    opacity: 0.8;
    text-decoration: underline;
  }
  
  .status-message {
    margin-top: 20px;
    padding: 14px;
    border-radius: 8px;
    text-align: center;
    font-size: 14px;
    display: block;
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
    will-change: opacity, transform;
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
  
  .country-options-container {
    max-height: 250px;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: #F44B74 #f1f1f1;
  }
  
  .country-options-container::-webkit-scrollbar {
    width: 6px;
  }
  
  .country-options-container::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }
  
  .country-options-container::-webkit-scrollbar-thumb {
    background: #F44B74;
    border-radius: 3px;
  }
  
  @keyframes fadeIn {
    0% { opacity: 0; transform: translateY(-10px); }
    70% { opacity: 0.7; transform: translateY(3px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  
  @media (max-width: 600px) {
    .phone-login-title h1 {
      font-size: 24px;
    }
    
    .phone-login-container {
      padding: 16px 8px;
    }
    
    .back-btn {
      width: 32px;
      height: 32px;
    }
    
    .phone-login-title {
      margin-bottom: 30px;
    }
    
    .country-dropdown {
      width: 200px;
    }
  }

  /* Dark theme adjustments */
  :global(.dark-theme) .phone-login-container {
    background-color: var(--bg-primary-color);
  }

  :global(.dark-theme) .phone-login-title h1 {
    color: var(--text-primary-color);
  }

  :global(.dark-theme) .input-group label {
    color: var(--text-secondary-color);
  }

  :global(.dark-theme) .input-group input {
    background-color: var(--bg-secondary-color);
    border-color: rgba(255, 255, 255, 0.2);
    color: var(--text-primary-color);
  }

  :global(.dark-theme) .country-select {
    background-color: var(--bg-secondary-color);
    border-color: rgba(255, 255, 255, 0.2);
  }

  :global(.dark-theme) .country-dropdown {
    background-color: var(--bg-secondary-color);
    border-color: rgba(255, 255, 255, 0.2);
  }

  :global(.dark-theme) .country-option {
    border-bottom-color: rgba(255, 255, 255, 0.1);
  }

  :global(.dark-theme) .country-option:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }

  :global(.dark-theme) .country-option-name {
    color: var(--text-primary-color);
  }

  :global(.dark-theme) .country-option-code {
    color: var(--text-secondary-color);
  }
</style>