/**
 * BarCrush Venues API
 * 
 * Handles all operations related to bars and venues
 */

import supabase from './supabase-client.js';

/**
 * Get venues within a specific radius from coordinates
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} radiusKm - Radius in kilometers (default: 5)
 * @param {Object} filters - Optional filters
 * @returns {Promise<Array>} Array of venues within the radius
 */
export async function getNearbyVenues(lat, lng, radiusKm = 5, filters = {}) {
  try {
    // Use PostGIS to find venues within radius
    const { data, error } = await supabase.rpc('get_venues_within_radius', {
      center_lat: lat,
      center_lng: lng,
      radius_km: radiusKm,
      venue_type: filters.type || null,
      min_rating: filters.minRating || null
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting nearby venues:', error);
    
    // Rather than throwing an error and breaking the UI, return an empty array
    // This prevents the UI from breaking if the API call fails
    console.warn('API call failed - returning empty array with NO mock data');
    return [];
  }
}

/**
 * Get venue details by ID
 * @param {string} venueId - Venue ID
 * @returns {Promise<Object>} Venue details
 */
export async function getVenueById(venueId) {
  try {
    const { data, error } = await supabase
      .from('venues')
      .select('*')
      .eq('id', venueId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting venue by ID:', error);
    throw error;
  }
}

/**
 * Create a new venue
 * @param {Object} venueData - Venue data
 * @returns {Promise<Object>} Created venue
 */
export async function createVenue(venueData) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Ensure the venue has location data
    if (!venueData.lat || !venueData.lng) {
      throw new Error('Venue must have latitude and longitude');
    }

    // Create the PostGIS point from lat/lng
    const venueWithGeom = {
      ...venueData,
      created_by: user.id,
      location: `POINT(${venueData.lng} ${venueData.lat})`
    };

    // Remove the separate lat/lng as they're now in the location field
    delete venueWithGeom.lat;
    delete venueWithGeom.lng;

    const { data, error } = await supabase
      .from('venues')
      .insert(venueWithGeom)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating venue:', error);
    throw error;
  }
}

/**
 * Upload venue images
 * @param {string} venueId - Venue ID
 * @param {File} file - Image file to upload
 * @returns {Promise<string>} URL of the uploaded image
 */
export async function uploadVenueImage(venueId, file) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const fileExt = file.name.split('.').pop();
    const fileName = `${venueId}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `venues/${fileName}`;

    // Upload the file to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('venue-content')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('venue-content')
      .getPublicUrl(filePath);

    // Get the current venue
    const { data: venue } = await getVenueById(venueId);
    
    // Update the venue's images array
    const images = venue.images || [];
    images.push(publicUrl);

    // Update the venue
    const { data, error } = await supabase
      .from('venues')
      .update({ images })
      .eq('id', venueId)
      .select()
      .single();

    if (error) throw error;
    return publicUrl;
  } catch (error) {
    console.error('Error uploading venue image:', error);
    throw error;
  }
}

/**
 * Search venues by name or description
 * @param {string} query - Search query
 * @param {Object} options - Search options (limit, offset)
 * @returns {Promise<Array>} Array of matching venues
 */
export async function searchVenues(query, options = { limit: 20, offset: 0 }) {
  try {
    const { data, error } = await supabase
      .from('venues')
      .select('*')
      .or(`name.ilike.%${query}%, description.ilike.%${query}%`)
      .range(options.offset, options.offset + options.limit - 1);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error searching venues:', error);
    throw error;
  }
}
