/**
 * Authentication guard for BarCrush pages
 * Uses centralized auth middleware to handle authentication and redirects
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
    console.log('[AUTH GUARD] Initialized with protected pages:', this.protectedPages);
  }

  /**
   * Initialize auth guard and check current page
   */
  async init() {
    try {
      console.log('[AUTH GUARD] Initializing auth guard');
      // Initialize auth middleware first
      await authMiddleware.init();
      
      // Check if current page needs protection
      const currentPath = window.location.pathname;
      console.log('[AUTH GUARD] Current path:', currentPath);
      
      const needsAuth = this.protectedPages.some(page => {
        const isMatch = currentPath === page || 
                       currentPath.includes(page) || 
                       (page !== '/' && currentPath.startsWith(page + '/'));
        if (isMatch) {
          console.log(`[AUTH GUARD] Matched protected page: ${page}`);
        }
        return isMatch;
      });
      
      if (needsAuth) {
        console.log('[AUTH GUARD] Current page needs authentication');
        await this.checkAuthAndRedirect();
      } else {
        console.log('[AUTH GUARD] Current page does not need authentication');
      }
    } catch (error) {
      console.error('[AUTH GUARD] Error initializing auth guard:', error);
    }
  }

  /**
   * Check authentication and redirect if needed
   * Uses the centralized auth middleware for consistency
   */
  async checkAuthAndRedirect() {
    try {
      console.log('[AUTH GUARD] Checking authentication using centralized auth middleware');
      // Use the centralized auth middleware to check authentication
      // This will handle redirects consistently across the app
      const isAuthenticated = await authMiddleware.requireAuth();
      
      console.log('[AUTH GUARD] Authentication check result:', isAuthenticated);
      return isAuthenticated;
    } catch (error) {
      console.error('[AUTH GUARD] Error checking authentication:', error);
      return false;
    }
  }

  /**
   * Handle post-login redirect
   * Uses the same redirect key as the centralized auth middleware
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
      console.error('[AUTH GUARD] Error handling post-login redirect:', error);
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
      console.log(`[AUTH GUARD] Added protected page: ${path}`);
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
      console.log(`[AUTH GUARD] Removed protected page: ${path}`);
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
