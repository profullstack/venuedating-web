import dotenv from 'dotenv-flow';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

/**
 * Initialize Supabase client with lazy loading and development mode fallback
 * This prevents errors if SUPABASE_* env vars aren't set during development
 * @returns {Object|null} Supabase client or mock client for development
 */
async function initSupabaseClient() {
  try {
    // Check if we're in development mode
    const isDev = process.env.NODE_ENV !== 'production';
    
    // Check if required environment variables are set
    const supabaseUrl = process.env.SUPABASE_URL;
    // Use the environment variables available in your system
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      if (isDev) {
        console.warn('⚠️ DEVELOPMENT MODE: Missing Supabase environment variables');
        console.warn('⚠️ DEVELOPMENT MODE: Using mock Supabase client for phone verification');
        console.warn('⚠️ DEVELOPMENT MODE: Use code 123456 for verification');
        
        // Return a mock client for development
        return {
          auth: {
            admin: {
              listUsers: async () => ({ data: { users: [] }, error: null })
            },
            signInWithOtp: async () => ({ data: {}, error: null }),
            verifyOtp: async () => ({
              data: {
                user: {
                  id: 'dev-mode-user-id',
                  phone: 'dev-mode-phone',
                  created_at: new Date().toISOString()
                }
              },
              error: null
            })
          },
          from: () => ({
            select: () => ({
              eq: () => ({
                single: async () => ({ data: null, error: null })
              })
            })
          })
        };
      } else {
        console.error('Missing required Supabase environment variables');
        return null;
      }
    }
    
    // Initialize Supabase client
    return createClient(supabaseUrl, supabaseKey);
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    
    // In development mode, provide a fallback
    if (process.env.NODE_ENV !== 'production') {
      console.warn('⚠️ DEVELOPMENT MODE: Error initializing Supabase client');
      console.warn('⚠️ DEVELOPMENT MODE: Using mock Supabase client for phone verification');
      console.warn('⚠️ DEVELOPMENT MODE: Use code 123456 for verification');
      
      // Return a mock client for development
      return {
        auth: {
          admin: {
            listUsers: async () => ({ data: { users: [] }, error: null })
          },
          signInWithOtp: async () => ({ data: {}, error: null }),
          verifyOtp: async () => ({
            data: {
              user: {
                id: 'dev-mode-user-id',
                phone: 'dev-mode-phone',
                created_at: new Date().toISOString()
              }
            },
            error: null
          })
        },
        from: () => ({
          select: () => ({
            eq: () => ({
              single: async () => ({ data: null, error: null })
            })
          })
        })
      };
    }
    
    return null;
  }
}

// Initialize Supabase client (will be initialized lazily)
let supabase = null;

// Lazy initialization function
async function getSupabaseClient() {
  if (!supabase) {
    supabase = await initSupabaseClient();
  }
  return supabase;
}

