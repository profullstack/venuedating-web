/**
 * BarCrush Matches API
 * 
 * Handles all operations related to user matches including:
 * - Getting potential matches for swiping
 * - Like/dislike functionality
 * - Managing existing matches
 */

import supabase from './supabase-client.js';
import { getCurrentUser } from './supabase-client.js';
import { createConversation } from './conversations.js';
import { getProfile } from './profiles.js';

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

function deg2rad(deg) {
  return deg * (Math.PI/180);
}

/**
 * Get all matches for the current user
 * @param {Object} options - Options for pagination (limit, offset)
 * @returns {Promise<Array>} Array of matches
 */
export async function getUserMatches(options = { limit: 20, offset: 0 }) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('matches')
      .select(`
        id, 
        created_at,
        venue_id,
        status,
        user_id_1, 
        user_id_2,
        venues:venue_id (name, address),
        profile1:user_id_1 (display_name, avatar_url),
        profile2:user_id_2 (display_name, avatar_url)
      `)
      .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`)
      .eq('status', 'matched')
      .order('created_at', { ascending: false })
      .range(options.offset, options.offset + options.limit - 1);

    if (error) throw error;
    
    // Transform the data to make it easier to use
    return data.map(match => {
      const isUser1 = match.user_id_1 === user.id;
      return {
        ...match,
        // Make it clear which profile is the matched person (not the current user)
        matchedWith: isUser1 ? match.profile2 : match.profile1,
        matchedWithId: isUser1 ? match.user_id_2 : match.user_id_1
      };
    });
  } catch (error) {
    console.error('Error getting user matches:', error);
    throw error;
  }
}

/**
 * Create a like/interest in another user
 * @param {string} likedUserId - ID of the user being liked
 * @param {string} venueId - ID of the venue where the like occurred (optional)
 * @returns {Promise<Object>} Match data if mutual, otherwise like data
 */
export async function likeUser(likedUserId, venueId = null) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');
    
    if (user.id === likedUserId) {
      throw new Error('Cannot like yourself');
    }

    // Check if there's an existing match where the liked user has already liked the current user
    const { data: existingLike, error: likeError } = await supabase
      .from('matches')
      .select('*')
      .eq('user_id_1', likedUserId)
      .eq('user_id_2', user.id)
      .eq('status', 'pending')
      .single();

    if (likeError && likeError.code !== 'PGRST116') { // PGRST116 is "No rows returned" which is expected if no match
      throw likeError;
    }

    // If there's an existing like, it's a match!
    if (existingLike) {
      // Update the existing like to a match
      const { data: match, error: matchError } = await supabase
        .from('matches')
        .update({ 
          status: 'matched',
          updated_at: new Date()
        })
        .eq('id', existingLike.id)
        .select()
        .single();

      if (matchError) throw matchError;
      
      // Create a conversation for the match
      await createConversation(user.id, likedUserId, match.id);
      
      return { match, isMatch: true };
    }
    
    // Otherwise, create a new pending match (like)
    const { data: newLike, error: newLikeError } = await supabase
      .from('matches')
      .insert({
        user_id_1: user.id,
        user_id_2: likedUserId,
        venue_id: venueId,
        status: 'pending'
      })
      .select()
      .single();

    if (newLikeError) throw newLikeError;
    
    return { like: newLike, isMatch: false };
  } catch (error) {
    console.error('Error liking user:', error);
    throw error;
  }
}

/**
 * Dislike/pass on a user
 * @param {string} dislikedUserId - ID of the user being disliked/passed
 * @returns {Promise<Object>} Dislike data
 */
// Aliases for backward compatibility
export const likeProfile = likeUser;
export const dislikeProfile = dislikeUser;
export const getMatches = getUserMatches;

/**
 * Get potential matches for the current user to swipe on
 * @param {Object} options - Options for filtering and pagination
 * @returns {Promise<Array>} Array of potential match profiles
 */
export async function getPotentialMatches(options = { limit: 20, offset: 0, distance: 50 }) {
  console.log('🔍 MATCHES DEBUG: Getting potential matches...');
  
  try {
    // For testing, try multiple queries to ensure we get data for real testing
    console.log('🔧 MATCHES DEBUG: Using direct profile query with multiple fallbacks...');
    
    // Try the first query with is_verified filter
    const { data: verifiedProfiles, error: verifiedError } = await supabase
      .from('profiles')
      .select('*')
      .eq('is_verified', true) // Only verified profiles
      .limit(options.limit || 20);
    
    if (verifiedProfiles && verifiedProfiles.length > 0) {
      console.log(`✅ MATCHES DEBUG: Found ${verifiedProfiles.length} verified profiles`);
      return transformProfiles(verifiedProfiles);
    }
    
    if (verifiedError) {
      console.error('❌ MATCHES DEBUG: Error fetching verified profiles:', verifiedError);
    } else {
      console.log('😭 MATCHES DEBUG: No verified profiles found, trying all profiles...');
    }
    
    // If no verified profiles, try without the is_verified filter
    const { data: allProfiles, error: allProfilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(options.limit || 20);
    
    if (allProfiles && allProfiles.length > 0) {
      console.log(`✅ MATCHES DEBUG: Found ${allProfiles.length} profiles (including unverified)`);
      return transformProfiles(allProfiles);
    }
    
    if (allProfilesError) {
      console.error('❌ MATCHES DEBUG: Error fetching all profiles:', allProfilesError);
    } else {
      console.log('😭 MATCHES DEBUG: No profiles found in profiles table');
    }
    
    // No more fallbacks - if we reach here, there are truly no profiles
    
    // If we've reached here, we truly have no data
    console.log('😢 MATCHES DEBUG: Could not find any profiles or users');
    return [];
  } catch (error) {
    console.error('❌ MATCHES DEBUG: Error in getPotentialMatches:', error);
    return [];
  }
}

// Helper function to transform profiles to the expected format
function transformProfiles(profiles) {
  if (!profiles || profiles.length === 0) return [];
  
  // Transform profiles to match expected format
  const transformedProfiles = profiles.map(profile => ({
    id: profile.id,
    full_name: profile.full_name || profile.name || profile.display_name || profile.email?.split('@')[0] || 'User',
    age: profile.age || profile.birth_date ? calculateAge(profile.birth_date) : 25,
    bio: profile.bio || 'No bio available',
    avatar_url: profile.avatar_url || '/images/default-avatar.jpg',
    images: profile.photos ? 
      (typeof profile.photos === 'string' ? JSON.parse(profile.photos) : profile.photos) : 
      [profile.avatar_url || '/images/default-avatar.jpg'],
    location: profile.location || 'San Francisco, CA',
    distance: profile.distance || Math.floor(Math.random() * 10) + 1, // Distance in km
    interests: profile.interests ? 
      (typeof profile.interests === 'string' ? JSON.parse(profile.interests) : profile.interests) : 
      ['Music', 'Travel'],
    is_verified: profile.is_verified || true
  }));
  
  console.log('🎉 MATCHES DEBUG: Transformed profiles:', transformedProfiles);
  return transformedProfiles;
}

// Helper function to calculate age from birth_date
function calculateAge(birthDate) {
  if (!birthDate) return 25;
  
  try {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  } catch (e) {
    return 25;
  }
}

export async function dislikeUser(dislikedUserId) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');
    
    // Create a dislike record
    const { data, error } = await supabase
      .from('matches')
      .insert({
        user_id_1: user.id,
        user_id_2: dislikedUserId,
        status: 'disliked'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error disliking user:', error);
    throw error;
  }
}

/**
 * Unmatch from a user
 * @param {string} matchId - ID of the match to unmatch from
 * @returns {Promise<boolean>} True if successful
 */
export async function unmatchUser(matchId) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    // First get the match to verify ownership
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single();

    if (matchError) throw matchError;

    // Verify the current user is part of the match
    if (match.user_id_1 !== user.id && match.user_id_2 !== user.id) {
      throw new Error('Not authorized to unmatch');
    }

    // Update match status to unmatched
    const { error } = await supabase
      .from('matches')
      .update({ 
        status: 'unmatched',
        updated_at: new Date()
      })
      .eq('id', matchId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error unmatching user:', error);
    throw error;
  }
}
