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
      
      // Use Supabase's built-in session management
      const supabase = await supabaseClientPromise;
      
      // Get initial auth state with error handling
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.warn('Session initialization error:', error);
        // Clear corrupted session data
        await supabase.auth.signOut();
        this.currentUser = null;
      } else if (data?.session) {
        try {
          await this.fetchUserProfile(data.session.user.id);
        } catch (profileError) {
          console.warn('Profile fetch error during init:', profileError);
          // Don't clear session for profile errors, just set basic user data
          this.currentUser = {
            id: data.session.user.id,
            email: data.session.user.email,
            name: data.session.user.user_metadata?.name || 'User',
            full_name: data.session.user.user_metadata?.full_name || 'User',
            avatar_url: data.session.user.user_metadata?.avatar_url || '/images/avatar.jpg',
            phone_number: data.session.user.user_metadata?.phone_number || data.session.user.phone,
            phone_verified: data.session.user.user_metadata?.phone_verified || false
          };
        }
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
          try {
            await this.fetchUserProfile(session.user.id);
          } catch (error) {
            console.warn('Profile fetch error on sign in:', error);
            // Set basic user data if profile fetch fails
            this.currentUser = {
              id: session.user.id,
              email: session.user.email,
              name: session.user.user_metadata?.name || 'User',
              full_name: session.user.user_metadata?.full_name || 'User',
              avatar_url: session.user.user_metadata?.avatar_url || '/images/avatar.jpg',
              phone_number: session.user.user_metadata?.phone_number || session.user.phone,
              phone_verified: session.user.user_metadata?.phone_verified || false
            };
          }
        } else if (event === 'SIGNED_OUT') {
          this.currentUser = null;
          this.updateUI();
        } else if (event === 'TOKEN_REFRESHED' && session) {
          // Update user data on token refresh to maintain session
          console.log('Token refreshed, updating user data');
          try {
            await this.fetchUserProfile(session.user.id);
          } catch (error) {
            console.warn('Profile fetch error on token refresh:', error);
            // Keep existing user data if profile fetch fails during refresh
          }
        } else if (event === 'INITIAL_SESSION' && session) {
          // Handle initial session load
          console.log('Initial session detected');
          if (!this.currentUser) {
            try {
              await this.fetchUserProfile(session.user.id);
            } catch (error) {
              console.warn('Profile fetch error on initial session:', error);
              // Set basic user data if profile fetch fails
              this.currentUser = {
                id: session.user.id,
                email: session.user.email,
                name: session.user.user_metadata?.name || 'User',
                full_name: session.user.user_metadata?.full_name || 'User',
                avatar_url: session.user.user_metadata?.avatar_url || '/images/avatar.jpg',
                phone_number: session.user.user_metadata?.phone_number || session.user.phone,
                phone_verified: session.user.user_metadata?.phone_verified || false
              };
            }
          }
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
      
      if (error) {
        // Handle case where profile doesn't exist yet
        if (error.code === 'PGRST116') {
          console.log('No profile found for user, will create one when needed');
          // Don't set currentUser to null, keep the basic user data from session
          this.updateUI();
          return;
        }
        throw error;
      }
      
      // Merge profile data with existing user data, prioritizing profile data
      if (data && this.currentUser) {
        this.currentUser = {
          ...this.currentUser,
          ...data,
          // Ensure we have a proper display name
          name: data.full_name || data.name || this.currentUser.name || 'User',
          full_name: data.full_name || data.name || this.currentUser.full_name || 'User'
        };
      } else if (data) {
        this.currentUser = {
          ...data,
          name: data.full_name || data.name || 'User',
          full_name: data.full_name || data.name || 'User'
        };
      }
      
      this.updateUI();
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // Set currentUser to null on error so UI can handle gracefully
      this.currentUser = null;
      this.updateUI();
    }
  }

  /**
   * Update UI elements with user information
   */
  updateUI() {
    // Dispatch auth state change event for components to listen to
    window.dispatchEvent(new CustomEvent('auth-state-changed', {
      detail: { user: this.currentUser }
    }));
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
      
      // If authenticated, populate currentUser with session data
      if (isAuth && data.session?.user) {
        this.currentUser = {
          id: data.session.user.id,
          email: data.session.user.email,
          name: data.session.user.user_metadata?.name || data.session.user.user_metadata?.full_name || 'User',
          full_name: data.session.user.user_metadata?.full_name || data.session.user.user_metadata?.name || 'User',
          avatar_url: data.session.user.user_metadata?.avatar_url || '/images/avatar.jpg',
          phone_number: data.session.user.user_metadata?.phone_number || data.session.user.phone,
          phone_verified: data.session.user.user_metadata?.phone_verified || false
        };
        console.log('✅ User data populated from session:', this.currentUser);
        this.updateUI();
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
