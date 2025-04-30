console.log('Reset password confirm script loaded');

/**
 * Function to show status message
 * @param {string} message - The message to display
 * @param {string} type - The type of message (success or error)
 */
function showStatusMessage(message, type) {
  const statusElement = document.getElementById('status-message');
  if (!statusElement) return;
  
  statusElement.textContent = message;
  statusElement.className = 'status-message ' + type;
  statusElement.style.display = 'block';
  
  // Scroll to the message
  statusElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/**
 * Initialize the reset password confirmation form
 */
function initResetPasswordConfirmForm() {
  console.log('Initializing reset password confirm form');
  const form = document.getElementById('reset-password-form');
  if (!form) {
    console.error('Reset password confirm form not found');
    return;
  }
  
  console.log('Adding submit event listener to form');
  form.addEventListener('submit', async (e) => {
    console.log('Form submit event triggered');
    e.preventDefault();
    
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    if (password !== confirmPassword) {
      const errorMessage = window.i18n ? window.i18n.t('errors.passwords_not_match') : 'Passwords do not match';
      showStatusMessage(errorMessage, 'error');
      return;
    }
    
    // Show loading state
    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    submitButton.textContent = window.i18n ? window.i18n.t('auth.resetting') : 'Resetting...';
    submitButton.disabled = true;
    
    try {
      // Get the reset token from the URL
      const urlParams = new URLSearchParams(window.location.search);
      const resetToken = urlParams.get('token');
      
      if (!resetToken) {
        const errorMessage = window.i18n ? window.i18n.t('errors.invalid_reset_token_request_new') : 'Invalid or expired password reset token. Please request a new password reset link.';
        throw new Error(errorMessage);
      }
      
      console.log('Sending password reset confirmation to server');
      // Send password reset confirmation to the server API
      const response = await fetch('/api/1/auth/reset-password-confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: resetToken,
          password: password
        })
      });
      
      console.log('Server response status:', response.status);
      const responseData = await response.json();
      console.log('Server response data:', responseData);
      
      if (!response.ok) {
        throw new Error(responseData.error || response.statusText);
      }
      
      // Show success message
      const successMessage = window.i18n ? window.i18n.t('auth.password_reset_success') : 'Password reset successfully! Please log in with your new password.';
      showStatusMessage(successMessage, 'success');
      
      // Redirect to login page after a delay
      setTimeout(() => {
        window.router.navigate('/login');
      }, 3000);
    } catch (error) {
      console.error('Password reset error:', error);
      
      // Show error message
      let errorMessage = window.i18n ? window.i18n.t('errors.password_reset_failed') : 'Password reset failed';
      errorMessage += ': ' + (error.message || (window.i18n ? window.i18n.t('errors.unknown_error') : 'An unknown error occurred'));
      
      showStatusMessage(errorMessage, 'error');
      
      // Reset button state
      submitButton.textContent = originalButtonText;
      submitButton.disabled = false;
    }
  });
}

// Initialize immediately
initResetPasswordConfirmForm();

// Also initialize on DOMContentLoaded for safety
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOMContentLoaded event fired');
  initResetPasswordConfirmForm();
});

// Also initialize on spa-transition-end event for SPA router
document.addEventListener('spa-transition-end', () => {
  console.log('spa-transition-end event fired');
  initResetPasswordConfirmForm();
});