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
 * @param {Object} filters - Optional filters (gender, minAge, maxAge)
 * @returns {Promise<Array>} Array of venues within the radius
 */
export async function getNearbyVenues(lat, lng, radiusKm = 5, filters = {}) {
  try {
    // Debug Supabase client initialization
    console.log('🔍 API DEBUG - Supabase client:', {
      url: supabase.supabaseUrl ? 'URL exists' : 'URL missing',
      key: supabase.supabaseKey ? 'Key exists' : 'Key missing',
      auth: supabase.auth ? 'Auth module exists' : 'Auth module missing',
      rpc: typeof supabase.rpc === 'function' ? 'RPC function exists' : 'RPC function missing'
    });
    
    // Log the actual URL and key (first few chars only for security)
    if (supabase.supabaseUrl) {
      console.log('🔗 API DEBUG - Actual URL:', supabase.supabaseUrl);
    }
    if (supabase.supabaseKey) {
      console.log('🔑 API DEBUG - Key prefix:', supabase.supabaseKey.substring(0, 10) + '...');
    }
    
    console.log('📍 API DEBUG - Request params:', { lat, lng, radiusKm, filters });
    
    // RPC function is not returning coordinates, using fallback query directly
    console.log('🔄 API DEBUG - Using fallback query (RPC function incomplete)...');
    
    // Skip RPC and go straight to fallback query that includes all venue data
    try {
      
      // Fallback: Get all venues and filter client-side
      // This is less efficient but works without the PostGIS function
      console.log('Attempting fallback query to get all venues...');
      const { data: allVenues, error: queryError } = await supabase
        .from('venues')
        .select('*');
      
      console.log('📊 API DEBUG - Fallback query result:', {
        venuesCount: allVenues ? allVenues.length : 0,
        error: queryError ? {
          message: queryError.message,
          code: queryError.code
        } : 'No error'
      });
      
      if (allVenues && allVenues.length > 0) {
        console.log('📍 API DEBUG - First venue from fallback:', {
          id: allVenues[0].id,
          name: allVenues[0].name,
          lat: allVenues[0].lat,
          lng: allVenues[0].lng
        });
      }
      
      if (queryError) throw queryError;
      
      if (!allVenues || allVenues.length === 0) {
        console.log('No venues found in database');
        return [];
      }
      
      console.log(`Retrieved ${allVenues.length} venues from database, filtering client-side...`);
      
      // Filter venues by distance
      const venuesWithinRadius = allVenues.filter(venue => {
        if (!venue.lat || !venue.lng) return false;
        
        const distance = calculateDistance(lat, lng, venue.lat, venue.lng);
        return distance <= radiusKm;
      });
      
      // Apply additional filters
      return applyFiltersToVenues(venuesWithinRadius, filters);
    } catch (error) {
      console.error('Error getting nearby venues:', error);
      
      // Rather than throwing an error and breaking the UI, return an empty array
      // This prevents the UI from breaking if the API call fails
      console.warn('API call failed - returning empty array with NO mock data');
      return [];
    }
  } catch (outerError) {
    console.error('Outer error in getNearbyVenues:', outerError);
    return [];
  }
}

/**
 * Apply filters to venues
 * @param {Array} venues - Array of venues to filter
 * @param {Object} filters - Filters to apply (gender, minAge, maxAge)
 * @returns {Array} Filtered venues
 */
function applyFiltersToVenues(venues, filters = {}) {
  if (!venues || !Array.isArray(venues)) return [];
  
  console.log('🔍 API DEBUG - Applying filters to venues:', {
    venuesCount: venues.length,
    filters
  });
  
  // If no filters are provided, return all venues
  if (!filters || Object.keys(filters).length === 0) {
    return venues;
  }
  
  return venues.filter(venue => {
    // Gender filter
    if (filters.gender && filters.gender !== 'all') {
      // If venue has a target_gender field and it doesn't match the filter, exclude it
      if (venue.target_gender && venue.target_gender !== filters.gender) {
        return false;
      }
    }
    
    // Age filter - this depends on how age data is stored for venues
    // For example, if venues have min_age and max_age fields:
    if (filters.minAge && venue.max_age && filters.minAge > venue.max_age) {
      return false;
    }
    if (filters.maxAge && venue.min_age && filters.maxAge < venue.min_age) {
      return false;
    }
    
    // All filters passed
    return true;
  });
}

/**
 * Calculate distance between two points using Haversine formula
 * @param {number} lat1 - First point latitude
 * @param {number} lng1 - First point longitude
 * @param {number} lat2 - Second point latitude
 * @param {number} lng2 - Second point longitude
 * @returns {number} Distance in kilometers
 */
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLng = deg2rad(lng2 - lng1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const distance = R * c; // Distance in km
  return distance;
}

function deg2rad(deg) {
  return deg * (Math.PI/180);
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
