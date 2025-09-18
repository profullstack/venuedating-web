<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth.js';

  let currentStep = 1;
  let countryCode = '+1';
  let phoneNumber = '';
  let verificationCode = '';
  let displayName = '';
  let isLoading = false;
  let errorMessage = '';
  let successMessage = '';
  let countdown = 0;
  let countdownInterval;

  $: fullPhoneNumber = countryCode + phoneNumber;
  $: displayPhoneNumber = formatPhoneNumber(fullPhoneNumber);

  function formatPhoneNumber(phone) {
    if (!phone) return '';
    // Simple formatting for display
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length >= 10) {
      return `${cleaned.slice(0, -10)}${cleaned.slice(-10, -7)}-${cleaned.slice(-7, -4)}-${cleaned.slice(-4)}`;
    }
    return phone;
  }

  function startCountdown() {
    countdown = 60;
    countdownInterval = setInterval(() => {
      countdown--;
      if (countdown <= 0) {
        clearInterval(countdownInterval);
      }
    }, 1000);
  }

  function clearMessages() {
    errorMessage = '';
    successMessage = '';
  }

  async function sendVerificationCode() {
    if (!phoneNumber || phoneNumber.length < 10) {
      errorMessage = 'Please enter a valid phone number';
      return;
    }

    isLoading = true;
    clearMessages();

    try {
      const response = await fetch('/api/auth/phone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phone: fullPhoneNumber,
          action: 'send_code'
        })
      });

      const data = await response.json();

      if (response.ok) {
        currentStep = 2;
        startCountdown();
        successMessage = 'Verification code sent!';
      } else {
        errorMessage = data.error || 'Failed to send verification code';
      }
    } catch (error) {
      console.error('Send code error:', error);
      errorMessage = 'Network error. Please try again.';
    } finally {
      isLoading = false;
    }
  }

  async function verifyCode() {
    if (!verificationCode || verificationCode.length !== 6) {
      errorMessage = 'Please enter a valid 6-digit code';
      return;
    }

    isLoading = true;
    clearMessages();

    try {
      const response = await fetch('/api/auth/phone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phone: fullPhoneNumber,
          code: verificationCode,
          action: 'verify_code'
        })
      });

      const data = await response.json();

      if (response.ok) {
        currentStep = 3;
        successMessage = 'Phone verified successfully!';
      } else {
        errorMessage = data.error || 'Invalid verification code';
      }
    } catch (error) {
      console.error('Verify code error:', error);
      errorMessage = 'Network error. Please try again.';
    } finally {
      isLoading = false;
    }
  }

  async function completeSignup() {
    if (!displayName || displayName.trim().length < 2) {
      errorMessage = 'Please enter a display name (at least 2 characters)';
      return;
    }

    isLoading = true;
    clearMessages();

    try {
      const response = await fetch('/api/auth/phone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phone: fullPhoneNumber,
          displayName: displayName.trim(),
          action: 'complete_signup'
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Update auth store with user data
        authStore.setUser(data.user);
        successMessage = 'Account created successfully!';
        
        // Redirect to discover page after a brief delay
        setTimeout(() => {
          goto('/discover');
        }, 1500);
      } else {
        errorMessage = data.error || 'Failed to complete signup';
      }
    } catch (error) {
      console.error('Complete signup error:', error);
      errorMessage = 'Network error. Please try again.';
    } finally {
      isLoading = false;
    }
  }

  function goBackToPhone() {
    currentStep = 1;
    clearMessages();
    if (countdownInterval) {
      clearInterval(countdownInterval);
    }
  }

  function goBackToCode() {
    currentStep = 2;
    clearMessages();
  }

  async function resendCode() {
    if (countdown > 0) return;
    
    isLoading = true;
    clearMessages();

    try {
      const response = await fetch('/api/auth/phone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phone: fullPhoneNumber,
          action: 'resend_code'
        })
      });

      const data = await response.json();

      if (response.ok) {
        startCountdown();
        successMessage = 'New verification code sent!';
      } else {
        errorMessage = data.error || 'Failed to resend code';
      }
    } catch (error) {
      console.error('Resend code error:', error);
      errorMessage = 'Network error. Please try again.';
    } finally {
      isLoading = false;
    }
  }

  onMount(() => {
    // Check if user is already authenticated
    if ($authStore.user) {
      goto('/discover');
    }

    return () => {
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }
    };
  });
</script>

<svelte:head>
  <title>Phone Signup - BarCrush</title>
</svelte:head>

