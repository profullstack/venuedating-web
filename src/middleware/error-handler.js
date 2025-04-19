import { errorUtils, ApiError } from '../utils/error-utils.js';

/**
 * Middleware for handling errors in a consistent way
 * @param {Object} c - Hono context
 * @param {Function} next - Next middleware function
 * @returns {Promise<Response>} - Response object
 */
export async function errorHandler(c, next) {
  try {
    // Call the next middleware or route handler
    return await next();
  } catch (error) {
    // Use the error utilities to handle the error
    return errorUtils.handleError(error, c);
  }
}

/**
 * Middleware for validating request body
 * @param {Function} validator - Function to validate the request body
 * @returns {Function} - Middleware function
 */
export function validateBody(validator) {
  return async (c, next) => {
    try {
      const body = await c.req.json();
      
      // Validate the body
      const validationResult = validator(body);
      
      if (validationResult !== true) {
        throw errorUtils.validationError(validationResult || 'Invalid request body');
      }
      
      // Attach the validated body to the context
      c.set('body', body);
      
      return next();
    } catch (error) {
      if (error instanceof SyntaxError) {
        return c.json({ error: 'Invalid JSON in request body' }, 400);
      }
      
      return errorUtils.handleError(error, c);
    }
  };
}

/**
 * Common validators for request bodies
 */
export const validators = {
  /**
   * Validate HTML content in request body
   * @param {Object} body - Request body
   * @returns {boolean|string} - True if valid, error message if invalid
   */
  htmlContent(body) {
    if (!body) return 'Request body is required';
    if (!body.html) return 'HTML content is required';
    return true;
  },
  
  /**
   * Validate Markdown content in request body
   * @param {Object} body - Request body
   * @returns {boolean|string} - True if valid, error message if invalid
   */
  markdownContent(body) {
    if (!body) return 'Request body is required';
    if (!body.markdown) return 'Markdown content is required';
    return true;
  }
};