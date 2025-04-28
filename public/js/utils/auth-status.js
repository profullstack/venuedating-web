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
    let jwtToken = localStorage.getItem('jwt_token');
    console.log('Auth check - JWT token from localStorage, length:', jwtToken?.length || 0);
    
    // Check for invalid or corrupted token
    if (!jwtToken || jwtToken === 'null' || jwtToken.length < 100) {
      console.warn('Invalid JWT token detected during auth check, attempting recovery');
      
      // Try to recover from session storage backup
      const backupToken = sessionStorage.getItem('backup_jwt_token');
      if (backupToken && backupToken.length > 100) {
        console.log('Recovered JWT token from sessionStorage backup, length:', backupToken.length);
        jwtToken = backupToken;
        // Restore to localStorage
        localStorage.setItem('jwt_token', backupToken);
      } else {
        // Try to recover from session_data in localStorage
        try {
          const sessionData = localStorage.getItem('session_data');
          if (sessionData) {
            const parsedSession = JSON.parse(sessionData);
            if (parsedSession && parsedSession.access_token && parsedSession.access_token.length > 100) {
              console.log('Recovered token from session_data, length:', parsedSession.access_token.length);
              jwtToken = parsedSession.access_token;
              localStorage.setItem('jwt_token', jwtToken);
            }
          }
        } catch (e) {
          console.error('Error recovering from session_data:', e);
        }
        
        // As a final fallback, try to recover from cookie
        if (!jwtToken || jwtToken === 'null' || jwtToken.length < 100) {
          try {
            const cookies = document.cookie.split(';');
            const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('jwt_token='));
            if (tokenCookie) {
              const cookieValue = tokenCookie.split('=')[1];
              if (cookieValue && cookieValue.length > 100) {
                console.log('Recovered JWT token from cookie, length:', cookieValue.length);
                jwtToken = cookieValue;
                localStorage.setItem('jwt_token', cookieValue);
              }
            }
          } catch (e) {
            console.error('Error recovering token from cookie:', e);
          }
        }
      }
    }
    
    // Still no valid token after recovery attempt
    if (!jwtToken || jwtToken === 'null' || jwtToken.length < 100) {
      return {
        authenticated: false,
        message: 'No valid JWT token found in storage'
      };
    }
    
    // Only proceed with a valid token
    if (!jwtToken || jwtToken === 'null' || jwtToken.length < 50) {
      console.error('No valid token available after recovery attempts');
      return {
        authenticated: false,
        message: 'No valid authentication token available'
      };
    }
    
    console.log('Using JWT token for auth check, length:', jwtToken.length);
    
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