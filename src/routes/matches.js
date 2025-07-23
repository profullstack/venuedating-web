import { supabase } from '../utils/supabase.js';
import { authMiddleware } from '../middleware/auth-middleware.js';

/**
 * Get user matches
 */
export async function getUserMatches(c) {
  try {
    const user = c.get('user');
    
    // Get matches from database where the user is either user_id_1 or user_id_2
    // and the status is 'matched'
    // Using a simpler query without joins to avoid foreign key relationship issues
    const { data, error } = await supabase
      .from('matches')
      .select('id, created_at, updated_at, user_id_1, user_id_2, venue_id, matched_at, status')
      .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`)
      .eq('status', 'matched')
      .order('matched_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching matches:', error);
      return c.json({ error: 'Failed to fetch matches' }, 500);
    }
    
    // If no matches found, return empty array
    if (!data || data.length === 0) {
      return c.json([]);
    }
    
    // Get all unique user IDs and venue IDs from the matches
    const userIds = new Set();
    const venueIds = new Set();
    
    data.forEach(match => {
      // Add the other user's ID (not the current user)
      if (match.user_id_1 === user.id) {
        userIds.add(match.user_id_2);
      } else {
        userIds.add(match.user_id_1);
      }
      
      // Add venue ID if present
      if (match.venue_id) {
        venueIds.add(match.venue_id);
      }
    });
    
    // Fetch user profiles in a separate query
    const { data: userProfiles, error: profilesError } = await supabase
      .from('users')
      .select('id, first_name, last_name, avatar_url')
      .in('id', Array.from(userIds));
    
    if (profilesError) {
      console.error('Error fetching user profiles:', profilesError);
      return c.json({ error: 'Failed to fetch user profiles' }, 500);
    }
    
    // Fetch venues in a separate query if there are any venue IDs
    let venueMap = {};
    if (venueIds.size > 0) {
      const { data: venues, error: venuesError } = await supabase
        .from('venues')
        .select('id, name, images')
        .in('id', Array.from(venueIds));
      
      if (venuesError) {
        console.error('Error fetching venues:', venuesError);
        // Continue without venues rather than failing the whole request
      } else if (venues) {
        // Create a map of venues for easy lookup
        venues.forEach(venue => {
          venueMap[venue.id] = venue;
        });
      }
    }
    
    // Create a map of user profiles for easy lookup
    const profileMap = {};
    userProfiles.forEach(profile => {
      profileMap[profile.id] = profile;
    });
    
    // Process data to format it for the client
    const formattedMatches = data.map(match => {
      // Determine which user ID is the other user (not the current user)
      const otherUserId = match.user_id_1 === user.id ? match.user_id_2 : match.user_id_1;
      const otherUserProfile = profileMap[otherUserId] || { id: otherUserId };
      const venue = match.venue_id ? venueMap[match.venue_id] : null;
      
      return {
        id: match.id,
        created_at: match.created_at,
        updated_at: match.updated_at,
        matched_at: match.matched_at,
        status: match.status,
        venue: venue,
        other_user: otherUserProfile
      };
    });
    
    // Return matches data
    return c.json(formattedMatches || []);
  } catch (error) {
    console.error('Error in getUserMatches:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
}

/**
 * Create a new match (like or pass)
 */
export async function createMatch(c) {
  try {
    const user = c.get('user');
    const { target_user_id, venue_id, status } = await c.req.json();
    
    if (!target_user_id || !status) {
      return c.json({ error: 'Target user ID and status are required' }, 400);
    }
    
    if (!['liked', 'passed'].includes(status)) {
      return c.json({ error: 'Status must be either "liked" or "passed"' }, 400);
    }
    
    // Check if there's already a match from the target user to this user
    const { data: existingMatch, error: fetchError } = await supabase
      .from('matches')
      .select('*')
      .eq('user_id_1', target_user_id)
      .eq('user_id_2', user.id)
      .eq('status', 'liked')
      .single();
    
    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Error checking for existing match:', fetchError);
      return c.json({ error: 'Failed to check for existing match' }, 500);
    }
    
    // If the target user already liked this user and this user is liking them back,
    // create a match
    if (existingMatch && status === 'liked') {
      // Update the existing match to 'matched'
      const { error: updateError } = await supabase
        .from('matches')
        .update({
          status: 'matched',
          matched_at: new Date().toISOString()
        })
        .eq('id', existingMatch.id);
      
      if (updateError) {
        console.error('Error updating match status:', updateError);
        return c.json({ error: 'Failed to update match status' }, 500);
      }
      
      // Create a new match entry for this user
      const { data: newMatch, error: insertError } = await supabase
        .from('matches')
        .insert({
          user_id_1: user.id,
          user_id_2: target_user_id,
          venue_id: venue_id,
          status: 'matched',
          matched_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (insertError) {
        console.error('Error creating match:', insertError);
        return c.json({ error: 'Failed to create match' }, 500);
      }
      
      // Create a notification for both users
      await createMatchNotification(user.id, target_user_id, venue_id);
      await createMatchNotification(target_user_id, user.id, venue_id);
      
      return c.json({
        ...newMatch,
        is_mutual_match: true
      });
    } else {
      // Create a new match entry
      const { data: newMatch, error: insertError } = await supabase
        .from('matches')
        .insert({
          user_id_1: user.id,
          user_id_2: target_user_id,
          venue_id: venue_id,
          status: status
        })
        .select()
        .single();
      
      if (insertError) {
        console.error('Error creating match:', insertError);
        return c.json({ error: 'Failed to create match' }, 500);
      }
      
      return c.json({
        ...newMatch,
        is_mutual_match: false
      });
    }
  } catch (error) {
    console.error('Error in createMatch:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
}

/**
 * Create a notification for a match
 */
async function createMatchNotification(userId, matchedUserId, venueId) {
  try {
    // Get the matched user's name
    const { data: matchedUser } = await supabase
      .from('users')
      .select('first_name')
      .eq('id', matchedUserId)
      .single();
    
    // Get the venue name
    const { data: venue } = await supabase
      .from('venues')
      .select('name')
      .eq('id', venueId)
      .single();
    
    // Create the notification
    await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: 'match',
        title: 'New Match!',
        message: `You matched with ${matchedUser?.first_name || 'someone'} at ${venue?.name || 'a venue'}!`,
        read: false
      });
  } catch (error) {
    console.error('Error creating match notification:', error);
  }
}

// Export match routes
export const matchRoutes = [
  {
    method: 'GET',
    path: '/api/matches',
    handler: getUserMatches,
    middleware: [authMiddleware]
  },
  {
    method: 'POST',
    path: '/api/matches',
    handler: createMatch,
    middleware: [authMiddleware]
  }
];
