/**
 * Utility for checking authentication status
 */

/**
 * Check authentication status with the server
 * @returns {Promise<Object>} - Authentication status
 */
export async function checkAuthStatus() {
  try {
    // Get JWT token from localStorage
    const jwtToken = localStorage.getItem('jwt_token');
    
    if (!jwtToken) {
      return {
        authenticated: false,
        message: 'No JWT token found in localStorage'
      };
    }
    
    // Make request to auth status endpoint
    const response = await fetch('/api/1/auth/status', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${jwtToken}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      return {
        authenticated: false,
        message: `Error checking auth status: ${errorData.error || response.statusText}`
      };
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error checking auth status:', error);
    return {
      authenticated: false,
      message: `Error checking auth status: ${error.message}`
    };
  }
}

/**
 * Display authentication status in the console
 * Useful for debugging
 */
export async function logAuthStatus() {
  const status = await checkAuthStatus();
  
  console.group('Authentication Status');
  console.log('Authenticated:', status.authenticated);
  
  if (status.authenticated) {
    console.log('Auth User:', status.auth_user);
    console.log('Public User:', status.public_user);
    console.log('Tables in sync:', status.tables_in_sync);
  } else {
    console.log('Message:', status.message);
    if (status.error) {
      console.log('Error:', status.error);
    }
  }
  
  console.groupEnd();
  
  return status;
}

// Export functions
export default {
  checkAuthStatus,
  logAuthStatus
};