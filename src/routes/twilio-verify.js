import dotenv from 'dotenv-flow';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

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
      
      // Check if this is a demo account (e.g., +15555555555)
      const isDemoAccount = phoneNumber === '5555555555' || phoneNumber === '555-555-5555';
      
      // For demo accounts, skip verification and return success immediately
      if (isDemoAccount) {
        console.log(`[DEMO ACCOUNT] Bypassing OTP for demo account: ${countryCode}${phoneNumber}`);
        return c.json({
          success: true,
          status: 'approved',
          demo: true,
          message: 'Demo account: OTP verification bypassed'
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

      // Format phone number with country code
      const formattedPhoneNumber = `${countryCode}${phoneNumber}`;
      
      // In development mode, skip actual Supabase call if client initialization failed
      if (supabase) {
        console.log(`[SUPABASE SMS] Attempting to send OTP to ${formattedPhoneNumber}`);
        
        // Send OTP via Supabase Phone Auth
        const { data, error } = await supabase.auth.signInWithOtp({
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
      
      // Check if this is a demo account (e.g., +15555555555)
      const isDemoAccount = phoneNumber === '5555555555' || phoneNumber === '555-555-5555';
      
      // For demo accounts, accept any code and return success
      if (isDemoAccount) {
        console.log(`[DEMO ACCOUNT] Auto-approving verification for demo account: ${countryCode}${phoneNumber}`);
        
        // Create demo user data
        const demoUserData = {
          id: 'demo-user-id',
          phone: `${countryCode}${phoneNumber}`,
          created_at: new Date().toISOString(),
          demo: true
        };
        
        return c.json({
          success: true,
          status: 'approved',
          demo: true,
          user: demoUserData,
          message: 'Demo account: Verification auto-approved'
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

      // Format phone number with country code
      const formattedPhoneNumber = `${countryCode}${phoneNumber}`;
      
      // Mock user data for development mode
      let userData = null;
      
      // In development mode, skip actual Supabase call if client initialization failed
      if (supabase) {
        // Verify OTP via Supabase Phone Auth
        const { data, error } = await supabase.auth.verifyOtp({
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
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      if (isDev) {
        console.warn('⚠️ DEVELOPMENT MODE: Missing Supabase environment variables');
        console.warn('⚠️ DEVELOPMENT MODE: Using mock Supabase client for phone verification');
        console.warn('⚠️ DEVELOPMENT MODE: Use code 123456 for verification');
        
        // Return a mock client for development
        return {
          auth: {
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
          }
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
        }
      };
    }
    
    return null;
  }
}

// Export all routes
export const twilioVerifyRoutes = [
  sendVerificationCodeRoute,
  verifyCodeRoute
];
