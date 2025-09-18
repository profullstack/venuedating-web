import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import { supabase, auth } from '$lib/utils/supabase.client.js';

/**
 * Authentication store for managing user state
 */
function createAuthStore() {
  const { subscribe, set, update } = writable({
    user: null,
    session: null,
    loading: true,
    error: null
  });

  return {
    subscribe,
    
    /**
     * Initialize auth state and set up auth listener
     */
    async init() {
      if (!browser) return;

      try {
        // Get initial session
        const { session, error } = await auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          set({ user: null, session: null, loading: false, error: error.message });
          return;
        }

        set({
          user: session?.user || null,
          session,
          loading: false,
          error: null
        });

        // Listen for auth changes
        supabase.auth.onAuthStateChange(async (event, session) => {
          console.log('Auth state changed:', event, session?.user?.id);
          
          set({
            user: session?.user || null,
            session,
            loading: false,
            error: null
          });

          // Handle sign out
          if (event === 'SIGNED_OUT') {
            // Clear any cached data
            localStorage.removeItem('user-profile');
          }
        });
      } catch (error) {
        console.error('Error initializing auth:', error);
        set({ user: null, session: null, loading: false, error: error.message });
      }
    },

    /**
     * Sign in with phone number
     * @param {string} phone 
     */
    async signInWithPhone(phone) {
      update(state => ({ ...state, loading: true, error: null }));

      try {
        const { data, error } = await auth.signInWithPhone(phone);
        
        if (error) {
          update(state => ({ ...state, loading: false, error: error.message }));
          return { success: false, error: error.message };
        }

        update(state => ({ ...state, loading: false }));
        return { success: true, data };
      } catch (error) {
        const errorMessage = error.message || 'Failed to send verification code';
        update(state => ({ ...state, loading: false, error: errorMessage }));
        return { success: false, error: errorMessage };
      }
    },

    /**
     * Verify OTP code
     * @param {string} phone 
     * @param {string} token 
     */
    async verifyOtp(phone, token) {
      update(state => ({ ...state, loading: true, error: null }));

      try {
        const { data, error } = await auth.verifyOtp(phone, token);
        
        if (error) {
          update(state => ({ ...state, loading: false, error: error.message }));
          return { success: false, error: error.message };
        }

        // Auth state will be updated by the listener
        return { success: true, data };
      } catch (error) {
        const errorMessage = error.message || 'Failed to verify code';
        update(state => ({ ...state, loading: false, error: errorMessage }));
        return { success: false, error: errorMessage };
      }
    },

    /**
     * Sign out user
     */
    async signOut() {
      update(state => ({ ...state, loading: true, error: null }));

      try {
        const { error } = await auth.signOut();
        
        if (error) {
          update(state => ({ ...state, loading: false, error: error.message }));
          return { success: false, error: error.message };
        }

        // Auth state will be updated by the listener
        return { success: true };
      } catch (error) {
        const errorMessage = error.message || 'Failed to sign out';
        update(state => ({ ...state, loading: false, error: errorMessage }));
        return { success: false, error: errorMessage };
      }
    },

    /**
     * Clear error state
     */
    clearError() {
      update(state => ({ ...state, error: null }));
    },

    /**
     * Set loading state
     * @param {boolean} loading 
     */
    setLoading(loading) {
      update(state => ({ ...state, loading }));
    }
  };
}

export const authStore = createAuthStore();

// Derived stores for convenience
export const user = derived(authStore, $auth => $auth.user);
export const session = derived(authStore, $auth => $auth.session);
export const isAuthenticated = derived(authStore, $auth => !!$auth.user);
export const isLoading = derived(authStore, $auth => $auth.loading);
export const authError = derived(authStore, $auth => $auth.error);

/**
 * User profile store
 */
function createUserProfileStore() {
  const { subscribe, set, update } = writable({
    profile: null,
    loading: false,
    error: null
  });

  return {
    subscribe,

    /**
     * Fetch user profile
     * @param {string} userId 
     */
    async fetchProfile(userId) {
      if (!userId) return;

      update(state => ({ ...state, loading: true, error: null }));

      try {
        const response = await fetch(`/api/user/${userId}`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch profile');
        }

        const profile = result.user;
        
        // Cache profile in localStorage
        if (browser) {
          localStorage.setItem('user-profile', JSON.stringify(profile));
        }

        set({ profile, loading: false, error: null });
        return { success: true, profile };
      } catch (error) {
        const errorMessage = error.message || 'Failed to fetch profile';
        set({ profile: null, loading: false, error: errorMessage });
        return { success: false, error: errorMessage };
      }
    },

    /**
     * Update user profile
     * @param {object} updates 
     */
    async updateProfile(updates) {
      update(state => ({ ...state, loading: true, error: null }));

      try {
        const response = await fetch('/api/user/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updates)
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to update profile');
        }

        const profile = result.profile;
        
        // Update cache
        if (browser) {
          localStorage.setItem('user-profile', JSON.stringify(profile));
        }

        update(state => ({ ...state, profile, loading: false }));
        return { success: true, profile };
      } catch (error) {
        const errorMessage = error.message || 'Failed to update profile';
        update(state => ({ ...state, loading: false, error: errorMessage }));
        return { success: false, error: errorMessage };
      }
    },

    /**
     * Load profile from cache
     */
    loadFromCache() {
      if (!browser) return;

      try {
        const cached = localStorage.getItem('user-profile');
        if (cached) {
          const profile = JSON.parse(cached);
          set({ profile, loading: false, error: null });
        }
      } catch (error) {
        console.error('Error loading profile from cache:', error);
      }
    },

    /**
     * Clear profile
     */
    clear() {
      set({ profile: null, loading: false, error: null });
      if (browser) {
        localStorage.removeItem('user-profile');
      }
    }
  };
}

export const userProfileStore = createUserProfileStore();
export const userProfile = derived(userProfileStore, $store => $store.profile);
export const profileLoading = derived(userProfileStore, $store => $store.loading);
export const profileError = derived(userProfileStore, $store => $store.error);