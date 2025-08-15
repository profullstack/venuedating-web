/**
 * Phone verification routes
 * These endpoints handle sending and verifying SMS codes using direct Twilio integration
 */

import { sendVerificationCode, verifyCode } from '../utils/verification.js';

// Create a route for sending verification codes
export const sendVerificationCodeRoute = {
  method: 'POST',
  path: '/api/verify/send-code',
  handler: async (c) => {
    try {
      const { phoneNumber, countryCode } = await c.req.json();
      
      const result = await sendVerificationCode(phoneNumber, countryCode);
      return c.json(result, result.success ? 200 : 400);
    } catch (error) {
      console.error('Error sending verification code:', error);
      
      return c.json({
        success: false,
        status: 'failed',
        error: error.message || 'An unexpected error occurred'
      }, 500);
    }
  }
};

// Create a route for verifying SMS codes
export const verifyCodeRoute = {
  method: 'POST',
  path: '/api/verify/check-code',
  handler: async (c) => {
    try {
      const { phoneNumber, countryCode, code } = await c.req.json();
      
      const result = await verifyCode(phoneNumber, countryCode, code);
      return c.json(result, result.success ? 200 : 400);
    } catch (error) {
      console.error('Error checking verification code:', error);
      
      return c.json({
        success: false,
        status: 'failed',
        error: error.message || 'An unexpected error occurred'
      }, 500);
    }
  }
};

// Export all routes
export const verificationRoutes = [
  sendVerificationCodeRoute,
  verifyCodeRoute
];
