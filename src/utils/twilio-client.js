import dotenv from 'dotenv-flow';

// Load environment variables
dotenv.config();

/**
 * Twilio client for SMS verification
 * Handles direct integration with Twilio API for sending SMS verification codes
 */

/**
 * Generate a random verification code
 * @param {number} length - Length of code (default: 6)
 * @returns {string} - Verification code
 */
export function generateVerificationCode(length = 6) {
  // Generate a random code with specified length
  return Math.floor(Math.random() * Math.pow(10, length))
    .toString()
    .padStart(length, '0');
}

/**
 * Send verification code via Twilio
 * @param {string} phoneNumber - E.164 formatted phone number
 * @param {string} code - Verification code to send
 * @returns {Promise<Object>} - Response with success status and message
 */
export async function sendVerificationSMS(phoneNumber, code) {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhone = process.env.TWILIO_PHONE_NUMBER;
    
    if (!accountSid || !authToken || !twilioPhone) {
      console.warn('⚠️ Missing Twilio environment variables');
      
      // Return success in development mode without sending SMS
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[DEV MODE] Skipping SMS to ${phoneNumber}, code: ${code}`);
        return {
          success: true,
          message: 'SMS skipped in development mode',
          sid: 'dev-mode-sid'
        };
      }
      
      throw new Error('Twilio configuration is missing');
    }
    
    // Initialize Twilio client
    const twilio = await import('twilio');
    const client = twilio.default(accountSid, authToken);
    
    // Prepare message content
    const messageBody = `Your BarCrush verification code is: ${code}`;
    
    // Send SMS via Twilio
    const message = await client.messages.create({
      body: messageBody,
      from: twilioPhone,
      to: phoneNumber
    });
    
    console.log(`[TWILIO] SMS sent to ${phoneNumber}, SID: ${message.sid}`);
    
    return {
      success: true,
      message: 'SMS sent successfully',
      sid: message.sid
    };
  } catch (error) {
    console.error('[TWILIO] Error sending SMS:', error.message);
    
    // Return success in development mode even on error
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DEV MODE] Simulating SMS to ${phoneNumber}, code: ${code}`);
      return {
        success: true,
        message: 'SMS simulated in development mode',
        sid: 'dev-mode-error-sid'
      };
    }
    
    throw error;
  }
}

/**
 * Check if a phone number is a test number that should bypass verification
 * @param {string} phoneNumber - E.164 formatted phone number
 * @returns {boolean} - True if test number
 */
export function isTestPhoneNumber(phoneNumber) {
  // Test phone numbers that should bypass SMS entirely
  const testPhoneNumbers = [
    '+15551234567', // Alex Johnson
    '+15551234568', // Sarah Chen
    '+15551234569', // Mike Rodriguez
    '+15555555555'  // Original demo number
  ];
  
  // Clean the phone number to check different formats
  const cleanPhone = phoneNumber.replace(/\D/g, '');
  
  return (
    testPhoneNumbers.includes(phoneNumber) ||
    testPhoneNumbers.includes(`+1${cleanPhone}`) ||
    cleanPhone === '5551234567' ||
    cleanPhone === '5551234568' ||
    cleanPhone === '5551234569' ||
    cleanPhone === '5555555555' ||
    phoneNumber.includes('555-555-5555')
  );
}

/**
 * Format phone number to E.164 format required by Twilio
 * @param {string} countryCode - Country code (e.g., '+1')
 * @param {string} phoneNumber - Phone number without country code
 * @returns {string} - E.164 formatted phone number
 */
export function formatE164PhoneNumber(countryCode, phoneNumber) {
  // Remove non-digit characters
  const cleanPhoneNumber = phoneNumber.replace(/\D/g, '');
  
  // Ensure country code starts with +
  let cleanCountryCode = countryCode.replace(/\D/g, '');
  if (!cleanCountryCode.startsWith('+')) {
    cleanCountryCode = `+${cleanCountryCode}`;
  }
  
  return `${cleanCountryCode}${cleanPhoneNumber}`;
}