/**
 * Phone verification routes
 * These endpoints handle sending and verifying SMS codes using Supabase
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
      
      // Format phone number with country code for E.164 format required by Supabase
      // Remove all non-digit characters from the phone number
      const cleanPhoneNumber = phoneNumber.replace(/\D/g, '');
      
      // Ensure country code starts with + and has no other non-digit characters
      let cleanCountryCode = countryCode.replace(/\D/g, '');
      if (!cleanCountryCode.startsWith('+')) {
        cleanCountryCode = `+${cleanCountryCode}`;
      }
      
      // Format in E.164 format required by Supabase: +[country code][number] with no spaces or other characters
      const formattedPhoneNumber = `${cleanCountryCode}${cleanPhoneNumber}`;
      
      // DEBUG: Log the phone number formats
      console.log(`[DEBUG] Raw phoneNumber: '${phoneNumber}'`);
      console.log(`[DEBUG] Raw countryCode: '${countryCode}'`);
      console.log(`[DEBUG] Formatted phone: '${formattedPhoneNumber}'`);
      console.log(`[DEBUG] Clean phone: '${cleanCountryCode.substring(1)}${cleanPhoneNumber}'`);
      
      // FIRST: Check database for bypass_otp flag before any SMS logic
      const supabaseClient = await getSupabaseClient();
      if (supabaseClient) {
        try {
          // Get all users and check if this phone has bypass_otp flag
          const { data: users } = await supabaseClient.auth.admin.listUsers();
          const existingUser = users?.users?.find(u => u.phone === formaphoneNumberttedPhoneNumber);
          if (existingUser) {
            // Check if user has bypass_otp flag in profile
            const { data: profile } = await supabaseClient
              .from('profiles')
              .select('bypass_otp')
              .eq('id', existingUser.id)
              .single();
            
            if (profile?.bypass_otp) {
              console.log(`[DB BYPASS] Phone ${phoneNumber} has bypass_otp flag - skipping SMS entirely`);
              return c.json({
                success: true,
                status: 'pending',
                message: 'Test account: SMS bypassed. Use code 123456 to verify.'
              });
            }
          }
        } catch (dbError) {
          console.log('Could not check bypass flag:', dbError.message);
        }
      }
      
      // Test phone numbers that should bypass SMS entirely
      const testPhoneNumbers = [
        '+15551234567', // Alex Johnson
        '+15551234568', // Sarah Chen
        '+15551234569', // Mike Rodriguez
        '+15555555555'  // Original demo number
      ];
      
      // Check if this is a test/demo account - handle multiple formats
      // Use already defined cleanPhoneNumber from above
      const isTestAccount = testPhoneNumbers.includes(formattedPhoneNumber) || 
                           testPhoneNumbers.includes(phoneNumber) ||
                           testPhoneNumbers.includes(`+1${cleanPhoneNumber}`) ||
                           cleanPhoneNumber === '5551234567' ||
                           cleanPhoneNumber === '5551234568' ||
                           cleanPhoneNumber === '5551234569' ||
                           cleanPhoneNumber === '5555555555' ||
                           phoneNumber === '5555555555' || 
                           phoneNumber === '555-555-5555';
      
      console.log(`[DEBUG] Clean phone: '${cleanPhoneNumber}'`);
      console.log(`[DEBUG] Is test account: ${isTestAccount}`);
      
      // For test accounts, skip SMS sending and return success immediately
      if (isTestAccount) {
        console.log(`[TEST ACCOUNT] Bypassing SMS for test account: ${phoneNumber}`);
        return c.json({
          success: true,
          status: 'pending',
          message: 'Test account: SMS bypassed. Use code 123456 to verify.'
        });
      }

      // Initialize Supabase client
      const supabase = await initSupabaseClient();
      if (!supabase) {
        return c.json({ 
          success: false, 
          error: 'Supabase client initialization failed' 
        }, 500);
      }

      // formattedPhoneNumber already declared above
      
      // In development mode, skip actual Supabase call if client initialization failed
      if (supabaseClient) {
        // Add extra logging for phone number debugging
        console.log('=== PHONE NUMBER DEBUG INFORMATION ===');
        console.log(`Original phone: '${phoneNumber}', country code: '${countryCode}'`);
        console.log(`Clean phone digits only: '${cleanPhoneNumber}'`);
        console.log(`Clean country code: '${cleanCountryCode}'`);
        console.log(`E.164 formatted phone for Twilio: '${formattedPhoneNumber}'`);
        console.log('For Twilio: Phone must be in E.164 format: +[country code][phone digits] with no spaces or special characters');
        console.log('===================================');
        
        console.log(`[SUPABASE SMS] Attempting to send OTP to ${formattedPhoneNumber}`);
        
        // Send OTP via Supabase Phone Auth
        const { data, error } = await supabaseClient.auth.signInWithOtp({
          phone: formattedPhoneNumber
        });
        
        if (error) {
          console.error('[SUPABASE SMS] OTP error:', error);
          return c.json({ 
            success: false, 
            error: error.message || 'Failed to send verification code' 
          }, 500);
        }
        
        console.log(`[SUPABASE SMS] OTP successfully sent to ${formattedPhoneNumber}`);
        console.log('[SUPABASE SMS] Response data:', JSON.stringify(data));
      } else {
        // Development mode fallback - simulate successful OTP sending
        console.log(`[DEV MODE] Simulating OTP sent to ${formattedPhoneNumber}`);
        console.log('[DEV MODE] Use code 123456 for verification');
      }
      
      console.log(`Verification sent to ${formattedPhoneNumber}`);
      
      return c.json({
        success: true,
        status: 'pending'
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
          error: 'Phone number, country code, and verification code are required' 
        }, 400);
      }
      
      // Format phone number with country code for E.164 format required by Supabase
      // Remove all non-digit characters from the phone number
      const cleanPhoneNumber = phoneNumber.replace(/\D/g, '');
      
      // Ensure country code starts with + and has no other non-digit characters
      let cleanCountryCode = countryCode.replace(/\D/g, '');
      if (!cleanCountryCode.startsWith('+')) {
        cleanCountryCode = `+${cleanCountryCode}`;
      }
      
      // Format in E.164 format required by Supabase: +[country code][number] with no spaces or other characters
      const formattedPhoneNumber = `${cleanCountryCode}${cleanPhoneNumber}`;
      
      // DEBUG: Log the phone number formats
      console.log(`[DEBUG] Raw phoneNumber: '${phoneNumber}'`);
      console.log(`[DEBUG] Raw countryCode: '${countryCode}'`);
      console.log(`[DEBUG] Formatted phone: '${formattedPhoneNumber}'`);
       
      // Test phone numbers that should bypass OTP verification entirely
      const testPhoneNumbers = [
        '+15551234567', // Alex Johnson
        '+15551234568', // Sarah Chen
        '+15551234569', // Mike Rodriguez
        '+15555555555'  // Original demo number
      ];
      
      // Check if this is a test/demo account
      const isTestAccount = testPhoneNumbers.includes(formattedPhoneNumber) || 
                           phoneNumber === '5555555555' || 
                           phoneNumber === '555-555-5555';
      
      // For test accounts, only accept code 123456 and return success
      if (isTestAccount) {
        console.log(`[TEST ACCOUNT] Verifying code for test account: ${formattedPhoneNumber}`);
        
        // Only accept the bypass code
        if (code !== '123456') {
          console.log(`[TEST ACCOUNT] Invalid code: ${code}, expected 123456`);
          return c.json({ 
            success: false, 
            error: 'Invalid verification code. Use 123456 for test accounts.'
          }, 400);
        }
        
        // Create test user data (try to get real user data from auth)
        let testUserData = {
          id: formattedPhoneNumber.replace(/\D/g, ''), // Use digits as fallback ID
          phone: formattedPhoneNumber,
          created_at: new Date().toISOString()
        };
        
        // Try to get the actual user data from Supabase if available
        try {
          const supabaseClient = await getSupabaseClient();
          if (supabaseClient) {
            const { data: users } = await supabaseClient.auth.admin.listUsers();
            const existingUser = users?.users?.find(u => u.phone === formattedPhoneNumber);
            if (existingUser) {
              testUserData = existingUser;
              console.log(`[TEST ACCOUNT] Found existing user: ${existingUser.id}`);
            }
          }
        } catch (err) {
          console.log(`[TEST ACCOUNT] Could not fetch user data, using fallback`);
        }
        
        return c.json({
          success: true,
          status: 'approved',
          user: testUserData,
          message: 'Test account: Verification approved with bypass code'
        });
      }

      // Initialize Supabase client
      const supabase = await initSupabaseClient();
      if (!supabase) {
        return c.json({ 
          success: false, 
          error: 'Supabase client initialization failed' 
        }, 500);
      }

      // Phone number already formatted above
      
      // Mock user data for development mode
      let userData = null;
      
      // In development mode, skip actual Supabase call if client initialization failed
      const supabaseClient = await getSupabaseClient();
      if (supabaseClient) {
        // Verify OTP via Supabase Phone Auth
        const { data, error } = await supabaseClient.auth.verifyOtp({
          phone: formattedPhoneNumber,
          token: code,
          type: 'sms'
        });
        
        if (error) {
          console.error('Supabase OTP verification error:', error);
          return c.json({ 
            success: false, 
            error: error.message || 'Invalid verification code'
          }, 400);
        }
        
        userData = data.user;
      } else {
        // Development mode fallback - accept code 123456 only
        if (code !== '123456') {
          console.log(`[DEV MODE] Invalid code: ${code}, expected 123456`);
          return c.json({ 
            success: false, 
            error: 'Invalid verification code'
          }, 400);
        }
        
        // Create mock user data
        userData = {
          id: 'dev-mode-user-id',
          phone: formattedPhoneNumber,
          created_at: new Date().toISOString()
        };
        
        console.log(`[DEV MODE] Simulated successful verification for ${formattedPhoneNumber}`);
      }
      
      console.log(`Verification successful for ${formattedPhoneNumber}`);
      
      // Verification was successful
      return c.json({ 
        success: true, 
        status: 'approved',
        user: userData
      });
    } catch (error) {
      console.error('Error checking verification code:', error);
      
      return c.json({
        success: false,
        error: error.message || 'Failed to check verification code'
      }, 500);
    }
  }
};

// Export all routes
export const twilioVerifyRoutes = [
  sendVerificationCodeRoute,
  verifyCodeRoute
];
