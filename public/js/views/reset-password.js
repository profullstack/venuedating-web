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
 * Handle form submission
 * @param {Event} e - The form submission event
 */
async function handleFormSubmit(e) {
  e.preventDefault();
  
  const email = document.getElementById('email').value;
  if (!email) {
    showStatusMessage('Please enter your email address', 'error');
    return;
  }
  
  // Show loading state
  const submitButton = e.target.querySelector('button[type="submit"]');
  const originalButtonText = submitButton.textContent;
  submitButton.textContent = window.i18n ? window.i18n.t('auth.sending') : 'Sending...';
  submitButton.disabled = true;
  
  try {
    // Send password reset request to the server API
    const response = await fetch('/api/1/auth/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    });
    
    const responseData = await response.json();
    
    if (!response.ok) {
      throw new Error(responseData.error || response.statusText);
    }
    
    // Show success message
    const successMessage = window.i18n ? window.i18n.t('auth.reset_email_sent') : 'Password reset link has been sent to your email. Please check your inbox.';
    showStatusMessage(successMessage, 'success');
    
    // Clear the form
    e.target.reset();
  } catch (error) {
    console.error('Password reset email error:', error);
    
    // Show error message
    let errorMessage = window.i18n ? window.i18n.t('errors.reset_email_failed') : 'Failed to send password reset email';
    
    // Check if the error is about email not found
    if (error.message && (error.message.includes('not found') || error.message.includes('not exist'))) {
      errorMessage = window.i18n ? window.i18n.t('errors.email_not_found') : 'Email address not found. Please check your email and try again.';
    } else {
      errorMessage += ': ' + (error.message || (window.i18n ? window.i18n.t('errors.unknown_error') : 'An unknown error occurred'));
    }
    
    showStatusMessage(errorMessage, 'error');
  } finally {
    // Reset button state
    submitButton.textContent = originalButtonText;
    submitButton.disabled = false;
  }
}

/**
 * Initialize the form
 */
function initializeForm() {
  const form = document.getElementById('reset-password-form');
  if (!form) return;
  
  // Remove existing event listeners by cloning the form
  const newForm = form.cloneNode(true);
  form.parentNode.replaceChild(newForm, form);
  
  // Add event listener to the new form
  newForm.addEventListener('submit', handleFormSubmit);
}

// Initialize form on DOMContentLoaded
document.addEventListener('DOMContentLoaded', initializeForm);

// Also initialize on spa-transition-end event for SPA router
document.addEventListener('spa-transition-end', initializeForm);