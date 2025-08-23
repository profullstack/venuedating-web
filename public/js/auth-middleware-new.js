import { supabaseClientPromise } from './supabase-client.js';

/**
 * Client-side auth middleware to check user authentication status
 * and update UI elements with user information
 */
class AuthMiddleware {
  constructor() {
    this.currentUser = null;
    this.isInitialized = false;
    
    // Constants for storage keys and auth pages
    this.AUTH_STORAGE_KEYS = {
      JWT_TOKEN: 'barcrush_session_token',
      JWT_EXPIRES: 'barcrush_session_expires',
      USER_DATA: 'barcrush_user',
      DEMO_FLAG: 'demo_account',
      DEMO_USER: 'demo_user'
    };
    
    this.BARCRUSH_ITEMS = [
      'barcrush-token',
      'barcrush-user-id',
      'barcrush-user',
      'barcrush-profile',
      'barcrush-last-venue',
      'barcrush-settings',
      'barcrush_session_token',
      'barcrush_session_expires'
    ];
    
    this.AUTH_PAGES = ['/auth', '/login'];
    this.DEFAULT_AVATAR = '/images/avatar.jpg';
  }

  /**
   * Initialize the auth middleware
   * @returns {Promise<void>}
   */
  async init() {
    if (this.isInitialized) return;
    
    try {
      // Check for demo account first
      if (this.isDemoAccount()) {
        await this.initDemoAccount();
        return;
      }
      
      // Check for JWT token first
      if (await this.initFromJwtToken()) {
        return;
      }
      
      // Fall back to Supabase session
      await this.initFromSupabaseSession();
      
      // Listen for auth state changes
      await this.setupAuthStateListener();
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing auth middleware:', error);
    }
  }

  /**
   * Initialize from demo account
   * @returns {Promise<boolean>} - True if initialized from demo account
   */
  async initDemoAccount() {
    console.log('[DEMO] Using demo account during initialization');
    const demoUserJson = localStorage.getItem(this.AUTH_STORAGE_KEYS.DEMO_USER);
    if (demoUserJson) {
      try {
        this.currentUser = JSON.parse(demoUserJson);
        this.updateUI();
        this.isInitialized = true;
        return true;
      } catch (e) {
        console.error('[DEMO] Error parsing demo user data:', e);
      }
    }
    return false;
  }

  /**
   * Initialize from JWT token
   * @returns {Promise<boolean>} - True if initialized from JWT token
   */
  async initFromJwtToken() {
    const jwtToken = localStorage.getItem(this.AUTH_STORAGE_KEYS.JWT_TOKEN);
    const jwtExpires = localStorage.getItem(this.AUTH_STORAGE_KEYS.JWT_EXPIRES);
    
    if (jwtToken && jwtExpires) {
      const expiresAt = parseInt(jwtExpires);
      const currentTime = Date.now();
      
      if (currentTime < expiresAt) {
        console.log('[AUTH] Valid JWT session found during initialization');
        
        // Load user data from localStorage if available
        const userData = localStorage.getItem(this.AUTH_STORAGE_KEYS.USER_DATA);
        
        if (userData) {
          try {
            this.currentUser = JSON.parse(userData);
            this.updateUI();
            return true;
          } catch (e) {
            console.error('[AUTH] Error parsing stored user data:', e);
          }
        }
      } else {
        // JWT expired, clear it
        this.clearJwtSession();
      }
    }
    return false;
  }

  /**
   * Initialize from Supabase session
   * @returns {Promise<boolean>} - True if initialized from Supabase session
   */
  async initFromSupabaseSession() {
    const supabase = await supabaseClientPromise;
    
    // Get initial auth state with error handling
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.warn('Session initialization error:', error);
      // Clear corrupted session data
      await supabase.auth.signOut();
      this.currentUser = null;
      return false;
    } 
    
