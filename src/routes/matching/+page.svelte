<script>
  import { onMount } from 'svelte';
  import { authStore } from '$lib/stores/auth.js';

  let matches = [];
  let loading = true;
  let error = null;

  onMount(async () => {
    try {
      // TODO: Implement matches loading from API
      setTimeout(() => {
        loading = false;
        matches = []; // Empty for now
      }, 1000);
    } catch (err) {
      error = err.message;
      loading = false;
    }
  });
</script>

<svelte:head>
  <title>Matching - BarCrush</title>
</svelte:head>

<div class="matching-page">
  <header class="matching-header">
    <div class="container">
      <div class="matching-header-content">
        <h1 class="matching-title">Matching</h1>
        
        <div class="matching-actions">
          <button class="icon-button settings-btn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="currentColor" stroke-width="2"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </header>

  <div class="matching-content">
    {#if loading}
      <div class="loading-indicator">
        <div class="spinner"></div>
        <p class="loading-text">Finding your matches...</p>
      </div>
    {:else if error}
      <div class="error-message">
        <p>Error loading matches: {error}</p>
      </div>
    {:else if matches.length === 0}
      <div class="no-matches-message">
        <div class="no-matches-icon">💕</div>
        <h3>No matches yet</h3>
        <p>Keep swiping to find your perfect match!</p>
        <button class="btn-primary discover-btn">
          <a href="/discover">Discover People</a>
        </button>
      </div>
    {:else}
      <div class="matches-container">
        {#each matches as match}
          <div class="match-card">
            <!-- Match card content will go here -->
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .matching-page {
    min-height: 100vh;
    background-color: var(--background-color);
    padding-bottom: 100px; /* Space for bottom nav */
  }

  .matching-header {
    background-color: var(--background-color);
    padding: 1px 0;
    position: sticky;
    top: 0;
    z-index: 100;
    border-bottom: 1px solid var(--border-color);
  }

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 16px;
  }

  .matching-header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 0;
  }

  .matching-title {
    font-size: 20px;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0;
  }

  .matching-actions {
    display: flex;
    gap: 16px;
    align-items: center;
  }

  .icon-button {
    background: none;
    border: none;
    cursor: pointer;
    padding: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-primary);
    border-radius: 8px;
    transition: background-color 0.2s ease;
  }

  .icon-button:hover {
    background-color: var(--button-hover);
  }

  .matching-content {
    padding: 20px 16px;
  }

  .loading-indicator {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(244, 75, 116, 0.2);
    border-top: 3px solid var(--primary-color);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 16px;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .loading-text {
    color: var(--text-secondary);
    font-size: 14px;
    margin: 0;
  }

  .error-message {
    text-align: center;
    padding: 60px 20px;
    color: var(--error-color);
  }

  .no-matches-message {
    text-align: center;
    padding: 80px 20px;
    color: var(--text-secondary);
  }

  .no-matches-icon {
    font-size: 64px;
    margin-bottom: 24px;
  }

  .no-matches-message h3 {
    font-size: 24px;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0 0 12px 0;
  }

  .no-matches-message p {
    font-size: 16px;
    margin: 0 0 32px 0;
    line-height: 1.5;
  }

  .btn-primary {
    background-color: var(--primary-color);
    color: var(--text-on-primary);
    border: none;
    border-radius: 12px;
    padding: 16px 32px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s ease;
    text-decoration: none;
    display: inline-block;
  }

  .btn-primary:hover {
    background-color: var(--primary-dark);
  }

  .btn-primary a {
    color: inherit;
    text-decoration: none;
  }

  .matches-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
    margin-top: 20px;
  }

  .match-card {
    background-color: var(--card-background);
    border-radius: 16px;
    padding: 20px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    border: 1px solid var(--border-color);
  }
</style>