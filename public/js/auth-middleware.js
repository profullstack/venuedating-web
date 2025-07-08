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
      const supabase = await supabaseClientPromise;
      const { data } = await supabase.auth.getSession();
      return !!data?.session;
    } catch (error) {
      console.error('Error checking authentication:', error);
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
      const supabase = await supabaseClientPromise;
      await supabase.auth.signOut();
      this.currentUser = null;
      this.updateUI();
      window.location.href = '/auth';
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }
}

// Create singleton instance
const authMiddleware = new AuthMiddleware();

// Initialize immediately
authMiddleware.init();

export default authMiddleware;
