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
    
    if (error instanceof ApiError) {
      return c.json({ error: error.message }, error.statusCode);
    }
    
    // Default to 500 for unknown errors
    return c.json({ error: 'Internal server error' }, 500);
  }
};