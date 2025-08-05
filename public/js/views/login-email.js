/**
 * Login Email Page Controller
 * Handles email/password authentication for BarCrush
 */

import { supabaseClientPromise } from '../supabase-client.js';

// Initialize the login page
export function initLoginEmailPage() {
    console.log('Initializing login-email page');
    
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const passwordToggle = document.getElementById('password-toggle');
    const loginButton = document.getElementById('login-btn');
    const statusMessage = document.getElementById('status-message');

    // Password visibility toggle
    if (passwordToggle) {
        passwordToggle.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            // Update the eye icon
            const eyeIcon = passwordToggle.querySelector('svg');
            if (type === 'text') {
                // Show "eye-off" icon when password is visible
                eyeIcon.innerHTML = `
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="#666" stroke-width="2" fill="none"/>
                    <line x1="1" y1="1" x2="23" y2="23" stroke="#666" stroke-width="2"/>
                `;
            } else {
                // Show "eye" icon when password is hidden
                eyeIcon.innerHTML = `
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="#666" stroke-width="2" fill="none"/>
                    <circle cx="12" cy="12" r="3" stroke="#666" stroke-width="2" fill="none"/>
                `;
            }
        });
    }

    // Form submission handler - attach to button click since there's no form element
    if (loginButton) {
        loginButton.addEventListener('click', async (e) => {
            e.preventDefault();
            
            const email = emailInput.value.trim();
            const password = passwordInput.value;

            // Validate inputs
            if (!email || !password) {
                showStatus('Please fill in all fields', true);
                return;
            }

            // Show loading state
            setLoadingState(true);

            try {
                console.log('Attempting to sign in with email:', email);
                
                // Get Supabase client from promise
                const supabase = await supabaseClientPromise;
                
                // Sign in with Supabase
                const { data, error } = await supabase.auth.signInWithPassword({
                    email: email,
                    password: password
                });

                if (error) {
                    console.error('Login error:', error);
                    throw error;
                }

                console.log('Login successful:', data);
                
                // Show success message
                showStatus('Login successful! Redirecting...', false);

                // Store user session info if needed
                if (data.session) {
                    localStorage.setItem('supabase.auth.token', JSON.stringify(data.session));
                }

                // Redirect to matching page after successful login
                setTimeout(() => {
                    window.location.href = '/matching';
                }, 1500);

            } catch (error) {
                console.error('Login failed:', error);
                
                let errorMessage = 'Login failed. Please try again.';
                
                // Handle specific error cases
                if (error.message.includes('Invalid login credentials')) {
                    errorMessage = 'Invalid email or password. Please check your credentials.';
                } else if (error.message.includes('Email not confirmed')) {
                    errorMessage = 'Please check your email and confirm your account before logging in.';
                } else if (error.message.includes('Too many requests')) {
                    errorMessage = 'Too many login attempts. Please wait a moment and try again.';
                } else if (error.message) {
                    errorMessage = error.message;
                }
                
                showStatus(errorMessage, true);
            } finally {
                setLoadingState(false);
            }
        });
    }

    // Helper function to show status messages
    function showStatus(message, isError = false) {
        if (!statusMessage) return;
        
        statusMessage.textContent = message;
        statusMessage.className = `status-message ${isError ? 'error' : 'success'}`;
        statusMessage.style.display = 'block';
        
        // Auto-hide success messages
        if (!isError) {
            setTimeout(() => {
                statusMessage.style.display = 'none';
            }, 3000);
        }
    }

    // Helper function to set loading state
    function setLoadingState(loading) {
        if (!loginButton) return;
        
        if (loading) {
            loginButton.disabled = true;
            loginButton.textContent = 'Signing In...';
        } else {
            loginButton.disabled = false;
            loginButton.textContent = 'Sign In';
        }
    }

    // Auto-focus email input
    if (emailInput) {
        emailInput.focus();
    }

    console.log('Login-email page initialized successfully');
}

// Auto-initialize when the script loads
document.addEventListener('DOMContentLoaded', initLoginEmailPage);

// Also export for manual initialization
window.initLoginEmailPage = initLoginEmailPage;
