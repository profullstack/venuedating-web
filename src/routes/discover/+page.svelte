<script>
  import { onMount } from 'svelte';
  import { authStore } from '$lib/stores/auth.js';

  let venues = [];
  let loading = true;
  let error = null;

  onMount(async () => {
    try {
      // TODO: Implement venue loading from API
      // For now, show loading state
      setTimeout(() => {
        loading = false;
        venues = []; // Empty for now
      }, 1000);
    } catch (err) {
      error = err.message;
      loading = false;
    }
  });
</script>

<svelte:head>
  <title>Discover - BarCrush</title>
</svelte:head>

<div class="discover-page">
  <header class="discover-header">
    <div class="container">
      <div class="discover-header-content">
        <!-- Side menu placeholder -->
        <div class="user-profile-menu">
          <button class="icon-button menu-btn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 12H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <path d="M3 6H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <path d="M3 18H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
        
        <h1 class="discover-title">Discover</h1>
        
        <div class="discover-actions">
          <button class="icon-button filter-btn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 21V14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M4 10V3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M12 21V12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M12 8V3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M20 21V16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M20 12V3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M1 14H7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M9 8H15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M17 16H23" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
          
          <button class="icon-button notification-btn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M13.73 21C13.5542 21.3031 13.3018 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              <circle cx="18" cy="8" r="4" fill="#F44B74" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </header>

  <div class="venues-list">
    {#if loading}
      <div class="loading-indicator">
        <div class="spinner"></div>
        <p class="loading-text">Loading venues...</p>
      </div>
    {:else if error}
      <div class="error-message">
        <p>Error loading venues: {error}</p>
      </div>
    {:else if venues.length === 0}
      <div class="no-venues-message">
        <p>No venues found in your area</p>
        <p>Try adjusting your location or filters</p>
      </div>
    {:else}
      <div class="venues-container">
        {#each venues as venue}
          <div class="venue-card">
            <!-- Venue card content will go here -->
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <div class="around-me-section">
    <h2 class="section-title">Around me</h2>
    
    <div class="map-container">
      <div class="map-placeholder">
        <p>Map will be implemented here</p>
        <p>Showing venues and users nearby</p>
      </div>
    </div>
  </div>
</div>

<style>
  .discover-page {
    min-height: 46vh;
    background-color: var(--background-color);
  }

  .discover-header {
    background-color: var(--background-color);
    padding: 1px 0;
    position: sticky;
    top: 0;
    z-index: 100;
    box-shadow: none;
    border-bottom: none;
  }

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 16px;
  }

  .discover-header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 0;
  }

  .discover-title {
    font-size: 20px;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0;
  }

  .discover-actions {
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
    position: relative;
    border-radius: 8px;
    transition: background-color 0.2s ease;
  }

  .icon-button:hover {
    background-color: var(--button-hover);
  }

  .notification-btn circle {
    fill: #F44B74;
  }

  .venues-list {
    padding: 33px 16px;
    margin-bottom: -6px;
    background: var(--background-color);
  }

  .loading-indicator {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
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

  .error-message,
  .no-venues-message {
    text-align: center;
    padding: 40px 20px;
    color: var(--text-secondary);
  }

  .error-message {
    color: var(--error-color);
  }

  .around-me-section {
    padding: 20px 0;
    background-color: var(--background-color);
    min-height: 50vh;
  }

  .section-title {
    color: var(--text-primary);
    font-size: 24px;
    font-weight: bold;
    margin: 0 0 16px 20px;
  }

  .map-container {
    position: relative;
    margin: 0 16px;
    height: 400px;
    border-radius: 16px;
    overflow: hidden;
    background-color: var(--surface-color);
    border: 1px solid var(--border-color);
  }

  .map-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--text-secondary);
    text-align: center;
  }

  .map-placeholder p {
    margin: 8px 0;
    font-size: 16px;
  }

  .venues-container {
    display: flex;
    overflow-x: auto;
    gap: 8px;
    -webkit-overflow-scrolling: touch;
    scroll-snap-type: x mandatory;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .venues-container::-webkit-scrollbar {
    display: none;
  }

  .venue-card {
    flex: 0 0 auto;
    width: calc(50vw - 16px);
    max-width: 280px;
    position: relative;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    aspect-ratio: 3 / 4;
    margin: 0 4px;
    background-color: var(--primary-color);
  }
</style>