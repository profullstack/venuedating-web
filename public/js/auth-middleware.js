import { supabaseClientPromise } from './supabase-client.js';

/**
 * Client-side auth middleware to check user authentication status
 * and update UI elements with user information
 */
class AuthMiddleware {
  constructor() {
    this.currentUser = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the auth middleware
   * @returns {Promise<void>}
   */
  async init() {
    if (this.isInitialized) return;
    
    try {
      // Check for demo account first
      const isDemoAccount = this.checkForDemoAccount();
      if (isDemoAccount) {
        console.log('[DEMO] Using demo account during initialization');
        // Load demo user data
        const demoUserJson = localStorage.getItem('demo_user');
        if (demoUserJson) {
          try {
            this.currentUser = JSON.parse(demoUserJson);
            this.updateUI();
            this.isInitialized = true;
            return;
          } catch (e) {
            console.error('[DEMO] Error parsing demo user data:', e);
          }
        }
      }
      
      // If not a demo account or demo data is invalid, proceed with normal Supabase auth
      const supabase = await supabaseClientPromise;
      
      // Get initial auth state
      const { data } = await supabase.auth.getSession();
      if (data?.session) {
        await this.fetchUserProfile(data.session.user.id);
      } else {
        console.log('No active session found during initialization');
        this.currentUser = null;
      }
      
      // Listen for auth state changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', event);
        if (event === 'SIGNED_IN' && session) {
          // Clear demo account flag if a real user signs in
          localStorage.removeItem('demo_account');
          localStorage.removeItem('demo_user');
          await this.fetchUserProfile(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          this.currentUser = null;
          this.updateUI();
        }
      });
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing auth middleware:', error);
    }
  }

  /**
   * Fetch user profile data from Supabase
   * @param {string} userId - User ID
   */
  async fetchUserProfile(userId) {
    try {
      const supabase = await supabaseClientPromise;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      
      this.currentUser = data;
      this.updateUI();
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  }

  /**
   * Update UI elements with user information
   */
  updateUI() {
    // Update all user name elements
    const userNameElements = document.querySelectorAll('.user-name');
    if (userNameElements.length > 0) {
      const displayName = this.currentUser?.name || this.currentUser?.full_name || 'User';
      userNameElements.forEach(element => {
        element.textContent = displayName;
      });
    }
    
    // Update user avatar elements
    const userAvatarElements = document.querySelectorAll('.user-avatar');
    if (userAvatarElements.length > 0) {
      const avatarUrl = this.currentUser?.avatar_url || '/images/avatar.jpg';
      userAvatarElements.forEach(element => {
        if (element.tagName === 'IMG') {
          element.src = avatarUrl;
        } else {
          element.style.backgroundImage = `url(${avatarUrl})`;
        }
      });
    }
    
    // Toggle auth-dependent UI elements
    document.body.classList.toggle('is-authenticated', !!this.currentUser);
    document.body.classList.toggle('is-anonymous', !this.currentUser);
  }

  /**
   * Check if user is authenticated
   * @returns {Promise<boolean>} - Promise resolving to true if user is authenticated
   */
  async isAuthenticated() {
    try {
      // Check for demo account first
      const isDemoAccount = this.checkForDemoAccount();
      if (isDemoAccount) {
        console.log('[DEMO] Using demo account authentication');
        return true;
      }
      
      // Otherwise check with Supabase
      const supabase = await supabaseClientPromise;
      const { data } = await supabase.auth.getSession();
      return !!data?.session;
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  }
  
  /**
   * Check if the current session is for the demo account
   * @returns {boolean} - True if demo account is being used
   */
  checkForDemoAccount() {
    try {
      // Check for demo account flag in localStorage
      const demoFlag = localStorage.getItem('demo_account');
      if (demoFlag === 'true') {
        console.log('[DEMO] Demo account flag found in localStorage');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error checking for demo account:', error);
      return false;
    }
  }

  /**
   * Get current user
   * @returns {Object|null} - Current user object or null
   */
  getUser() {
    return this.currentUser;
  }

  /**
   * Redirect to login page if not authenticated
   * @param {boolean} redirect - Whether to redirect to login page
   * @returns {Promise<boolean>} - Promise resolving to true if authenticated
   */
  async requireAuth(redirect = true) {
    // Make sure initialization is complete
    if (!this.isInitialized) {
      await this.init();
    }
    
    try {
      // Check for demo account first
      const isDemoAccount = this.checkForDemoAccount();
      if (isDemoAccount) {
        console.log('[DEMO] Demo account detected, bypassing auth check');
        
        // If we don't have demo user data yet, create it
        if (!this.currentUser) {
          this.currentUser = {
            id: 'demo-user-id',
            name: 'Demo User',
            full_name: 'Demo User',
            avatar_url: '/images/avatar.jpg',
            phone_number: '+15555555555',
            phone_verified: true
          };
          this.updateUI();
        }
        
        return true;
      }
      
      // Force a fresh session check directly from Supabase
      const supabase = await supabaseClientPromise;
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error checking session:', error);
        if (redirect) {
          console.log('Session error, redirecting to login page');
          window.location.href = '/auth';
        }
        return false;
      }
      
      const isAuth = !!data?.session;
      
      if (!isAuth && redirect) {
        console.log('No active session found, redirecting to login page');
        window.location.href = '/auth';
        return false;
      }
      
      return isAuth;
    } catch (error) {
      console.error('Error in requireAuth:', error);
      if (redirect) {
        window.location.href = '/auth';
      }
      return false;
    }
  }
  
  /**
   * Log out the current user
   * @returns {Promise<void>}
   */
  async logout() {
    try {
      // Check if this is a demo account logout
      const isDemoAccount = this.checkForDemoAccount();
      if (isDemoAccount) {
        console.log('[DEMO] Logging out demo account');
        // Clear demo account flags
        localStorage.removeItem('demo_account');
        localStorage.removeItem('demo_user');
      }
      
      // Regular Supabase logout
      const supabase = await supabaseClientPromise;
      await supabase.auth.signOut();
      
      // Clear all auth-related local storage items
      this.clearAuthData();
      
      // Update UI and redirect
      this.currentUser = null;
      this.updateUI();
      
      // Dispatch event for components to react to logout
      window.dispatchEvent(new CustomEvent('user-logged-out'));
      
      // Redirect to auth page
      window.location.href = '/auth';
    } catch (error) {
      console.error('Error logging out:', error);
      throw error; // Re-throw to allow UI to handle the error
    }
  }
  
  /**
   * Clear all authentication-related data from local storage
   */
  clearAuthData() {
    // Clear Barcrush specific items
    const barcrushItems = [
      'barcrush-token',
      'barcrush-user-id',
      'barcrush-user',
      'barcrush-profile',
      'barcrush-last-venue',
      'barcrush-settings'
    ];
    
    barcrushItems.forEach(item => {
      if (localStorage.getItem(item)) {
        localStorage.removeItem(item);
      }
    });
    
    // Clear any Supabase related items
    const supabasePrefix = 'sb-';
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(supabasePrefix)) {
        localStorage.removeItem(key);
        // Adjust index since we're removing items
        i--;
      }
    }
    
    console.log('All auth data cleared from local storage');
  }
}

// Create singleton instance
const authMiddleware = new AuthMiddleware();

// Initialize immediately
authMiddleware.init();

export default authMiddleware;
