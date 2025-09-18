<script>
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  let statusMessage = '';
  let isError = false;

  function showStatus(msg, error = false) {
    statusMessage = msg;
    isError = error;
    setTimeout(() => {
      statusMessage = '';
    }, 5000);
  }

  function handlePhoneLogin() {
    goto('/auth/phone-login');
  }

  function handleSignUp() {
    goto('/profile');
  }

  onMount(() => {
    // Any initialization logic can go here
  });
</script>

<svelte:head>
  <title>BarCrush - New place, new faces</title>
</svelte:head>

<div class="auth-container">
  <img src="/images/auth-art.svg" alt="Auth Illustration" class="auth-art" />
  <div class="auth-title">
    <span>New place, new faces.<br />
    See who's here with<br />
    you tonight</span>
  </div>
  <button class="auth-btn phone-btn" on:click={handlePhoneLogin}>
    <div class="icon-bg">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M17 2H7C5.89543 2 5 2.89543 5 4V20C5 21.1046 5.89543 22 7 22H17C18.1046 22 19 21.1046 19 20V4C19 2.89543 18.1046 2 17 2Z" stroke="#F44B74" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M12 18H12.01" stroke="#F44B74" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
    <span>Login with Phone</span>
  </button>

  <div class="signup-link">
    <span>Don't have an account?</span> <button class="signup" on:click={handleSignUp}>Sign Up</button>
  </div>

  {#if statusMessage}
    <div class="auth-status-message" class:error={isError}>
      {statusMessage}
    </div>
  {/if}
</div>

<style>
.auth-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  min-height: auto;
  background: var(--bg-color, #fff);
  padding: 0px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
  box-sizing: border-box;
}

.auth-art {
  width: 100%;
  max-width: none;
  margin-top: 0;
  margin-bottom: 5px;
  display: block;
}

.auth-title {
  font-family: inherit;
  font-size: 38px;
  font-weight: 700;
  color: var(--text-color, #333);
  text-align: center;
  margin-bottom: 22px;
  line-height: 1.2;
  padding: 0 10px;
}

/* Auth Buttons */
.auth-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 340px;
  height: 52px;
  background: var(--bg-color, #fff);
  border: 1px solid var(--border-color, #ddd);
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color, #333);
  text-decoration: none;
  margin-bottom: 16px;
  transition: all 0.2s ease;
  cursor: pointer;
}

.auth-btn:hover {
  background: var(--hover-bg, #f9f9f9);
  border-color: var(--hover-border, #ccc);
}

.icon-bg {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: rgba(244, 75, 116, 0.1);
  border-radius: 50%;
  margin-right: 12px;
}

.phone-btn .icon-bg {
  background: rgba(244, 75, 116, 0.1);
}

.signup-link {
  margin-top: 36px;
  color: var(--muted-text, #888);
  font-size: 14px;
  text-align: center;
  font-weight: 400;
}

.signup-link .signup {
  color: #F44B74;
  font-weight: 600;
  text-decoration: none;
  margin-left: 4px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: inherit;
}

.signup-link .signup:hover {
  text-decoration: underline;
}

.auth-status-message {
  margin-top: 14px;
  font-size: 15px;
  text-align: center;
  color: #fff;
  background: #4BB543;
  border-radius: 8px;
  padding: 8px 16px;
  max-width: 340px;
  margin-left: auto;
  margin-right: auto;
}

.auth-status-message.error {
  background: #F44B74;
}

@media (max-width: 600px) {
  .auth-art {
    width: 100%;
    max-width: none;
    margin-top: 0;
    margin-bottom: 16px;
  }
  
  .auth-title {
    font-size: 24px;
    margin-bottom: 24px;
  }
  
  .auth-btn {
    font-size: 16px;
    height: 44px;
    margin-bottom: 14px;
  }
  
  .icon-bg {
    width: 26px;
    height: 26px;
    margin-right: 10px;
  }
  
  .signup-link {
    font-size: 14px;
    margin-top: 24px;
  }
}
</style>