    if (data?.session) {
      try {
        await this.fetchUserProfile(data.session.user.id);
        return true;
      } catch (profileError) {
        console.warn('Profile fetch error during init:', profileError);
        // Don't clear session for profile errors, just set basic user data
        this.setBasicUserData(data.session.user);
        return true;
      }
    } else {
      console.log('No active session found during initialization');
      this.currentUser = null;
      return false;
    }
  }

  /**
   * Set up auth state change listener
   * @returns {Promise<void>}
   */
  async setupAuthStateListener() {
    const supabase = await supabaseClientPromise;
    
    supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      
      if (event === 'SIGNED_IN' && session) {
        await this.handleSignIn(session);
      } else if (event === 'SIGNED_OUT') {
        this.handleSignOut();
      } else if (event === 'TOKEN_REFRESHED' && session) {
        await this.handleTokenRefresh(session);
      } else if (event === 'INITIAL_SESSION' && session) {
        await this.handleInitialSession(session);
      }
    });
  }

  /**
   * Handle sign in event
   * @param {Object} session - Supabase session
   * @returns {Promise<void>}
   */
  async handleSignIn(session) {
    // Clear demo account flag if a real user signs in
    localStorage.removeItem(this.AUTH_STORAGE_KEYS.DEMO_FLAG);
    localStorage.removeItem(this.AUTH_STORAGE_KEYS.DEMO_USER);
    
    try {
      await this.fetchUserProfile(session.user.id);
    } catch (error) {
      console.warn('Profile fetch error on sign in:', error);
      // Set basic user data if profile fetch fails
      this.setBasicUserData(session.user);
    }
  }

  /**
   * Handle sign out event
   */
  handleSignOut() {
    this.currentUser = null;
    this.updateUI();
  }

  /**
   * Handle token refresh event
   * @param {Object} session - Supabase session
   * @returns {Promise<void>}
   */
  async handleTokenRefresh(session) {
    console.log('Token refreshed, updating user data');
    try {
      await this.fetchUserProfile(session.user.id);
    } catch (error) {
      console.warn('Profile fetch error on token refresh:', error);
      // Keep existing user data if profile fetch fails during refresh
    }
  }

  /**
   * Handle initial session event
   * @param {Object} session - Supabase session
   * @returns {Promise<void>}
   */
  async handleInitialSession(session) {
    console.log('Initial session detected');
    if (!this.currentUser) {
      try {
        await this.fetchUserProfile(session.user.id);
      } catch (error) {
        console.warn('Profile fetch error on initial session:', error);
        // Set basic user data if profile fetch fails
        this.setBasicUserData(session.user);
      }
    }
  }

  /**
   * Set basic user data from session
   * @param {Object} user - User object from session
   */
  setBasicUserData(user) {
    this.currentUser = {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name || user.user_metadata?.full_name || 'User',
      full_name: user.user_metadata?.full_name || user.user_metadata?.name || 'User',
      avatar_url: user.user_metadata?.avatar_url || this.DEFAULT_AVATAR,
      phone_number: user.user_metadata?.phone_number || user.phone,
      phone_verified: user.user_metadata?.phone_verified || false
    };
    this.updateUI();
  }

  /**
   * Fetch user profile data from Supabase
   * @param {string} userId - User ID
   * @returns {Promise<void>}
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
      throw error;
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
      const avatarUrl = this.currentUser?.avatar_url || this.DEFAULT_AVATAR;
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
  }

  /**
   * Check if the current session is for the demo account
   * @returns {boolean} - True if demo account is being used
   */
  isDemoAccount() {
    try {
      // Check for demo account flag in localStorage
      const demoFlag = localStorage.getItem(this.AUTH_STORAGE_KEYS.DEMO_FLAG);
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
   * Check if user is authenticated via JWT token
   * @returns {Promise<boolean>} - True if authenticated via JWT
   */
  async isJwtAuthenticated() {
    const jwtToken = localStorage.getItem(this.AUTH_STORAGE_KEYS.JWT_TOKEN);
    const jwtExpires = localStorage.getItem(this.AUTH_STORAGE_KEYS.JWT_EXPIRES);
    
    console.log('[AUTH DEBUG] JWT token exists:', !!jwtToken);
    console.log('[AUTH DEBUG] JWT expires exists:', !!jwtExpires);
    
    if (jwtToken && jwtExpires) {
      const expiresAt = parseInt(jwtExpires);
      const currentTime = Date.now();
      const isValid = currentTime < expiresAt;
      const timeRemaining = expiresAt - currentTime;
      
      console.log('[AUTH DEBUG] JWT expiration time:', new Date(expiresAt).toISOString());
      console.log('[AUTH DEBUG] Current time:', new Date(currentTime).toISOString());
      console.log('[AUTH DEBUG] JWT is valid:', isValid);
      console.log('[AUTH DEBUG] Time remaining (ms):', timeRemaining);
      
      if (isValid) {
        console.log('[AUTH] Valid JWT session found, user authenticated');
        
        // Load user data from localStorage if available
        const userData = localStorage.getItem(this.AUTH_STORAGE_KEYS.USER_DATA);
        console.log('[AUTH DEBUG] User data exists in localStorage:', !!userData);
        
        if (userData && !this.currentUser) {
          try {
            this.currentUser = JSON.parse(userData);
            console.log('✅ User data loaded from JWT session:', this.currentUser);
            this.updateUI();
          } catch (e) {
            console.error('[AUTH] Error parsing stored user data:', e);
          }
        }
        return true;
      } else {
        // JWT expired, clear it
        this.clearJwtSession();
      }
    }
    return false;
  }

  /**
   * Check if user is authenticated via Supabase session
   * @returns {Promise<boolean>} - True if authenticated via Supabase
   */
  async isSupabaseAuthenticated() {
    console.log('[AUTH DEBUG] Checking Supabase session');
    const supabase = await supabaseClientPromise;
    const { data, error } = await supabase.auth.getSession();
    
    console.log('[AUTH DEBUG] Supabase session check result:', { 
      hasData: !!data, 
      hasSession: !!data?.session,
      hasError: !!error,
      errorMessage: error?.message
    });
    
    if (error) {
      console.error('Error checking session:', error);
      return false;
    }
    
    const isAuth = !!data?.session;
    console.log('[AUTH DEBUG] Is authenticated via Supabase:', isAuth);
    
    // If authenticated, populate currentUser with session data
    if (isAuth && data.session?.user && !this.currentUser) {
      this.setBasicUserData(data.session.user);
      console.log('✅ User data populated from Supabase session:', this.currentUser);
    }
    
    return isAuth;
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
    
    console.log('[AUTH DEBUG] requireAuth called with redirect =', redirect);
    console.log('[AUTH DEBUG] Current URL:', window.location.href);
    
    try {
      // Check for demo account first
      if (this.isDemoAccount()) {
        console.log('[DEMO] Demo account detected, bypassing auth check');
        
        // If we don't have demo user data yet, create it
        if (!this.currentUser) {
          this.currentUser = {
            id: 'demo-user-id',
            name: 'Demo User',
            full_name: 'Demo User',
            avatar_url: this.DEFAULT_AVATAR,
            phone_number: '+15555555555',
            phone_verified: true
          };
          this.updateUI();
        }
        
        return true;
      }
      
      // Check for JWT authentication first
      if (await this.isJwtAuthenticated()) {
        return true;
      }
      
      // Fall back to Supabase authentication
      const isAuth = await this.isSupabaseAuthenticated();
      
      if (!isAuth && redirect) {
        this.redirectToLogin();
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
   * Redirect to login page if not already on a login page
   */
  redirectToLogin() {
    console.log('[AUTH DEBUG] No active session found, considering redirect');
    console.log('[AUTH DEBUG] Current path:', window.location.pathname);
    
    // Don't redirect if we're already on the auth page to prevent loops
    const isOnAuthPage = this.AUTH_PAGES.some(page => 
      window.location.pathname === page || 
      window.location.pathname.includes(page)
    );
    
    if (!isOnAuthPage) {
      console.log('[AUTH DEBUG] Redirecting to login page');
      window.location.href = '/auth';
    } else {
      console.log('[AUTH DEBUG] Already on auth page, not redirecting');
    }
  }

  /**
   * Clear JWT session data
   */
  clearJwtSession() {
    console.log('[AUTH] JWT session expired or invalid, clearing');
    localStorage.removeItem(this.AUTH_STORAGE_KEYS.JWT_TOKEN);
    localStorage.removeItem(this.AUTH_STORAGE_KEYS.JWT_EXPIRES);
    localStorage.removeItem(this.AUTH_STORAGE_KEYS.USER_DATA);
  }

  /**
   * Log out the current user
   * @returns {Promise<void>}
   */
  async logout() {
    try {
      // Check if this is a demo account logout
      if (this.isDemoAccount()) {
        console.log('[DEMO] Logging out demo account');
        // Clear demo account flags
        localStorage.removeItem(this.AUTH_STORAGE_KEYS.DEMO_FLAG);
        localStorage.removeItem(this.AUTH_STORAGE_KEYS.DEMO_USER);
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
    // Clear Barcrush specific items including JWT session
    this.BARCRUSH_ITEMS.forEach(item => {
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
