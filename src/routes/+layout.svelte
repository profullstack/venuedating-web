<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { authStore, userProfileStore } from '$lib/stores/auth.js';
  import { themeStore } from '$lib/stores/theme.js';
  import BottomNavigation from '$lib/components/BottomNavigation.svelte';

  // Initialize stores on mount
  onMount(async () => {
    // Initialize theme
    themeStore.init();
    
    // Initialize auth
    await authStore.init();
    
    // Load user profile from cache if available
    userProfileStore.loadFromCache();
  });

  // Reactive statements for auth state
  $: if ($authStore.user && !$userProfileStore.profile) {
    // Fetch user profile when user is authenticated but profile not loaded
    userProfileStore.fetchProfile($authStore.user.id);
  }

  // Clear profile when user signs out
  $: if (!$authStore.user && $userProfileStore.profile) {
    userProfileStore.clear();
  }
</script>

<svelte:head>
  <!-- BarCrush Original CSS Files -->
  <link rel="stylesheet" href="/css/reset.css">
  <link rel="stylesheet" href="/css/theme.css">
  <link rel="stylesheet" href="/css/fonts.css">
  <link rel="stylesheet" href="/css/main.css">
  <link rel="stylesheet" href="/css/layout.css">
  <link rel="stylesheet" href="/css/forms.css">
  <link rel="stylesheet" href="/css/typography.css">
  <link rel="stylesheet" href="/css/animations.css">
  
  <!-- Set theme attribute on document -->
  <script>
    // Set initial theme from localStorage or default to light
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
  </script>
</svelte:head>

<!-- Main App Container -->
<div id="app">
  <!-- Main Content -->
  <main>
    <slot />
  </main>

  <!-- Bottom Navigation -->
  <BottomNavigation />
</div>