import dotenv from 'dotenv-flow';

// Load environment variables
dotenv.config();

/**
 * Twilio phone verification routes
 * These endpoints handle sending and verifying SMS codes
 */

// Create a route for sending SMS verification codes
export const sendVerificationCodeRoute = {
  method: 'POST',
  path: '/api/verify/send-code',
  handler: async (c) => {
    try {
      const { phoneNumber, countryCode } = await c.req.json();
      
      // Validate request
      if (!phoneNumber || !countryCode) {
        return c.json({ 
          success: false, 
          error: 'Phone number and country code are required' 
        }, 400);
      }

      // Initialize Twilio client (lazy load to prevent errors if TWILIO_* env vars aren't set)
      const twilio = await initTwilioClient();
      if (!twilio) {
        return c.json({ 
          success: false, 
          error: 'Twilio client initialization failed' 
        }, 500);
      }

      // Format phone number with country code
      const formattedPhoneNumber = `${countryCode}${phoneNumber}`;
      
      // Create a verification service if needed
      const verificationService = process.env.TWILIO_VERIFICATION_SERVICE_SID;
      
      // Send verification code via Twilio Verify API
      const verification = await twilio.verify.v2
        .services(verificationService)
        .verifications.create({
          to: formattedPhoneNumber,
          channel: 'sms'
        });
      
      console.log(`Verification sent to ${formattedPhoneNumber}: ${verification.status}`);
      
      return c.json({
        success: true,
        message: 'Verification code sent',
        status: verification.status
      });
    } catch (error) {
      console.error('Error sending verification code:', error);
      
      return c.json({
        success: false,
        error: error.message || 'Failed to send verification code'
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
      
      // Validate request
      if (!phoneNumber || !countryCode || !code) {
        return c.json({ 
          success: false, 
          error: 'Phone number, country code and verification code are required' 
        }, 400);
      }

      // Initialize Twilio client
      const twilio = await initTwilioClient();
      if (!twilio) {
        return c.json({ 
          success: false, 
          error: 'Twilio client initialization failed' 
        }, 500);
      }

      // Format phone number with country code
      const formattedPhoneNumber = `${countryCode}${phoneNumber}`;
      
      // Get verification service SID
      const verificationService = process.env.TWILIO_VERIFICATION_SERVICE_SID;
      
      // Check verification code via Twilio Verify API
      const verificationCheck = await twilio.verify.v2
        .services(verificationService)
        .verificationChecks.create({
          to: formattedPhoneNumber,
          code
        });
      
      // Return success or failure based on verification status
      if (verificationCheck.status === 'approved') {
        return c.json({
          success: true,
          message: 'Phone number verified successfully',
          verified: true
        });
      } else {
        return c.json({
          success: false,
          message: 'Invalid verification code',
          verified: false,
          status: verificationCheck.status
        }, 400);
      }
    } catch (error) {
      console.error('Error verifying code:', error);
      
      return c.json({
        success: false,
        error: error.message || 'Failed to verify code'
      }, 500);
    }
  }
};

/**
 * Initialize Twilio client with lazy loading
 * This prevents errors if TWILIO_* env vars aren't set during development
 * @returns {Object|null} Twilio client or null if initialization failed
 */
async function initTwilioClient() {
  try {
    // Check if required environment variables are set
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const verificationService = process.env.TWILIO_VERIFICATION_SERVICE_SID;
    
    if (!accountSid || !authToken || !verificationService) {
      console.error('Missing required Twilio environment variables');
      return null;
    }
    
    // Dynamically import Twilio to prevent errors if it's not installed
    const { Twilio } = await import('twilio');
    
    // Initialize Twilio client
    return new Twilio(accountSid, authToken);
  } catch (error) {
    console.error('Failed to initialize Twilio client:', error);
    return null;
  }
}

// Export all routes
export const twilioVerifyRoutes = [
  sendVerificationCodeRoute,
  verifyCodeRoute
];
