/**
 * Form Validation Utilities
 * 
 * This module provides functions for validating form inputs
 * with real-time feedback to users.
 */

// Validation configuration object
export const validationConfig = {
  // Minimum age required for the app
  minimumAge: 18,
  
  // Maximum character length for name fields
  nameMaxLength: 50,
  
  // Minimum character length for name fields
  nameMinLength: 2,
  
  // Username validation pattern
  usernamePattern: /^[a-zA-Z0-9_.-]{3,30}$/,
  
  // Email pattern for validation
  emailPattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  
  // Phone validation pattern (basic)
  phonePattern: /^\d{7,15}$/,
  
  // Bio character limits
  bioMaxLength: 500
};

/**
 * Validates if input value is not empty
 * @param {string} value - Input value to check
 * @returns {boolean} True if valid
 */
export function isNotEmpty(value) {
  return value !== null && value !== undefined && value.trim() !== '';
}

/**
 * Validates if input length is within specified range
 * @param {string} value - Input value to check
 * @param {number} minLength - Minimum length
 * @param {number} maxLength - Maximum length
 * @returns {boolean} True if valid
 */
export function isValidLength(value, minLength, maxLength) {
  if (!isNotEmpty(value)) return false;
  const length = value.trim().length;
  return length >= minLength && length <= maxLength;
}

/**
 * Validates if input is a valid email format
 * @param {string} value - Email to validate
 * @returns {boolean} True if valid
 */
export function isValidEmail(value) {
  if (!isNotEmpty(value)) return false;
  return validationConfig.emailPattern.test(value);
}

/**
 * Validates if input is a valid phone format
 * Note: This is basic validation, country-specific rules may vary
 * @param {string} value - Phone to validate (digits only)
 * @returns {boolean} True if valid
 */
export function isValidPhone(value) {
  if (!isNotEmpty(value)) return false;
  // Remove any non-digit characters for validation
  const digitsOnly = value.replace(/\D/g, '');
  return validationConfig.phonePattern.test(digitsOnly);
}

/**
 * Validates if input is a valid username format
 * @param {string} value - Username to validate
 * @returns {boolean} True if valid
 */
export function isValidUsername(value) {
  if (!isNotEmpty(value)) return false;
  return validationConfig.usernamePattern.test(value);
}

/**
 * Calculates age from birthdate
 * @param {Date} birthdate - Birthdate to calculate age from
 * @returns {number} Age in years
 */
export function calculateAge(birthdate) {
  const today = new Date();
  let age = today.getFullYear() - birthdate.getFullYear();
  const monthDiff = today.getMonth() - birthdate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthdate.getDate())) {
    age--;
  }
  
  return age;
}

/**
 * Validates if birthdate makes user old enough
 * @param {Date} birthdate - Birthdate to validate
 * @returns {boolean} True if valid
 */
export function isValidAge(birthdate) {
  if (!birthdate) return false;
  return calculateAge(birthdate) >= validationConfig.minimumAge;
}

/**
 * Show validation feedback on an input element
 * @param {HTMLElement} inputElement - The input element
 * @param {boolean} isValid - Whether the input is valid
 * @param {string} errorMessage - Error message to display if invalid
 */
export function showValidationFeedback(inputElement, isValid, errorMessage = '') {
  if (!inputElement) return;
  
  // Find or create feedback element
  let feedbackElement = inputElement.parentElement.querySelector('.validation-feedback');
  if (!feedbackElement) {
    feedbackElement = document.createElement('div');
    feedbackElement.className = 'validation-feedback';
    inputElement.parentElement.appendChild(feedbackElement);
  }
  
  // Update input styling
  if (isValid) {
    inputElement.classList.remove('invalid');
    inputElement.classList.add('valid');
    feedbackElement.textContent = '';
    feedbackElement.style.display = 'none';
  } else {
    inputElement.classList.remove('valid');
    inputElement.classList.add('invalid');
    feedbackElement.textContent = errorMessage;
    feedbackElement.style.display = 'block';
  }
}
