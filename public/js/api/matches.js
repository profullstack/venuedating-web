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
// Alias functions to match naming conventions in matching-controller.js
export const likeProfile = likeUser;
export const dislikeProfile = dislikeUser;

/**
 * Get potential matches for the current user to swipe on
 * @param {Object} options - Options for filtering and pagination
 * @returns {Promise<Array>} Array of potential match profiles
 */
export async function getPotentialMatches(options = { limit: 20, offset: 0, distance: 50 }) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');
    
    // Get user's own profile to get location and preferences
    const userProfile = await getProfile(user.id);
    if (!userProfile) throw new Error('Profile not found');
    
    // Query for potential matches based on location, preferences, and previous interactions
    const { data, error } = await supabase.rpc('get_potential_matches', {
      current_user_id: user.id,
      max_distance: options.distance,
      limit_count: options.limit,
      offset_count: options.offset
    });
    
    if (error) throw error;
    
    // Transform and enrich profile data
    const profiles = data.map(profile => ({
      ...profile,
      distance: profile.distance_miles,
      images: profile.photos || [profile.avatar_url]
    }));
    
    return profiles;
  } catch (error) {
    console.error('Error getting potential matches:', error);
    
    // For development, return some mock data if the API call fails
    return [
      {
        id: '1',
        display_name: 'Emma',
        age: 28,
        avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
        bio: 'Looking for someone to explore new bars with!',
        distance: 2.4,
        images: ['https://images.unsplash.com/photo-1494790108377-be9c29b29330']
      },
      {
        id: '2',
        display_name: 'Olivia',
        age: 24,
        avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80',
        bio: 'Cocktail enthusiast and music lover.',
        distance: 5.1,
        images: ['https://images.unsplash.com/photo-1438761681033-6461ffad8d80']
      },
      {
        id: '3',
        display_name: 'Sophia',
        age: 26,
        avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2',
        bio: 'Let's meet for drinks and see where it goes!',
        distance: 3.7,
        images: ['https://images.unsplash.com/photo-1544005313-94ddf0286df2']
      }
    ];
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
