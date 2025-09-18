<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth.js';

  let phone = '';
  let loading = false;
  let error = null;

  // Redirect if already authenticated
  onMount(() => {
    if ($authStore.user) {
      goto('/discover');
    }
  });

  async function handleLogin() {
    if (!phone.trim()) {
      error = 'Please enter your phone number';
      return;
    }

    loading = true;
    error = null;

    try {
      // TODO: Implement phone authentication
      // For now, just simulate login
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate successful login
      goto('/discover');
    } catch (err) {
      error = err.message || 'Login failed. Please try again.';
    } finally {
      loading = false;
    }
  }

  function formatPhoneNumber(value) {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX
    if (digits.length >= 6) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    } else if (digits.length >= 3) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    } else {
      return digits;
    }
  }

  function handlePhoneInput(event) {
    const formatted = formatPhoneNumber(event.target.value);
    phone = formatted;
    event.target.value = formatted;
  }
</script>

<svelte:head>
  <title>Sign In - BarCrush</title>
</svelte:head>

<div class="auth-page">
  <div class="auth-container">
    <div class="auth-header">
      <div class="logo">
        <img src="/images/logo.png" alt="BarCrush Logo" class="logo-img" />
      </div>
      
      <h1 class="auth-title">Welcome to <span class="brand-text">BarCrush</span></h1>
      <p class="auth-subtitle">Sign in with your phone number to continue</p>
    </div>

    <form class="auth-form" on:submit|preventDefault={handleLogin}>
      {#if error}
        <div class="error-message">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
            <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" stroke-width="2"/>
            <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" stroke-width="2"/>
          </svg>
          <span>{error}</span>
        </div>
      {/if}

      <div class="form-group">
        <label for="phone" class="form-label">Phone Number</label>
        <input
          type="tel"
          id="phone"
          class="form-input"
          placeholder="(555) 123-4567"
          bind:value={phone}
          on:input={handlePhoneInput}
          maxlength="14"
          required
        />
      </div>

      <button 
        type="submit" 
        class="btn-primary login-btn"
        disabled={loading || !phone.trim()}
      >
        {#if loading}
          <div class="spinner"></div>
          <span>Signing In...</span>
        {:else}
          <span>Continue</span>
        {/if}
      </button>
    </form>

    <div class="auth-footer">
      <p class="terms-text">
        By continuing, you agree to our 
        <a href="/terms" class="link">Terms of Service</a> and 
        <a href="/privacy" class="link">Privacy Policy</a>
      </p>
    </div>
  </div>
</div>

<style>
  .auth-page {
    min-height: 100vh;
    background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }

  .auth-container {
    background: var(--card-background);
    border-radius: 24px;
    padding: 40px 32px;
    width: 100%;
    max-width: 400px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    text-align: center;
  }

  .auth-header {
    margin-bottom: 32px;
  }

  .logo {
    margin-bottom: 24px;
  }

  .logo-img {
    width: 80px;
    height: 80px;
    object-fit: contain;
    filter: drop-shadow(0 4px 16px rgba(244, 75, 116, 0.3));
  }

  .auth-title {
    font-size: 28px;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0 0 8px 0;
  }

  .brand-text {
    background: linear-gradient(45deg, var(--primary-color), var(--secondary-color));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .auth-subtitle {
    font-size: 16px;
    color: var(--text-secondary);
    margin: 0;
    line-height: 1.5;
  }

  .auth-form {
    margin-bottom: 32px;
  }

  .error-message {
    display: flex;
    align-items: center;
    gap: 8px;
    background-color: rgba(224, 35, 55, 0.1);
    color: var(--error-color);
    padding: 12px 16px;
    border-radius: 8px;
    margin-bottom: 20px;
    font-size: 14px;
    border: 1px solid rgba(224, 35, 55, 0.2);
  }

  .error-message svg {
    flex-shrink: 0;
  }

  .form-group {
    margin-bottom: 24px;
    text-align: left;
  }

  .form-label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
    color: var(--text-primary);
    font-size: 14px;
  }

  .form-input {
    width: 100%;
    padding: 16px 20px;
    border: 2px solid var(--border-color);
    border-radius: 12px;
    font-size: 16px;
    font-weight: 500;
    background: var(--input-background);
    color: var(--text-primary);
    transition: all 0.2s ease;
    outline: none;
    box-sizing: border-box;
  }

  .form-input:hover,
  .form-input:focus {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(244, 75, 116, 0.1);
  }

  .form-input::placeholder {
    color: var(--text-tertiary);
  }

  .btn-primary {
    width: 100%;
    background-color: var(--primary-color);
    color: var(--text-on-primary);
    border: none;
    border-radius: 12px;
    padding: 16px 24px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 52px;
  }

  .btn-primary:hover:not(:disabled) {
    background-color: var(--primary-dark);
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(244, 75, 116, 0.4);
  }

  .btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  .spinner {
    width: 20px;
    height: 20px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top: 2px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .auth-footer {
    border-top: 1px solid var(--border-color);
    padding-top: 24px;
  }

  .terms-text {
    font-size: 12px;
    color: var(--text-tertiary);
    margin: 0;
    line-height: 1.5;
  }

  .link {
    color: var(--primary-color);
    text-decoration: none;
    font-weight: 500;
  }

  .link:hover {
    text-decoration: underline;
  }

  /* Mobile responsive */
  @media (max-width: 480px) {
    .auth-container {
      padding: 32px 24px;
      margin: 10px;
    }

    .auth-title {
      font-size: 24px;
    }

    .auth-subtitle {
      font-size: 14px;
    }
  }
</style>