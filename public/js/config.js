/**
 * Configuration Module
 * 
 * Provides access to configuration values
 */

/**
 * Get configuration values
 * @returns {Object} Configuration object
 */
function getConfig() {
  // Configuration is now fetched from the server via API endpoints
  // This ensures proper environment variable usage
  return {
    // These values will be fetched from /api/square-credentials endpoint
    squareAppId: null,
    squareEnvironment: null
  };
}

export { getConfig };