<div class="auth-container">
  <div class="auth-card">
    <div class="auth-header">
      <img src="/images/logo.png" alt="BarCrush Logo" class="auth-logo">
      <h1>Phone Signup</h1>
    </div>
    
    <div class="phone-signup-container">
      <!-- Step 1: Enter Phone Number -->
      {#if currentStep === 1}
        <div class="step step-1">
          <div class="back-button" on:click={() => goto('/auth/login')} role="button" tabindex="0" on:keydown={(e) => e.key === 'Enter' && goto('/auth/login')}>
            <i class="fas fa-arrow-left"></i> Back to Login
          </div>
          
          <p>Enter your phone number to create an account or sign in</p>
          
          <div class="phone-input-group">
            <select class="input-field country-code" bind:value={countryCode}>
              <option value="+1">+1</option>
              <option value="+44">+44</option>
              <option value="+61">+61</option>
              <option value="+33">+33</option>
              <option value="+49">+49</option>
              <option value="+81">+81</option>
              <option value="+86">+86</option>
            </select>
            <input 
              type="tel" 
              class="input-field phone-number" 
              bind:value={phoneNumber}
              placeholder="Phone Number" 
              autocomplete="tel"
            >
          </div>
          
          {#if errorMessage}
            <div class="error-message">{errorMessage}</div>
          {/if}
          
          <button class="primary-button" on:click={sendVerificationCode} disabled={isLoading}>
            <div class="button-with-loader">
              <span>Send Verification Code</span>
              {#if isLoading}
                <div class="loader"></div>
              {/if}
            </div>
          </button>
        </div>
      {/if}
      
      <!-- Step 2: Enter Verification Code -->
      {#if currentStep === 2}
        <div class="step step-2">
          <div class="back-button" on:click={goBackToPhone} role="button" tabindex="0" on:keydown={(e) => e.key === 'Enter' && goBackToPhone()}>
            <i class="fas fa-arrow-left"></i> Back
          </div>
          
          <p>Enter the verification code sent to <span class="phone-display">{displayPhoneNumber}</span></p>
          
          <input 
            type="text" 
            class="input-field verification-code" 
            bind:value={verificationCode}
            placeholder="Verification Code" 
            maxlength="6"
          >
          
          {#if errorMessage}
            <div class="error-message">{errorMessage}</div>
          {/if}
          
          {#if successMessage}
            <div class="success-message">{successMessage}</div>
          {/if}
          
          {#if countdown > 0}
            <div class="countdown">Resend code in {countdown} seconds</div>
          {:else}
            <button class="resend-code" on:click={resendCode} disabled={isLoading}>
              Resend Code
            </button>
          {/if}
          
          <button class="primary-button" on:click={verifyCode} disabled={isLoading}>
            <div class="button-with-loader">
              <span>Verify Code</span>
              {#if isLoading}
                <div class="loader"></div>
              {/if}
            </div>
          </button>
        </div>
      {/if}
      
      <!-- Step 3: Complete Profile -->
      {#if currentStep === 3}
        <div class="step step-3">
          <h2>Complete Your Profile</h2>
          
          <input 
            type="text" 
            class="input-field" 
            bind:value={displayName}
            placeholder="Display Name"
          >
          
          {#if errorMessage}
            <div class="error-message">{errorMessage}</div>
          {/if}
          
          {#if successMessage}
            <div class="success-message">{successMessage}</div>
          {/if}
          
          <button class="primary-button" on:click={completeSignup} disabled={isLoading}>
            <div class="button-with-loader">
              <span>Complete Signup</span>
              {#if isLoading}
                <div class="loader"></div>
              {/if}
            </div>
          </button>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .phone-signup-container {
    max-width: 400px;
    margin: 0 auto;
    padding: 20px;
  }
  
  .phone-input-group {
    display: flex;
    margin-bottom: 20px;
  }
  
  .country-code {
    width: 80px;
    margin-right: 10px;
  }
  
  .phone-number {
    flex: 1;
  }
  
  .verification-code {
    margin-bottom: 20px;
    text-align: center;
    font-size: 18px;
    letter-spacing: 2px;
  }
  
  .step {
    display: block;
  }
  
  .loader {
    border: 3px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top: 3px solid var(--primary-color);
    width: 20px;
    height: 20px;
    animation: spin 1s linear infinite;
    margin-left: 10px;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .button-with-loader {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .error-message {
    color: var(--error-color);
    font-size: 14px;
    margin-bottom: 15px;
    padding: 10px;
    background-color: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.2);
    border-radius: 4px;
  }
  
  .success-message {
    color: var(--success-color);
    font-size: 14px;
    margin-bottom: 15px;
    padding: 10px;
    background-color: rgba(34, 197, 94, 0.1);
    border: 1px solid rgba(34, 197, 94, 0.2);
    border-radius: 4px;
  }
  
  .resend-code {
    color: var(--primary-color);
    text-decoration: underline;
    cursor: pointer;
    font-size: 14px;
    margin-bottom: 15px;
    display: inline-block;
    background: none;
    border: none;
    padding: 0;
  }

  .resend-code:hover {
    text-decoration: none;
  }

  .resend-code:disabled {
    color: var(--text-secondary-color);
    cursor: not-allowed;
    text-decoration: none;
  }
  
  .countdown {
    font-size: 14px;
    margin-bottom: 15px;
    color: var(--text-secondary-color);
  }
  
  .back-button {
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    color: var(--text-secondary-color);
    cursor: pointer;
    font-size: 14px;
  }

  .back-button:hover {
    color: var(--primary-color);
  }
  
  .back-button i {
    margin-right: 5px;
  }

  .phone-display {
    color: var(--primary-color);
    font-weight: 500;
  }

  .step-3 h2 {
    text-align: center;
    margin-bottom: 20px;
    color: var(--text-primary-color);
  }

  .primary-button {
    width: 100%;
    margin-bottom: 20px;
  }

  .primary-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  /* Dark theme adjustments */
  :global(.dark-theme) .error-message {
    background-color: rgba(239, 68, 68, 0.15);
  }

  :global(.dark-theme) .success-message {
    background-color: rgba(34, 197, 94, 0.15);
  }
</style>