/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  /**
   * Create a new API error
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   */
  constructor(message, statusCode = 500) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

/**
 * Error handling utilities
 */
export const errorUtils = {
  /**
   * Create a validation error
   * @param {string} message - Error message
   * @returns {ApiError} - API error with 400 status code
   */
  validationError(message) {
    return new ApiError(message, 400);
  },

  /**
   * Create a not found error
   * @param {string} message - Error message
   * @returns {ApiError} - API error with 404 status code
   */
  notFoundError(message) {
    return new ApiError(message, 404);
  },

  /**
   * Create a server error
   * @param {string} message - Error message
   * @returns {ApiError} - API error with 500 status code
   */
  serverError(message) {
    return new ApiError(message, 500);
  },

  /**
   * Handle API errors in a consistent way
   * @param {Error} error - The error to handle
   * @param {Object} c - Hono context
   * @returns {Response} - JSON response with error details
   */
  handleError(error, c) {
    console.error('API Error:', error);
    console.error('Error stack:', error.stack);
    
    // Log additional details for debugging
    if (error.code) console.error('Error code:', error.code);
    if (error.details) console.error('Error details:', error.details);
    if (error.hint) console.error('Error hint:', error.hint);
    
    if (error instanceof ApiError) {
      console.error(`Returning ${error.statusCode} response with message: ${error.message}`);
      return c.json({ error: error.message }, error.statusCode);
    }
    
    // For database errors (likely from Supabase)
    if (error.code && error.details) {
      console.error('Database error detected');
      return c.json({
        error: 'Database error',
        message: error.message,
        code: error.code,
        details: error.details
      }, 500);
    }
    
    // Default to 500 for unknown errors
    console.error('Returning 500 Internal Server Error');
    return c.json({
      error: 'Internal server error',
      message: error.message || 'An unexpected error occurred'
    }, 500);
  }
};