/**
 * BarCrush Filters API
 * 
 * Handles all operations related to user filters and preferences
 */

import supabase from './supabase-client.js';

/**
 * Get user's current filter preferences
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User's filter preferences
 */
export async function getUserFilters(userId) {
  try {
    const { data, error } = await supabase
      .from('user_filters')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching user filters:', error);
      return getDefaultFilters();
    }

    return data || getDefaultFilters();
  } catch (error) {
    console.error('Error in getUserFilters:', error);
    return getDefaultFilters();
  }
}

/**
 * Save user's filter preferences
 * @param {string} userId - User ID
 * @param {Object} filters - Filter preferences to save
 * @returns {Promise<Object>} Saved filter preferences
 */
export async function saveUserFilters(userId, filters) {
  try {
    const filterData = {
      user_id: userId,
      interested_in: filters.interestedIn || 'girls',
      location: filters.location || 'Chicago, USA',
      latitude: filters.latitude || null,
      longitude: filters.longitude || null,
      distance_km: filters.distance || 40,
      min_age: filters.minAge || 20,
      max_age: filters.maxAge || 28,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('user_filters')
      .upsert(filterData, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      console.error('Error saving user filters:', error);
      throw error;
    }

    console.log('✅ User filters saved successfully:', data);
    return data;
  } catch (error) {
    console.error('Error in saveUserFilters:', error);
    throw error;
  }
}

/**
 * Get default filter values
 * @returns {Object} Default filter preferences
 */
export function getDefaultFilters() {
  return {
    interestedIn: 'girls',
    location: 'Chicago, USA',
    latitude: null,
    longitude: null,
    distance: 40,
    minAge: 20,
    maxAge: 28
  };
}

/**
 * Apply location filter to venues
 * @param {Array} venues - Array of venues
 * @param {Object} locationFilter - Location filter with lat, lng, distance
 * @returns {Array} Filtered venues within distance
 */
export function applyLocationFilter(venues, locationFilter) {
  if (!venues || !Array.isArray(venues)) return [];
  if (!locationFilter || !locationFilter.latitude || !locationFilter.longitude) return venues;

  const { latitude, longitude, distance } = locationFilter;
  
  return venues.filter(venue => {
    // Check for both property name formats (lat/lng and latitude/longitude)
    const venueLat = venue.lat || venue.latitude;
    const venueLng = venue.lng || venue.longitude;
    
    if (!venueLat || !venueLng) {
      console.log('🚫 Venue missing coordinates:', { name: venue.name, lat: venueLat, lng: venueLng });
      return false;
    }
    
    const venueDistance = calculateDistance(
      latitude, longitude,
      venueLat, venueLng
    );
    
    console.log(`📏 Distance to ${venue.name}: ${venueDistance.toFixed(2)}km (limit: ${distance}km)`);
    
    return venueDistance <= distance;
  });
}

/**
 * Apply location filter to user profiles for matching
 * @param {Array} profiles - Array of user profiles
 * @param {Object} locationFilter - Location filter with lat, lng, distance
 * @returns {Array} Filtered profiles within distance
 */
export function applyLocationFilterToProfiles(profiles, locationFilter) {
  if (!profiles || !Array.isArray(profiles)) return [];
  if (!locationFilter || !locationFilter.latitude || !locationFilter.longitude) return profiles;

  const { latitude, longitude, distance } = locationFilter;
  
  return profiles.filter(profile => {
    if (!profile.latitude || !profile.longitude) return false;
    
    const profileDistance = calculateDistance(
      latitude, longitude,
      profile.latitude, profile.longitude
    );
    
    return profileDistance <= distance;
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
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = deg2rad(lat2 - lat1);
  const dLng = deg2rad(lng2 - lng1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in kilometers
  return distance;
}

/**
 * Convert degrees to radians
 * @param {number} deg - Degrees
 * @returns {number} Radians
 */
function deg2rad(deg) {
  return deg * (Math.PI/180);
}

/**
 * Get user's current location using geolocation API
 * @returns {Promise<Object>} Location with latitude and longitude
 */
export function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        console.error('Geolocation error:', error);
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  });
}

/**
 * Reverse geocode coordinates to get location name
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<string>} Location name
 */
export async function reverseGeocode(lat, lng) {
  try {
    // Using a simple geocoding service (you might want to use a more robust service)
    const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
    const data = await response.json();
    
    if (data.city && data.countryName) {
      return `${data.city}, ${data.countryName}`;
    } else if (data.locality && data.countryName) {
      return `${data.locality}, ${data.countryName}`;
    } else {
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}
