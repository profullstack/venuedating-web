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
  // Return values from window global config if available
  return {
    squareAppId: window.SQUARE_APP_ID || '',
    squareEnvironment: window.SQUARE_ENVIRONMENT || 'sandbox'
  };
}

export { getConfig };
