import { supabase } from '../utils/supabase.js';
import { authMiddleware } from '../middleware/auth-middleware.js';

/**
 * Get nearby venues based on user location
 */
export async function getNearbyVenues(c) {
  try {
    const { lat, lng, radius = 10 } = await c.req.json();
    
    if (!lat || !lng) {
      return c.json({ error: 'Latitude and longitude are required' }, 400);
    }
    
    // Use the get_nearby_venues function from the database
    const { data, error } = await supabase.rpc('get_nearby_venues', {
      user_lat: lat,
      user_lng: lng,
      radius_km: radius
    });
    
    if (error) {
      console.error('Error fetching nearby venues:', error);
      return c.json({ error: 'Failed to fetch nearby venues' }, 500);
    }
    
    // Return venues data
    return c.json(data || []);
  } catch (error) {
    console.error('Error in getNearbyVenues:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
}

/**
 * Get venue by ID
 */
export async function getVenueById(c) {
  try {
    const venueId = c.req.param('id');
    
    // Get venue from database
    const { data, error } = await supabase
      .from('venues')
      .select('*')
      .eq('id', venueId)
      .single();
    
    if (error) {
      console.error('Error fetching venue:', error);
      return c.json({ error: 'Failed to fetch venue' }, 500);
    }
    
    if (!data) {
      return c.json({ error: 'Venue not found' }, 404);
    }
    
    // Return venue data
    return c.json(data);
  } catch (error) {
    console.error('Error in getVenueById:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
}

/**
 * Get all venues with optional filtering
 */
export async function getAllVenues(c) {
  try {
    const { category, city, limit = 20, offset = 0 } = c.req.query();
    
    // Build query
    let query = supabase.from('venues').select('*');
    
    // Apply filters if provided
    if (category) {
      query = query.eq('category', category);
    }
    
    if (city) {
      query = query.eq('city', city);
    }
    
    // Apply pagination
    query = query.range(offset, offset + limit - 1);
    
    // Execute query
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching venues:', error);
      return c.json({ error: 'Failed to fetch venues' }, 500);
    }
    
    // Return venues data
    return c.json(data || []);
  } catch (error) {
    console.error('Error in getAllVenues:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
}

// Export venue routes
export const venueRoutes = [
  {
    method: 'POST',
    path: '/api/venues/nearby',
    handler: getNearbyVenues,
    middleware: [authMiddleware]
  },
  {
    method: 'GET',
    path: '/api/venues/:id',
    handler: getVenueById,
    middleware: [authMiddleware]
  },
  {
    method: 'GET',
    path: '/api/venues',
    handler: getAllVenues,
    middleware: [authMiddleware]
  }
];
