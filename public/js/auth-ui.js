// Authentication UI logic
import { signInWithPhone, signInWithGoogle, getCurrentUser, logout, verifyPhoneOtp } from './auth.js';
import { supabaseClientPromise } from './supabase-client.js';

document.addEventListener('DOMContentLoaded', () => {
  initAuthUI();
});

async function initAuthUI() {
  // Initialize tab switching
  const tabBtns = document.querySelectorAll('.tab-btn');
  const authForms = document.querySelectorAll('.auth-form');
  
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabName = btn.getAttribute('data-tab');
      
      // Update active tab button
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Show selected form
      authForms.forEach(form => {
        if (form.id === `${tabName}-form`) {
          form.classList.add('active');
        } else {
          form.classList.remove('active');
        }
      });
    });
  });
  
  // Initialize login form
  const loginBtn = document.getElementById('login-btn');
  if (loginBtn) {
    loginBtn.addEventListener('click', handleEmailLogin);
  }
  
  // Initialize signup form
  const signupBtn = document.getElementById('signup-btn');
  if (signupBtn) {
    signupBtn.addEventListener('click', handleEmailSignup);
  }
  
  // Initialize phone login
  const phoneLoginBtn = document.getElementById('phone-login-btn');
  if (phoneLoginBtn) {
    phoneLoginBtn.addEventListener('click', () => {
      window.location.href = '/phone-login';
    });
  }
  
  // Initialize Google login
  const googleLoginBtn = document.getElementById('google-login-btn');
  if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', handleGoogleLogin);
  }
  
  // Initialize Google signup
  const googleSignupBtn = document.getElementById('google-signup-btn');
  if (googleSignupBtn) {
    googleSignupBtn.addEventListener('click', handleGoogleLogin);
  }
  
  // Initialize forgot password
  const forgotPasswordLink = document.getElementById('forgot-password-link');
  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', handleForgotPassword);
  }
  
  // Check if user is already logged in
  try {
    const user = await getCurrentUser();
    if (user) {
      // Redirect to discover page if already logged in
      window.location.href = '/discover';
    }
  } catch (error) {
    console.log('No active session');
  }
}

async function handleEmailLogin(e) {
  e.preventDefault();
  
  const emailInput = document.getElementById('login-email');
  const passwordInput = document.getElementById('login-password');
  const statusMessage = document.getElementById('auth-status-message');
  
  if (!emailInput || !passwordInput) return;
  
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  
  if (!email || !password) {
    showStatusMessage('Please enter both email and password', 'error');
    return;
  }
  
  try {
    const supabase = await supabaseClientPromise;
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    
    // Login successful
    showStatusMessage('Login successful! Redirecting...', 'success');
    
    // Redirect to discover page after successful login
    setTimeout(() => {
      window.location.href = '/discover';
    }, 1000);
    
  } catch (error) {
    console.error('Login error:', error);
    showStatusMessage(`Login failed: ${error.message}`, 'error');
  }
}

async function handleEmailSignup(e) {
  e.preventDefault();
  
  const nameInput = document.getElementById('signup-name');
  const emailInput = document.getElementById('signup-email');
  const passwordInput = document.getElementById('signup-password');
  const confirmPasswordInput = document.getElementById('signup-confirm-password');
  
  if (!nameInput || !emailInput || !passwordInput || !confirmPasswordInput) return;
  
  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const confirmPassword = confirmPasswordInput.value;
  
  if (!name || !email || !password || !confirmPassword) {
    showStatusMessage('Please fill in all fields', 'error');
    return;
  }
  
  if (password !== confirmPassword) {
    showStatusMessage('Passwords do not match', 'error');
    return;
  }
  
  try {
    const supabase = await supabaseClientPromise;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name
        }
      }
    });
    
    if (error) throw error;
    
    // Store profile data in localStorage for later use
    const profileData = {
      full_name: name,
      display_name: name.split(' ')[0],
      email: email,
      created_at: new Date().toISOString()
    };
    
    localStorage.setItem('userProfile', JSON.stringify(profileData));
    
    // Check if email confirmation is required
    if (data.user && data.session) {
      // Auto sign-in (email confirmation not required)
      showStatusMessage('Account created successfully! Redirecting...', 'success');
      
      // Redirect to discover page
      setTimeout(() => {
        window.location.href = '/discover';
      }, 1500);
    } else {
      // Email confirmation required
      showStatusMessage('Please check your email to confirm your account', 'success');
    }
    
  } catch (error) {
    console.error('Signup error:', error);
    showStatusMessage(`Signup failed: ${error.message}`, 'error');
  }
}

async function handleGoogleLogin(e) {
  e.preventDefault();
  
  try {
    await signInWithGoogle();
  } catch (error) {
    console.error('Google login error:', error);
    showStatusMessage(`Google login failed: ${error.message}`, 'error');
  }
}

async function handleForgotPassword(e) {
  e.preventDefault();
  
  const email = prompt('Please enter your email address:');
  
  if (!email) return;
  
  try {
    const supabase = await supabaseClientPromise;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    
    if (error) throw error;
    
    showStatusMessage('Password reset email sent. Please check your inbox.', 'success');
  } catch (error) {
    console.error('Password reset error:', error);
    showStatusMessage(`Password reset failed: ${error.message}`, 'error');
  }
}

function showStatusMessage(message, type = 'info') {
  const statusElement = document.getElementById('auth-status-message');
  if (!statusElement) return;
  
  statusElement.textContent = message;
  statusElement.className = `status-message ${type}`;
  statusElement.style.display = 'block';
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    statusElement.style.display = 'none';
  }, 5000);
}

// Export functions for use in other scripts
window.authUI = {
  initAuthUI,
  handleEmailLogin,
  handleEmailSignup,
  handleGoogleLogin,
  showStatusMessage
};

// Export functions for use in other scripts
window.authUI = {
  updateNavbar,
  logout
};