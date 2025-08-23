import { Hono } from 'hono';
import { sendSMS } from '../utils/twilio.js';
import { supabase } from '../utils/supabase.js';
import { createClient } from '@supabase/supabase-js';

const app = new Hono();

/**
 * Generate a 6-digit OTP
 */
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Store OTP in database with expiration (5 minutes)
 */
async function storeOTP(phone, otp) {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    const expiresAt = new Date(Date.now() + (5 * 60 * 1000)); // 5 minutes
    
    // Clean up any existing OTPs for this phone first
    await supabase
      .from('otp_codes')
      .delete()
      .eq('phone_number', phone)
      .eq('verified', false);
    
    const { data, error } = await supabase
      .from('otp_codes')
      .insert({
        phone_number: phone,
        otp_code: otp,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();
    
    if (error) {
      console.error('[OTP STORE] Error storing OTP:', error);
      throw new Error('Failed to store OTP');
    }
    
    console.log('[OTP STORE] OTP stored successfully for:', phone);
    return data;
    
  } catch (error) {
    console.error('[OTP STORE] Error in storeOTP:', error);
    throw error;
  }
}

/**
 * Verify OTP using database function
 */
async function verifyOTP(phone, otp) {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    const { data, error } = await supabase.rpc('verify_otp_code', {
      phone: phone,
      code: otp
    });
    
    if (error) {
      console.error('[OTP VERIFY] Database error:', error);
      return { valid: false, error: 'Verification failed' };
    }
    
    const result = data[0];
    console.log('[OTP VERIFY] Verification result:', result);
    
    return {
      valid: result.success,
      error: result.success ? null : result.message,
      otpId: result.otp_id
    };
    
  } catch (error) {
    console.error('[OTP VERIFY] Error in verifyOTP:', error);
    return { valid: false, error: 'Verification failed' };
  }
}

/**
 * Clean up expired OTPs (called periodically)
 */
async function cleanupExpiredOTPs() {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    const { data, error } = await supabase.rpc('cleanup_expired_otp_codes');
    
    if (error) {
      console.error('[OTP CLEANUP] Error:', error);
    } else {
      console.log(`[OTP CLEANUP] Cleaned up ${data} expired OTP codes`);
    }
    
  } catch (error) {
    console.error('[OTP CLEANUP] Error in cleanupExpiredOTPs:', error);
  }
}

/**
 * Send OTP via Twilio (for both login and signup)
 */
app.post('/send-otp', async (c) => {
  try {
    const { phone, isSignup } = await c.req.json();
    
    if (!phone) {
      return c.json({ success: false, error: 'Phone number is required' }, 400);
    }
    
    // Normalize phone number
    const normalizedPhone = phone.startsWith('+') ? phone : `+1${phone.replace(/\D/g, '')}`;
    
    console.log(`[DIRECT TWILIO] ${isSignup ? 'Signup' : 'Login'} request for:`, normalizedPhone);
    console.log('[DEBUG] Normalized phone format:', normalizedPhone);
    
    // For login, check if user exists (except for demo accounts)
    if (!isSignup && normalizedPhone !== '+15555555555') {
      const { data: existingUsers, error: searchError } = await supabase
        .from('profiles')
        .select('id')
        .eq('phone', normalizedPhone)
        .limit(1);
      
      if (searchError) {
        console.error('[SUPABASE] Error checking user existence:', searchError);
        return c.json({ success: false, error: 'Database error' }, 500);
      }
      
      if (!existingUsers || existingUsers.length === 0) {
        console.log('[DIRECT TWILIO] No account found for login:', normalizedPhone);
        return c.json({ 
          success: false, 
          error: 'No account found with this phone number. Please sign up first.' 
        }, 404);
      }
      
      console.log('[DIRECT TWILIO] Account found, sending login OTP to:', normalizedPhone);
    } else if (isSignup) {
      // For signup, check if user already exists
      const { data: existingUsers, error: searchError } = await supabase
        .from('profiles')
        .select('id')
        .eq('phone', normalizedPhone)
        .limit(1);
      
      if (searchError) {
        console.error('[SUPABASE] Error checking user existence:', searchError);
        return c.json({ success: false, error: 'Database error' }, 500);
      }
      
      if (existingUsers && existingUsers.length > 0) {
        console.log('[DIRECT TWILIO] Account already exists for signup:', normalizedPhone);
        return c.json({ 
          success: false, 
          error: 'Account already exists with this phone number. Please login instead.' 
        }, 409);
      }
      
      console.log('[DIRECT TWILIO] New signup, sending OTP to:', normalizedPhone);
    }
    
    // Check for demo accounts
    if (normalizedPhone === '+15555555555') {
      console.log('[DEMO] Demo account detected');
      await storeOTP(normalizedPhone, '123456'); // Fixed demo OTP
      return c.json({
        success: true,
        message: 'Demo OTP sent (use 123456)',
        isDemo: true
      });
    }
    
    // Generate and store OTP
    const otp = generateOTP();
    // Store OTP in database
    await storeOTP(phone, otp);
    
    // Send SMS via Twilio
    const smsBody = `Your BarCrush verification code is: ${otp}. Valid for 5 minutes.`;
    
    await sendSMS({
      to: normalizedPhone,
      body: smsBody
    });
    
    console.log('[DIRECT TWILIO] OTP sent successfully to:', normalizedPhone);
    
    return c.json({
      success: true,
      message: 'Verification code sent successfully'
    });
    
  } catch (error) {
    console.error('[DIRECT TWILIO] Error sending OTP:', error);
    return c.json({
      success: false,
      error: error.message || 'Failed to send verification code'
    }, 500);
  }
});

