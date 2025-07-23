/**
 * BarCrush Profiles API
 * 
 * Handles all operations related to user profiles
 */

import supabase from './supabase-client.js';

/**
 * Get current user's profile
 * @returns {Promise<Object>} User profile data
 */
export async function getCurrentProfile() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting current profile:', error);
    throw error;
  }
}

/**
 * Update current user's profile
 * @param {Object} profileData - Updated profile data
 * @returns {Promise<Object>} Updated user profile
 */
export async function updateProfile(profileData) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('profiles')
      .update(profileData)
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
}

// Alias for getCurrentProfile to maintain backward compatibility
export const getUserProfile = getCurrentProfile;

/**
 * Get profile by user ID
 * @param {string} userId - User ID to get profile for
 * @returns {Promise<Object>} User profile data
 */
export async function getProfileById(userId) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting profile by ID:', error);
    throw error;
  }
}

/**
 * Update user theme preference
 * @param {string} theme - Theme preference ('light', 'dark', or 'system')
 * @returns {Promise<Object>} Updated profile with theme preference
 */
export async function updateThemePreference(theme) {
  if (!['light', 'dark', 'system'].includes(theme)) {
    throw new Error('Invalid theme preference');
  }
  
  return updateProfile({ theme_preference: theme });
}

/**
 * Upload a profile avatar image
 * @param {File} file - Image file to upload
 * @returns {Promise<string>} URL of the uploaded avatar
 */
export async function uploadAvatar(file) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    // Upload the file to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('user-content')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('user-content')
      .getPublicUrl(filePath);

    // Update the user's avatar_url
    await updateProfile({ avatar_url: publicUrl });

    return publicUrl;
  } catch (error) {
    console.error('Error uploading avatar:', error);
    throw error;
  }
}

/**
 * Get profiles within a specific radius from user's location
 * @param {number} radiusKm - Radius in kilometers
 * @param {Object} filters - Optional filters like gender, age range, etc.
 * @returns {Promise<Array>} Array of profiles within the radius
 */
export async function getNearbyProfiles(radiusKm = 10, filters = {}) {
  try {
    const currentProfile = await getCurrentProfile();
    if (!currentProfile.location_lat || !currentProfile.location_lng) {
      throw new Error('User location not set');
    }

    // Use PostGIS to find profiles within radius
    // This requires the latitude and longitude to be set for the user
    const { data, error } = await supabase.rpc('get_profiles_within_radius', {
      user_lat: currentProfile.location_lat,
      user_lng: currentProfile.location_lng,
      radius_km: radiusKm,
      gender_filter: filters.gender || null,
      min_age: filters.minAge || null,
      max_age: filters.maxAge || null
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting nearby profiles:', error);
    throw error;
  }
}

/**
 * Update user location
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<Object>} Updated profile
 */
export async function updateLocation(lat, lng) {
  return updateProfile({ 
    location_lat: lat, 
    location_lng: lng,
    updated_at: new Date()
  });
}
