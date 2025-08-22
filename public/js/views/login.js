/**
 * Toggle password visibility
 */
function togglePasswordVisibility() {
  const passwordInput = document.getElementById('password');
  const toggleIcon = document.getElementById('password-toggle-icon');
  
  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    toggleIcon.classList.remove('fa-eye');
    toggleIcon.classList.add('fa-eye-slash');
  } else {
    passwordInput.type = 'password';
    toggleIcon.classList.remove('fa-eye-slash');
    toggleIcon.classList.add('fa-eye');
  }
}

/**
 * Show login alert message
 * @param {string} message - The message to display
 * @param {string} type - The type of alert (error, success, warning)
 */
function showLoginAlert(message, type = 'error') {
  const alertElement = document.getElementById('login-alert');
  if (alertElement) {
    alertElement.textContent = message;
    alertElement.className = `alert alert-${type}`;
    alertElement.classList.remove('hidden');
    
    // Auto-dismiss success messages after 5 seconds
    if (type === 'success') {
      setTimeout(() => {
        alertElement.classList.add('hidden');
      }, 5000);
    }
  } else {
    // Fallback to alert if element not found
    alert(message);
  }
}

/**
 * Handle login form submission
 * @param {Event} e - Form submit event
 */
async function handleLogin(e) {
  e.preventDefault();
  
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const submitButton = document.querySelector('.login-button');
  
  if (!email || !password) {
    showLoginAlert('Please enter both email and password', 'error');
    return;
  }
  
  // Show loading state
  const originalText = submitButton.textContent;
  submitButton.textContent = 'Logging in...';
  submitButton.disabled = true;
  
  try {
    // Import Supabase client
    const { getCurrentUser } = await import('../supabase-client.js');
    
    // Attempt to sign in
    const { data, error } = await getCurrentUser().auth.signInWithPassword({
      email: email,
      password: password
    });
    
    if (error) {
      console.error('Login error:', error);
      showLoginAlert(error.message || 'Login failed. Please check your credentials.', 'error');
      return;
    }
    
    if (data.user) {
      console.log('✅ Login successful:', data.user.email);
      showLoginAlert('Login successful! Redirecting...', 'success');
      
      // Store user session info
      localStorage.setItem('barcrush_user_id', data.user.id);
      localStorage.setItem('barcrush_user_email', data.user.email);
      
      // Set as paid for testing purposes
      localStorage.setItem('barcrush_paid', 'true');
      localStorage.setItem('barcrush_payment_date', new Date().toISOString());
      
      // Redirect to matching page after short delay
      setTimeout(() => {
        if (window.router) {
          window.router.navigate('/matching');
        } else {
          window.location.href = '/matching';
        }
      }, 1000);
    }
    
  } catch (error) {
    console.error('Login error:', error);
    showLoginAlert('An error occurred during login. Please try again.', 'error');
  } finally {
    // Reset button state
    submitButton.textContent = originalText;
    submitButton.disabled = false;
  }
}

/**
 * Initialize event listeners
 */
function initLoginEventListeners() {
  // Add event listener for password toggle
  const passwordToggle = document.getElementById('password-toggle');
  if (passwordToggle) {
    passwordToggle.addEventListener('click', togglePasswordVisibility);
  }
  
  // Add event listener for form submission
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', initLoginEventListeners);

// Also initialize on spa-transition-end event for SPA router
document.addEventListener('spa-transition-end', initLoginEventListeners);

// Make functions globally accessible for other scripts
window.showLoginAlert = showLoginAlert;
window.handleLogin = handleLogin;
