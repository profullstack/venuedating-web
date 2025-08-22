/**
 * Session Recovery Utility
 * Handles corrupted or invalid refresh tokens by clearing localStorage
 */

/**
 * Clear all Supabase session data from localStorage
 */
export function clearSupabaseSession() {
  const keysToRemove = [];
  
  // Find all Supabase-related keys
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith('supabase.') || key.includes('supabase'))) {
      keysToRemove.push(key);
    }
  }
  
  // Remove all found keys
  keysToRemove.forEach(key => {
    console.log('Clearing localStorage key:', key);
    localStorage.removeItem(key);
  });
  
  console.log('Cleared all Supabase session data from localStorage');
}

/**
 * Check if we have a corrupted refresh token and clear it
 */
export function checkAndClearCorruptedSession() {
  try {
    // Look for the main Supabase auth token
    const authToken = localStorage.getItem('supabase.auth.token');
    if (authToken) {
      const parsed = JSON.parse(authToken);
      
      // Check if refresh token exists but is invalid format
      if (parsed.refresh_token && typeof parsed.refresh_token !== 'string') {
        console.warn('Detected corrupted refresh token, clearing session');
        clearSupabaseSession();
        return true;
      }
      
      // Check if access token is expired and refresh token is missing
      if (parsed.access_token && !parsed.refresh_token) {
        console.warn('Missing refresh token, clearing session');
        clearSupabaseSession();
        return true;
      }
    }
  } catch (error) {
    console.warn('Error parsing stored auth token, clearing session:', error);
    clearSupabaseSession();
    return true;
  }
  
  return false;
}

/**
 * Initialize session recovery - call this before Supabase client initialization
 */
export function initSessionRecovery() {
  console.log('Initializing session recovery...');
  
  // Check for corrupted session on page load
  const wasCorrupted = checkAndClearCorruptedSession();
  
  if (wasCorrupted) {
    console.log('Corrupted session detected and cleared');
    // Optionally redirect to login
    // window.location.href = '/phone-login';
  }
  
  return !wasCorrupted;
}
