/**
 * Phone number validation and utility functions
 */

/**
 * Validate a phone number using E.164 format rules
 * @param {string} phoneNumber - The phone number to validate (with country code)
 * @returns {boolean} - Whether the phone number is valid
 */
export function validatePhoneE164(phoneNumber) {
  if (!phoneNumber) return false;
  
  // E.164 format: + followed by country code and number
  // Basic regex for E.164 format: +[country code][number]
  // Country codes are 1-3 digits, numbers are typically 7-15 digits
  const e164Regex = /^\+[1-9]\d{0,2}[1-9]\d{6,14}$/;
  
  return e164Regex.test(phoneNumber);
}

/**
 * Format a phone number to E.164 format
 * @param {string} countryCode - The country code (e.g., +1, +44)
 * @param {string} phoneNumber - The phone number without country code
 * @returns {string} - The formatted phone number in E.164 format
 */
export function formatPhoneE164(countryCode, phoneNumber) {
  // Remove any non-digit characters
  const cleanCountryCode = countryCode.replace(/\D/g, '');
  const cleanPhoneNumber = phoneNumber.replace(/\D/g, '');
  
  // Ensure country code starts with +
  const formattedCountryCode = countryCode.startsWith('+') 
    ? countryCode 
    : `+${cleanCountryCode}`;
  
  return `${formattedCountryCode}${cleanPhoneNumber}`;
}

/**
 * Check if a phone number exists in the system
 * @param {string} phoneNumber - The phone number to check (in E.164 format)
 * @returns {Promise<Object>} - Response with exists flag and message
 */
export async function checkPhoneExists(phoneNumber) {
  try {
    const response = await fetch('/api/1/auth/check-phone-exists', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ phone: phoneNumber })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to check phone existence');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error checking phone existence:', error);
    throw error;
  }
}
