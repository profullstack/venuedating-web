/**
 * Authentication guard for BarCrush pages
 * Redirects unauthenticated users to login
 */

import authMiddleware from './auth-middleware.js';

class AuthGuard {
  constructor() {
    this.protectedPages = [
      '/discover',
      '/matching', 
      '/chat',
      '/feed',
      '/profile-detail',
      '/edit-profile',
      '/notifications',
      '/conversation'
    ];
  }

  /**
   * Initialize auth guard and check current page
   */
  async init() {
    try {
      // Initialize auth middleware first
      await authMiddleware.init();
      
      // Check if current page needs protection
      const currentPath = window.location.pathname;
      const needsAuth = this.protectedPages.some(page => 
        currentPath === page || currentPath.startsWith(page + '/')
      );
      
      if (needsAuth) {
        await this.checkAuthAndRedirect();
      }
    } catch (error) {
      console.error('Error initializing auth guard:', error);
    }
  }

  /**
   * Check authentication and redirect if needed
   */
  async checkAuthAndRedirect() {
    try {
      const isAuthenticated = await authMiddleware.isAuthenticated();
      
      if (!isAuthenticated) {
        console.log('[AUTH GUARD] User not authenticated, redirecting to login');
        
        // Store the current page to redirect back after login
        const currentUrl = window.location.href;
        localStorage.setItem('barcrush_redirect_after_login', currentUrl);
        
        // Redirect to phone login
        window.location.href = '/phone-login';
        return false;
      }
      
      console.log('[AUTH GUARD] User authenticated, allowing access');
      return true;
    } catch (error) {
      console.error('Error checking authentication:', error);
      // On error, redirect to login for safety
      window.location.href = '/phone-login';
      return false;
    }
  }

  /**
   * Handle post-login redirect
   */
  static handlePostLoginRedirect() {
    try {
      const redirectUrl = localStorage.getItem('barcrush_redirect_after_login');
      if (redirectUrl) {
        localStorage.removeItem('barcrush_redirect_after_login');
        console.log('[AUTH GUARD] Redirecting to stored URL:', redirectUrl);
        window.location.href = redirectUrl;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error handling post-login redirect:', error);
      return false;
    }
  }

  /**
   * Add a page to the protected pages list
   * @param {string} path - Page path to protect
   */
  addProtectedPage(path) {
    if (!this.protectedPages.includes(path)) {
      this.protectedPages.push(path);
    }
  }

  /**
   * Remove a page from the protected pages list
   * @param {string} path - Page path to unprotect
   */
  removeProtectedPage(path) {
    const index = this.protectedPages.indexOf(path);
    if (index > -1) {
      this.protectedPages.splice(index, 1);
    }
  }
}

// Create and export singleton instance
export const authGuard = new AuthGuard();

// Auto-initialize on page load
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    authGuard.init();
  });
}
