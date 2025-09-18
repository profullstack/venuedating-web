import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';

/**
 * Server-side Supabase client with service role key
 * Only available on the server side for admin operations
 * @param {string} [accessToken] - Optional user access token for RLS
 * @returns {import('@supabase/supabase-js').SupabaseClient}
 */
export function createServerSupabaseClient(accessToken = null) {
  if (typeof window !== 'undefined') {
    throw new Error('Server-side Supabase client should not be used on the client side');
  }

  if (!PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing Supabase server environment variables. Please check your .env file.');
  }

  const client = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  // If access token is provided, set it for RLS
  if (accessToken) {
    client.auth.setSession({
      access_token: accessToken,
      refresh_token: '',
      expires_in: 3600,
      token_type: 'bearer',
      user: null
    });
  }

  return client;
}

/**
 * Get user from session token
 * @param {string} token - JWT token
 * @returns {Promise<{user: any, error: any}>}
 */
export async function getUserFromToken(token) {
  const serverClient = createServerSupabaseClient();
  
  try {
    const { data: { user }, error } = await serverClient.auth.getUser(token);
    return { user, error };
  } catch (error) {
    console.error('Error getting user from token:', error);
    return { user: null, error };
  }
}

/**
 * Verify JWT token and return user
 * @param {string} authHeader - Authorization header value
 * @returns {Promise<{user: any, error: any}>}
 */
export async function verifyAuthToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { user: null, error: 'Invalid authorization header' };
  }

  const token = authHeader.substring(7);
  return await getUserFromToken(token);
}

/**
 * Database helper functions
 */
export const db = {
  /**
   * Get user profile by ID
   * @param {string} userId 
   * @param {import('@supabase/supabase-js').SupabaseClient} [client]
   * @returns {Promise<any>}
   */
  async getUserProfile(userId, client = null) {
    const supabaseClient = client || createServerSupabaseClient();
    
    const { data, error } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
    
    return data;
  },

  /**
   * Update user profile
   * @param {string} userId 
   * @param {object} updates 
   * @param {import('@supabase/supabase-js').SupabaseClient} [client]
   * @returns {Promise<any>}
   */
  async updateUserProfile(userId, updates, client = null) {
    const supabaseClient = client || createServerSupabaseClient();
    
    const { data, error } = await supabaseClient
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
    
    return data;
  },

  /**
   * Get venues near location
   * @param {number} lat 
   * @param {number} lng 
   * @param {number} [radiusKm=10] 
   * @param {import('@supabase/supabase-js').SupabaseClient} [client]
   * @returns {Promise<any[]>}
   */
  async getVenuesNearby(lat, lng, radiusKm = 10, client = null) {
    const supabaseClient = client || createServerSupabaseClient();
    
    const { data, error } = await supabaseClient
      .rpc('get_venues_within_radius', {
        lat,
        lng,
        radius_km: radiusKm
      });
    
    if (error) {
      console.error('Error fetching nearby venues:', error);
      return [];
    }
    
    return data || [];
  }
};
