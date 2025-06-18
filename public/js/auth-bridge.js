/**
 * Auth Bridge Module
 * 
 * This module imports the auth functions from auth.js and exposes them to the window object
 * for use by standalone HTML pages that don't use ES modules.
 */
import { signInWithPhone, verifyPhoneOtp } from './auth.js';

// Expose the auth functions to the window object
if (typeof window.setAuthFunctions === 'function') {
  window.setAuthFunctions(signInWithPhone, verifyPhoneOtp);
  console.log('Auth functions exposed to window object');
} else {
  console.warn('setAuthFunctions not found on window object');
}