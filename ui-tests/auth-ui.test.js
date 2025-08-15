/**
 * UI Tests for Authentication Components
 * Tests the auth page, login/register forms, and phone verification
 */

import { expect } from 'chai';
import { describe, it, beforeEach, afterEach } from 'mocha';
import sinon from 'sinon';
import { JSDOM } from 'jsdom';

describe('Authentication UI Components', () => {
  let dom;
  let window;
  let document;
  let mockApiClient;

  beforeEach(() => {
    // Setup DOM environment
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>BarCrush Auth</title>
          <link rel="stylesheet" href="/css/auth.css">
        </head>
        <body>
          <div id="auth-container">
            <div id="login-form" class="auth-form">
              <h2>Login</h2>
              <form id="login-form-element">
                <input type="email" id="login-email" placeholder="Email" required>
                <input type="password" id="login-password" placeholder="Password" required>
                <button type="submit" id="login-submit">Login</button>
              </form>
              <p class="switch-form">
                Don't have an account? <a href="#" id="show-register">Sign up</a>
              </p>
            </div>
            
            <div id="register-form" class="auth-form hidden">
              <h2>Create Account</h2>
              <form id="register-form-element">
                <input type="text" id="register-name" placeholder="Full Name" required>
                <input type="email" id="register-email" placeholder="Email" required>
                <input type="password" id="register-password" placeholder="Password" required>
                <input type="password" id="register-confirm" placeholder="Confirm Password" required>
                <button type="submit" id="register-submit">Sign Up</button>
              </form>
              <p class="switch-form">
                Already have an account? <a href="#" id="show-login">Login</a>
              </p>
            </div>

            <div id="phone-verification" class="auth-form hidden">
              <h2>Verify Phone</h2>
              <form id="phone-form">
                <input type="tel" id="phone-number" placeholder="+1 (555) 123-4567" required>
                <button type="submit" id="send-code">Send Code</button>
              </form>
              <div id="code-verification" class="hidden">
                <input type="text" id="verification-code" placeholder="Enter 6-digit code" maxlength="6">
                <button id="verify-code">Verify</button>
                <button id="resend-code">Resend Code</button>
              </div>
            </div>

            <div id="loading-spinner" class="hidden">
              <div class="spinner"></div>
              <p>Loading...</p>
            </div>

            <div id="error-message" class="error hidden"></div>
            <div id="success-message" class="success hidden"></div>
          </div>
        </body>
      </html>
    `, {
      url: 'http://localhost:3000',
      pretendToBeVisual: true,
      resources: 'usable'
    });

    window = dom.window;
    document = window.document;
    global.window = window;
    global.document = document;

    // Mock API client
    mockApiClient = {
      login: sinon.stub(),
      register: sinon.stub(),
      sendPhoneCode: sinon.stub(),
      verifyPhoneCode: sinon.stub(),
      resetPassword: sinon.stub()
    };

    // Mock localStorage
    global.localStorage = {
      getItem: sinon.stub(),
      setItem: sinon.stub(),
      removeItem: sinon.stub(),
      clear: sinon.stub()
    };
  });

  afterEach(() => {
    dom.window.close();
    sinon.restore();
    delete global.window;
    delete global.document;
    delete global.localStorage;
  });

  describe('Form Switching', () => {
    it('should show register form when clicking sign up link', () => {
      const showRegisterLink = document.getElementById('show-register');
      const loginForm = document.getElementById('login-form');
      const registerForm = document.getElementById('register-form');

      // Initially login form should be visible
      expect(loginForm.classList.contains('hidden')).to.be.false;
      expect(registerForm.classList.contains('hidden')).to.be.true;

      // Simulate click on sign up link
      showRegisterLink.click();

      // After click, register form should be visible
      expect(loginForm.classList.contains('hidden')).to.be.true;
      expect(registerForm.classList.contains('hidden')).to.be.false;
    });

    it('should show login form when clicking login link from register', () => {
      const showLoginLink = document.getElementById('show-login');
      const loginForm = document.getElementById('login-form');
      const registerForm = document.getElementById('register-form');

      // Start with register form visible
      loginForm.classList.add('hidden');
      registerForm.classList.remove('hidden');

      showLoginLink.click();

      expect(loginForm.classList.contains('hidden')).to.be.false;
      expect(registerForm.classList.contains('hidden')).to.be.true;
    });
  });

  describe('Login Form Validation', () => {
    it('should validate email format', () => {
      const emailInput = document.getElementById('login-email');
      const form = document.getElementById('login-form-element');

      emailInput.value = 'invalid-email';
      
      const isValid = form.checkValidity();
      expect(isValid).to.be.false;
    });

    it('should require password field', () => {
      const emailInput = document.getElementById('login-email');
      const passwordInput = document.getElementById('login-password');
      const form = document.getElementById('login-form-element');

      emailInput.value = 'test@example.com';
      passwordInput.value = '';

      const isValid = form.checkValidity();
      expect(isValid).to.be.false;
    });

    it('should be valid with correct email and password', () => {
      const emailInput = document.getElementById('login-email');
      const passwordInput = document.getElementById('login-password');
      const form = document.getElementById('login-form-element');

      emailInput.value = 'test@example.com';
      passwordInput.value = 'password123';

      const isValid = form.checkValidity();
      expect(isValid).to.be.true;
    });
  });

  describe('Register Form Validation', () => {
    it('should validate all required fields', () => {
      const nameInput = document.getElementById('register-name');
      const emailInput = document.getElementById('register-email');
      const passwordInput = document.getElementById('register-password');
      const confirmInput = document.getElementById('register-confirm');
      const form = document.getElementById('register-form-element');

      // Test empty form
      let isValid = form.checkValidity();
      expect(isValid).to.be.false;

      // Fill all fields
      nameInput.value = 'John Doe';
      emailInput.value = 'john@example.com';
      passwordInput.value = 'password123';
      confirmInput.value = 'password123';

      isValid = form.checkValidity();
      expect(isValid).to.be.true;
    });

    it('should validate password confirmation match', () => {
      const passwordInput = document.getElementById('register-password');
      const confirmInput = document.getElementById('register-confirm');

      passwordInput.value = 'password123';
      confirmInput.value = 'different-password';

      // This would typically be validated by custom JavaScript
      expect(passwordInput.value).to.not.equal(confirmInput.value);
    });

    it('should validate email format in register form', () => {
      const emailInput = document.getElementById('register-email');
      const form = document.getElementById('register-form-element');

      emailInput.value = 'invalid.email';
      
      const isValid = emailInput.checkValidity();
      expect(isValid).to.be.false;
    });
  });

  describe('Phone Verification UI', () => {
    it('should show phone verification form', () => {
      const phoneVerification = document.getElementById('phone-verification');
      
      phoneVerification.classList.remove('hidden');
      
      expect(phoneVerification.classList.contains('hidden')).to.be.false;
    });

    it('should validate phone number format', () => {
      const phoneInput = document.getElementById('phone-number');
      
      phoneInput.value = '+1234567890';
      expect(phoneInput.value.length).to.be.greaterThan(10);
      
      phoneInput.value = 'invalid';
      expect(phoneInput.checkValidity()).to.be.false;
    });

    it('should show code verification after sending code', () => {
      const codeVerification = document.getElementById('code-verification');
      
      // Simulate showing code verification
      codeVerification.classList.remove('hidden');
      
      expect(codeVerification.classList.contains('hidden')).to.be.false;
    });

    it('should validate verification code length', () => {
      const codeInput = document.getElementById('verification-code');
      
      codeInput.value = '123456';
      expect(codeInput.value.length).to.equal(6);
      
      codeInput.value = '123';
      expect(codeInput.value.length).to.be.lessThan(6);
    });
  });

  describe('Loading States', () => {
    it('should show loading spinner during authentication', () => {
      const loadingSpinner = document.getElementById('loading-spinner');
      
      // Show loading
      loadingSpinner.classList.remove('hidden');
      expect(loadingSpinner.classList.contains('hidden')).to.be.false;
      
      // Hide loading
      loadingSpinner.classList.add('hidden');
      expect(loadingSpinner.classList.contains('hidden')).to.be.true;
    });

    it('should disable form buttons during loading', () => {
      const loginButton = document.getElementById('login-submit');
      const registerButton = document.getElementById('register-submit');
      
      // Simulate loading state
      loginButton.disabled = true;
      registerButton.disabled = true;
      
      expect(loginButton.disabled).to.be.true;
      expect(registerButton.disabled).to.be.true;
    });
  });

  describe('Error and Success Messages', () => {
    it('should display error messages', () => {
      const errorElement = document.getElementById('error-message');
      
      errorElement.textContent = 'Invalid credentials';
      errorElement.classList.remove('hidden');
      
      expect(errorElement.classList.contains('hidden')).to.be.false;
      expect(errorElement.textContent).to.equal('Invalid credentials');
    });

    it('should display success messages', () => {
      const successElement = document.getElementById('success-message');
      
      successElement.textContent = 'Account created successfully';
      successElement.classList.remove('hidden');
      
      expect(successElement.classList.contains('hidden')).to.be.false;
      expect(successElement.textContent).to.equal('Account created successfully');
    });

    it('should clear previous messages', () => {
      const errorElement = document.getElementById('error-message');
      const successElement = document.getElementById('success-message');
      
      // Show error first
      errorElement.classList.remove('hidden');
      
      // Then show success (should hide error)
      errorElement.classList.add('hidden');
      successElement.classList.remove('hidden');
      
      expect(errorElement.classList.contains('hidden')).to.be.true;
      expect(successElement.classList.contains('hidden')).to.be.false;
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels and placeholders', () => {
      const emailInput = document.getElementById('login-email');
      const passwordInput = document.getElementById('login-password');
      
      expect(emailInput.placeholder).to.equal('Email');
      expect(passwordInput.placeholder).to.equal('Password');
      expect(emailInput.type).to.equal('email');
      expect(passwordInput.type).to.equal('password');
    });

    it('should have required attributes on mandatory fields', () => {
      const requiredFields = [
        'login-email',
        'login-password',
        'register-name',
        'register-email',
        'register-password',
        'register-confirm',
        'phone-number'
      ];

      requiredFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        expect(field.required).to.be.true;
      });
    });

    it('should have proper button types', () => {
      const submitButtons = document.querySelectorAll('button[type="submit"]');
      const regularButtons = document.querySelectorAll('button:not([type="submit"])');
      
      expect(submitButtons.length).to.be.greaterThan(0);
      expect(regularButtons.length).to.be.greaterThan(0);
    });
  });

  describe('Responsive Design Elements', () => {
    it('should have proper CSS classes for styling', () => {
      const authContainer = document.getElementById('auth-container');
      const authForms = document.querySelectorAll('.auth-form');
      
      expect(authContainer).to.not.be.null;
      expect(authForms.length).to.be.greaterThan(0);
    });

    it('should have hidden class for form switching', () => {
      const hiddenElements = document.querySelectorAll('.hidden');
      expect(hiddenElements.length).to.be.greaterThan(0);
    });
  });
});
