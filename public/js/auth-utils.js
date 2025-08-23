/**
 * Authentication utilities for handling JWT token refresh and real Supabase accounts
 */

// Import Supabase client
let supabaseClient = null;

/**
 * Initialize Supabase client for token management
 */
async function initSupabaseClient() {
  if (!supabaseClient) {
    const { createClient } = await import('https://cdn.skypack.dev/@supabase/supabase-js@2');
    supabaseClient = createClient(
      window.SUPABASE_URL || 'https://arokhsfbkdnfuklmqajh.supabase.co',
      window.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFyb2toc2Zia2RuZnVrbG1xYWpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTM1MjY4MDAsImV4cCI6MjAyOTEwMjgwMH0.iP6g3dP7CIhRvOoaJzJKjGhOKpJVpDKQhTqKzJKjGhO'
    );
  }
  return supabaseClient;
}

/**
 * Get current session with automatic token refresh
 * @returns {Object|null} Session object or null
 */
export async function getCurrentSession() {
  try {
    const supabase = await initSupabaseClient();
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error getting session:', error);
      return null;
    }
    
    return session;
  } catch (error) {
    console.error('Error initializing Supabase client:', error);
    return null;
  }
}

/**
 * Refresh the current session token
 * @returns {Object|null} New session or null
 */
export async function refreshSession() {
  try {
    const supabase = await initSupabaseClient();
    const { data: { session }, error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.error('Error refreshing session:', error);
      return null;
    }
    
    console.log('Session refreshed successfully');
    return session;
  } catch (error) {
    console.error('Error refreshing session:', error);
    return null;
  }
}

/**
 * Get authentication headers with automatic token refresh
 * @returns {Object} Headers object
 */
export async function getAuthHeaders() {
  const headers = {
    'Content-Type': 'application/json'
  };

  try {
    // Get current session (this will automatically refresh if needed)
    let session = await getCurrentSession();
    
    if (session && session.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    } else {
      console.warn('No valid session found');
    }
  } catch (error) {
    console.error('Error getting auth headers:', error);
  }

  return headers;
}

/**
 * Make an authenticated API request with automatic token refresh
 * @param {string} url - API endpoint URL
 * @param {Object} options - Fetch options
 * @returns {Promise<Response>} Fetch response
 */
export async function authenticatedFetch(url, options = {}) {
  const headers = {
    ...(await getAuthHeaders()),
    ...(options.headers || {})
  };

  const requestOptions = {
    ...options,
    headers
  };

  console.log('Making authenticated request to:', url);

  try {
    const response = await fetch(url, requestOptions);
    
    // If we get a 401, try to refresh the token and retry once
    if (response.status === 401) {
      console.log('Received 401, attempting to refresh token...');
      
      const newSession = await refreshSession();
      if (newSession && newSession.access_token) {
        // Retry with new token
        const newHeaders = {
          ...headers,
          'Authorization': `Bearer ${newSession.access_token}`
        };
        
        const retryOptions = {
          ...requestOptions,
          headers: newHeaders
        };
        
        console.log('Retrying request with refreshed token');
        return await fetch(url, retryOptions);
      } else {
        console.warn('Token refresh failed, redirecting to login');
        // Redirect to login if refresh fails
        window.location.href = '/auth';
        throw new Error('Authentication failed - redirecting to login');
      }
    }
    
    return response;
  } catch (error) {
    console.error('Authenticated fetch failed:', error);
    throw error;
  }
}

/**
 * Check if user is authenticated
 * @returns {boolean} True if authenticated
 */
export async function isAuthenticated() {
  const session = await getCurrentSession();
  return session && session.access_token && session.user;
}

/**
 * Sign out the current user
 */
export async function signOut() {
  try {
    const supabase = await initSupabaseClient();
    await supabase.auth.signOut();
    console.log('User signed out successfully');
  } catch (error) {
    console.error('Error signing out:', error);
  }
}
