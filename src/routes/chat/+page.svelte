<script>
  import { onMount } from 'svelte';
  import { authStore } from '$lib/stores/auth.js';

  let conversations = [];
  let loading = true;
  let error = null;

  onMount(async () => {
    try {
      // TODO: Implement conversations loading from API
      setTimeout(() => {
        loading = false;
        conversations = []; // Empty for now
      }, 1000);
    } catch (err) {
      error = err.message;
      loading = false;
    }
  });
</script>

<svelte:head>
  <title>Chat - BarCrush</title>
</svelte:head>

<div class="chat-page">
  <header class="chat-header">
    <div class="container">
      <div class="chat-header-content">
        <h1 class="chat-title">Messages</h1>
        
        <div class="chat-actions">
          <button class="icon-button search-btn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2"/>
              <path d="M21 21L16.65 16.65" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </header>

  <div class="chat-content">
    {#if loading}
      <div class="loading-indicator">
        <div class="spinner"></div>
        <p class="loading-text">Loading conversations...</p>
      </div>
    {:else if error}
      <div class="error-message">
        <p>Error loading conversations: {error}</p>
      </div>
    {:else if conversations.length === 0}
      <div class="no-conversations-message">
        <div class="no-conversations-icon">💬</div>
        <h3>No conversations yet</h3>
        <p>Start matching with people to begin chatting!</p>
        <button class="btn-primary matching-btn">
          <a href="/matching">Find Matches</a>
        </button>
      </div>
    {:else}
      <div class="conversations-list">
        {#each conversations as conversation}
          <div class="conversation-item">
            <!-- Conversation item content will go here -->
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .chat-page {
    min-height: 100vh;
    background-color: var(--background-color);
    padding-bottom: 100px; /* Space for bottom nav */
  }

  .chat-header {
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

  .chat-header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 0;
  }

  .chat-title {
    font-size: 20px;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0;
  }

  .chat-actions {
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

  .chat-content {
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

  .no-conversations-message {
    text-align: center;
    padding: 80px 20px;
    color: var(--text-secondary);
  }

  .no-conversations-icon {
    font-size: 64px;
    margin-bottom: 24px;
  }

  .no-conversations-message h3 {
    font-size: 24px;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0 0 12px 0;
  }

  .no-conversations-message p {
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

  .conversations-list {
    display: flex;
    flex-direction: column;
    gap: 1px;
    background-color: var(--border-color);
    border-radius: 12px;
    overflow: hidden;
  }

  .conversation-item {
    background-color: var(--card-background);
    padding: 16px 20px;
    cursor: pointer;
    transition: background-color 0.2s ease;
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .conversation-item:hover {
    background-color: var(--surface-variant);
  }

  .conversation-item:first-child {
    border-radius: 12px 12px 0 0;
  }

  .conversation-item:last-child {
    border-radius: 0 0 12px 12px;
  }

  .conversation-item:only-child {
    border-radius: 12px;
  }
</style>