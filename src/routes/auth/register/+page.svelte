<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth.js';

  let email = '';
  let password = '';
  let confirmPassword = '';
  let selectedPlan = 'monthly';
  let selectedPayment = 'btc';
  let isLoading = false;
  let errorMessage = '';

  function selectPlan(plan) {
    selectedPlan = plan;
  }

  function selectPayment(payment) {
    selectedPayment = payment;
  }

  async function handleRegister(event) {
    event.preventDefault();
    
    if (password !== confirmPassword) {
      errorMessage = 'Passwords do not match';
      return;
    }

    if (password.length < 6) {
      errorMessage = 'Password must be at least 6 characters';
      return;
    }

    isLoading = true;
    errorMessage = '';

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          password,
          plan: selectedPlan,
          paymentMethod: selectedPayment
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Registration successful, redirect to payment or dashboard
        if (selectedPayment === 'stripe') {
          // Redirect to Stripe checkout
          window.location.href = data.checkoutUrl;
        } else {
          // Handle crypto payment
          goto('/payment/crypto');
        }
      } else {
        errorMessage = data.error || 'Registration failed';
      }
    } catch (error) {
      console.error('Registration error:', error);
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
  });
</script>

<svelte:head>
  <title>Create Account - BarCrush</title>
</svelte:head>