/**
 * Verify OTP and create/login user
 */
app.post('/verify-otp', async (c) => {
  try {
    const { phone, otp, isSignup } = await c.req.json();
    
    if (!phone || !otp) {
      return c.json({ success: false, error: 'Phone number and OTP are required' }, 400);
    }
    
    // Normalize phone number
    const normalizedPhone = phone.startsWith('+') ? phone : `+1${phone.replace(/\D/g, '')}`;
    
    console.log(`[DIRECT TWILIO] Verifying OTP for ${isSignup ? 'SIGNUP' : 'LOGIN'}:`, normalizedPhone);
    
    // Verify OTP
    const verification = await verifyOTP(normalizedPhone, otp);
    if (!verification.valid) {
      return c.json({
        success: false,
        error: verification.error
      }, 400);
    }
    
    console.log('[DIRECT TWILIO] OTP verified successfully');
    
    // Check if user exists in Supabase
    let user;
    const { data: existingUsers, error: searchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('phone', normalizedPhone)
      .limit(1);
    
    if (searchError) {
      console.error('[SUPABASE] Error searching for user:', searchError);
    }
    
    if (existingUsers && existingUsers.length > 0) {
      if (isSignup) {
        console.log('[DIRECT TWILIO] ERROR: User already exists during SIGNUP:', existingUsers[0].id);
        return c.json({
          success: false,
          error: 'Account already exists with this phone number. Please login instead.'
        }, 409);
      }
      
      // Existing user - login
      user = existingUsers[0];
      console.log('[DIRECT TWILIO] Existing user found for LOGIN:', user.id);
    } else {
      // For login flow, user should exist - this shouldn't happen
      if (!isSignup) {
        console.error('[DIRECT TWILIO] User not found during login verification');
        return c.json({
          success: false,
          error: 'Account not found. Please sign up first.'
        }, 404);
      }
      
      // Create new user for signup
      console.log('[SUPABASE] Creating new user profile for SIGNUP');
      const { data: newUser, error: createError } = await supabase
        .from('profiles')
        .insert({
          phone: normalizedPhone,
          display_name: `User ${normalizedPhone.slice(-4)}`, // Default name with last 4 digits  
          full_name: `User ${normalizedPhone.slice(-4)}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (createError) {
        console.error('[SUPABASE] Error creating user:', createError);
        return c.json({
          success: false,
          error: 'Failed to create user account'
        }, 500);
      }
      
      user = newUser;
      console.log('[DIRECT TWILIO] New user created for SIGNUP:', user.id);
      console.log('[DEBUG] Created profile data:', JSON.stringify(user, null, 2));
    }
    
    // Create a proper Supabase auth user and session
    try {
      // First, create or sign in the user in Supabase Auth
      let authUser;
      const tempPassword = Math.random().toString(36).slice(2, 15);
      
      // Try to create user in Supabase Auth
      const { data: createData, error: createError } = await supabase.auth.admin.createUser({
        phone: normalizedPhone,
        password: tempPassword,
        phone_confirm: true,
        user_metadata: {
          full_name: user.full_name || `User ${normalizedPhone.slice(-4)}`,
          phone_verified: true,
          signup_method: 'direct_twilio'
        }
      });
      
      if (createError && !createError.message.includes('already registered')) {
        console.error('[SUPABASE AUTH] Error creating auth user:', createError);
        // Fall back to JWT token if Supabase auth fails
        const sessionToken = Buffer.from(JSON.stringify({
          userId: user.id,
          phone: normalizedPhone,
          issuedAt: Date.now(),
          expiresAt: Date.now() + (24 * 60 * 60 * 1000)
        })).toString('base64');
        
        return c.json({
          success: true,
          message: 'Authentication successful (fallback)',
          user: {
            id: user.id,
            phone: normalizedPhone,
            name: user.full_name || 'User',
            email: user.email || null
          },
          session: {
            token: sessionToken,
            expiresAt: Date.now() + (24 * 60 * 60 * 1000)
          }
        });
      }
      
      // Update the profile ID to match the auth user ID
      if (createData?.user && user.id !== createData.user.id) {
        await supabase
          .from('profiles')
          .update({ id: createData.user.id })
          .eq('id', user.id);
        
        user.id = createData.user.id;
      }
      
      // Generate JWT token as primary authentication method
      const sessionToken = Buffer.from(JSON.stringify({
        userId: user.id,
        phone: normalizedPhone,
        issuedAt: Date.now(),
        expiresAt: Date.now() + (24 * 60 * 60 * 1000)
      })).toString('base64');
      
      console.log('[JWT AUTH] JWT token generated successfully');
      
      // Create a Supabase session as backup but don't rely on it
      try {
        const { data: sessionData } = await supabase.auth.admin.createSession({
          user_id: createData.user.id
        });
        
        console.log('[SUPABASE AUTH] Session created as backup');
        
        return c.json({
          success: true,
          message: 'Authentication successful',
          user: {
            id: user.id,
            phone: normalizedPhone,
            name: user.full_name || 'User',
            email: user.email || null
          },
          session: {
            token: sessionToken,
            expiresAt: Date.now() + (24 * 60 * 60 * 1000)
          },
          supabaseSession: sessionData // Include as backup
        });
      } catch (sessionError) {
        console.log('[SUPABASE AUTH] Failed to create backup session, using JWT only');
        
        return c.json({
          success: true,
          message: 'Authentication successful (JWT only)',
          user: {
            id: user.id,
            phone: normalizedPhone,
            name: user.full_name || 'User',
            email: user.email || null
          },
          session: {
            token: sessionToken,
            expiresAt: Date.now() + (24 * 60 * 60 * 1000)
          }
        });
      }
      
    } catch (authError) {
      console.error('[SUPABASE AUTH] Auth creation failed:', authError);
      
      // Use JWT token as primary authentication method
      const sessionToken = Buffer.from(JSON.stringify({
        userId: user.id,
        phone: normalizedPhone,
        issuedAt: Date.now(),
        expiresAt: Date.now() + (24 * 60 * 60 * 1000)
      })).toString('base64');
      
      return c.json({
        success: true,
        message: 'Authentication successful (JWT only)',
        user: {
          id: user.id,
          phone: normalizedPhone,
          name: user.full_name || 'User',
          email: user.email || null
        },
        session: {
          token: sessionToken,
          expiresAt: Date.now() + (24 * 60 * 60 * 1000)
        }
      });
    }
    
  } catch (error) {
    console.error('[DIRECT TWILIO] Error verifying OTP:', error);
    return c.json({
      success: false,
      error: error.message || 'Verification failed'
    }, 500);
  }
});

/**
 * Validate session token
 */
app.post('/validate-session', async (c) => {
  try {
    const { token } = await c.req.json();
    
    if (!token) {
      return c.json({ valid: false, error: 'Token is required' }, 400);
    }
    
    // Decode and validate token
    const sessionData = JSON.parse(Buffer.from(token, 'base64').toString());
    
    if (Date.now() > sessionData.expiresAt) {
      return c.json({ valid: false, error: 'Session expired' }, 401);
    }
    
    // Get user data
    const { data: user, error } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', sessionData.userId)
      .single();
    
    if (error || !user) {
      return c.json({ valid: false, error: 'User not found' }, 404);
    }
    
    return c.json({
      valid: true,
      user: {
        id: user.id,
        phone: user.phone_number,
        name: user.full_name || 'User',
        email: user.email || null
      }
    });
    
  } catch (error) {
    console.error('[DIRECT TWILIO] Error validating session:', error);
    return c.json({ valid: false, error: 'Invalid token' }, 401);
  }
});

// Start periodic cleanup of expired OTPs (every 10 minutes)
setInterval(cleanupExpiredOTPs, 10 * 60 * 1000);

export default app;
