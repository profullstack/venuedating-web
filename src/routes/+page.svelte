<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth.js';

  let showSplash = true;

  onMount(() => {
    // Show splash screen for 3 seconds, then redirect based on auth state
    const timer = setTimeout(() => {
      showSplash = false;
      
      // Check if user is authenticated
      if ($authStore.user) {
        goto('/discover');
      } else {
        goto('/auth');
      }
    }, 3000);

    return () => clearTimeout(timer);
  });
</script>

<svelte:head>
  <title>BarCrush - Find your perfect match</title>
  <meta name="description" content="BarCrush - The dating app that connects you with people at your favorite venues" />
</svelte:head>

{#if showSplash}
  <div class="splash-container">
    <div class="splash-logo">
      <img 
        src="/images/logo.png" 
        alt="BarCrush Logo" 
        class="splash-img" 
        width="417" 
        height="419" 
      />
    </div>
    
    <div class="splash-title">
      <span class="bar">Bar</span><span class="crush">Crush</span>
    </div>
    
    <div class="loading-indicator">
      <div class="spinner"></div>
    </div>
  </div>
{/if}

<style>
  .splash-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    background: var(--background-color);
    padding: 20px;
  }

  .splash-logo {
    margin-bottom: 24px;
    animation: fadeInUp 0.8s ease-out;
  }

  .splash-img {
    width: 317px;
    height: 219px;
    max-width: 80vw;
    max-height: 40vh;
    display: block;
    object-fit: contain;
    filter: drop-shadow(0 8px 32px rgba(244, 75, 116, 0.3));
  }

  @media (min-width: 600px) {
    .splash-img {
      width: 417px;
      height: 319px;
    }
  }

  .splash-title {
    font-family: 'Arial Rounded MT Bold', 'Arial', sans-serif;
    font-size: 32px;
    font-weight: bold;
    margin-bottom: 40px;
    animation: fadeInUp 0.8s ease-out 0.2s both;
  }

  @media (min-width: 600px) {
    .splash-title {
      font-size: 48px;
    }
  }

  .splash-title .bar {
    color: var(--text-primary);
  }

  .splash-title .crush {
    color: var(--primary-color);
  }

  .loading-indicator {
    animation: fadeInUp 0.8s ease-out 0.4s both;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(244, 75, 116, 0.2);
    border-top: 3px solid var(--primary-color);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Dark theme adjustments */
  :global([data-theme="dark"]) .splash-container {
    background: var(--background-color);
  }

  :global([data-theme="dark"]) .splash-title .bar {
    color: var(--text-primary);
  }
</style>