<div class="auth-container">
  <div class="auth-card">
    <div class="auth-header">
      <img src="/images/logo.png" alt="BarCrush Logo" class="auth-logo">
      <h1>Create an Account</h1>
    </div>

    <div class="register-container">
      <form on:submit={handleRegister}>
        <div class="form-group">
          <label for="email">Email</label>
          <input 
            type="email" 
            id="email" 
            name="email" 
            bind:value={email}
            class="input-field"
            required
          >
        </div>
        
        <div class="form-group">
          <label for="password">Password</label>
          <input 
            type="password" 
            id="password" 
            name="password" 
            bind:value={password}
            class="input-field"
            required
          >
        </div>
        
        <div class="form-group">
          <label for="confirm-password">Confirm Password</label>
          <input 
            type="password" 
            id="confirm-password" 
            name="confirm-password" 
            bind:value={confirmPassword}
            class="input-field"
            required
          >
        </div>
        
        <div class="form-group">
          <label>Subscription Plan</label>
          <div class="plan-options">
            <div 
              class="plan-option {selectedPlan === 'monthly' ? 'selected' : ''}" 
              on:click={() => selectPlan('monthly')}
              role="button"
              tabindex="0"
              on:keydown={(e) => e.key === 'Enter' && selectPlan('monthly')}
            >
              <h3>Monthly</h3>
              <div class="price">$5/month</div>
              <div class="description">Billed monthly, cancel anytime</div>
            </div>
            <div 
              class="plan-option {selectedPlan === 'yearly' ? 'selected' : ''}" 
              on:click={() => selectPlan('yearly')}
              role="button"
              tabindex="0"
              on:keydown={(e) => e.key === 'Enter' && selectPlan('yearly')}
            >
              <h3>Yearly</h3>
              <div class="price">$30/year</div>
              <div class="description">Save $30 with annual billing</div>
            </div>
          </div>
        </div>
        
        <div class="payment-options">
          <h3>Payment Method</h3>
          <div class="payment-methods">
            <div 
              class="payment-method {selectedPayment === 'btc' ? 'selected' : ''}" 
              on:click={() => selectPayment('btc')}
              role="button"
              tabindex="0"
              on:keydown={(e) => e.key === 'Enter' && selectPayment('btc')}
            >
              <div>Bitcoin</div>
            </div>
            <div 
              class="payment-method {selectedPayment === 'eth' ? 'selected' : ''}" 
              on:click={() => selectPayment('eth')}
              role="button"
              tabindex="0"
              on:keydown={(e) => e.key === 'Enter' && selectPayment('eth')}
            >
              <div>Ethereum</div>
            </div>
            <div 
              class="payment-method {selectedPayment === 'sol' ? 'selected' : ''}" 
              on:click={() => selectPayment('sol')}
              role="button"
              tabindex="0"
              on:keydown={(e) => e.key === 'Enter' && selectPayment('sol')}
            >
              <div>Solana</div>
            </div>
            <div 
              class="payment-method {selectedPayment === 'usdc' ? 'selected' : ''}" 
              on:click={() => selectPayment('usdc')}
              role="button"
              tabindex="0"
              on:keydown={(e) => e.key === 'Enter' && selectPayment('usdc')}
            >
              <div>USDC</div>
            </div>
            <div 
              class="payment-method {selectedPayment === 'stripe' ? 'selected' : ''}" 
              on:click={() => selectPayment('stripe')}
              role="button"
              tabindex="0"
              on:keydown={(e) => e.key === 'Enter' && selectPayment('stripe')}
            >
              <div>Credit Card</div>
            </div>
          </div>
        </div>

        {#if errorMessage}
          <div class="error-message">{errorMessage}</div>
        {/if}
        
        <button type="submit" class="register-button btn-primary" disabled={isLoading}>
          {#if isLoading}
            <div class="button-with-loader">
              <span>Creating Account...</span>
              <div class="loader"></div>
            </div>
          {:else}
            Register & Subscribe
          {/if}
        </button>
      </form>
      
      <p class="login-link">
        <span>Already have an account?</span> 
        <a href="/auth/login">Login</a> 
        <span>instead.</span>
      </p>
    </div>
  </div>
</div>

<style>
  .register-container {
    max-width: 720px;
    margin: 0 auto;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .form-group {
    margin-bottom: 20px;
  }

  .form-group label {
    display: block;
    margin-bottom: 5px;
    color: var(--text-primary-color);
    font-weight: 500;
  }

  .plan-options {
    display: flex;
    gap: 15px;
    margin-bottom: 15px;
  }
  
  .plan-option {
    flex: 1;
    padding: 15px;
    border: 1px solid #ddd;
    border-radius: 5px;
    background-color: white;
    cursor: pointer;
    transition: border-color 0.2s, background-color 0.2s;
  }
  
  .plan-option.selected {
    border-color: var(--primary-color);
    background-color: rgba(224, 35, 55, 0.1);
    box-shadow: 0 4px 6px -1px rgba(224, 35, 55, 0.2);
  }
  
  .plan-option:not(.selected) {
    background-color: rgba(31, 41, 55, 0.2);
  }
  
  .plan-option h3 {
    margin-top: 0;
    margin-bottom: 5px;
    color: var(--primary-color);
  }
  
  .plan-option .price {
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 5px;
    color: var(--text-primary-color);
  }
  
  .plan-option .description {
    color: var(--text-secondary-color);
    font-size: 14px;
  }
  
  .payment-options {
    margin-bottom: 15px;
  }
  
  .payment-options h3 {
    margin-top: 0;
    margin-bottom: 10px;
    color: var(--text-secondary-color);
    font-size: 16px;
  }
  
  .payment-methods {
    display: flex;
    gap: 15px;
    flex-wrap: wrap;
  }
  
  .payment-method {
    flex: 1;
    min-width: 120px;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 5px;
    text-align: center;
    cursor: pointer;
    transition: border-color 0.2s, background-color 0.2s;
    font-size: 14px;
  }
  
  .payment-method.selected {
    border-color: var(--primary-color);
    background-color: rgba(224, 35, 55, 0.1);
    box-shadow: 0 4px 6px -1px rgba(224, 35, 55, 0.2);
  }
  
  .payment-method:not(.selected) {
    background-color: rgba(31, 41, 55, 0.2);
  }

  .register-button {
    width: 100%;
    margin-bottom: 20px;
  }

  .login-link {
    text-align: center;
    color: var(--text-secondary-color);
  }

  .login-link a {
    color: var(--primary-color);
    text-decoration: none;
  }

  .login-link a:hover {
    text-decoration: underline;
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

  .button-with-loader {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }

  .loader {
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top: 2px solid white;
    width: 16px;
    height: 16px;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* Dark theme adjustments */
  :global(.dark-theme) .plan-option:not(.selected),
  :global(.dark-theme) .payment-method:not(.selected) {
    background-color: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.2);
  }

  :global(.dark-theme) .plan-option .description {
    color: var(--text-secondary-color);
  }
</style>