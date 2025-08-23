/**
 * BarCrush Message Reactions
 * 
 * Handles adding, removing, and displaying message reactions
 */

import { supabaseClientPromise } from '../supabase-client.js';
import { getCurrentUser } from '../supabase-client.js';

// Available reaction emojis
export const AVAILABLE_REACTIONS = [
  { emoji: '❤️', name: 'heart' },
  { emoji: '👍', name: 'thumbs_up' },
  { emoji: '👎', name: 'thumbs_down' },
  { emoji: '😂', name: 'laugh' },
  { emoji: '😮', name: 'wow' },
  { emoji: '😢', name: 'sad' },
  { emoji: '🔥', name: 'fire' }
];

/**
 * Add a reaction to a message
 * @param {string} messageId - ID of the message
 * @param {string} reactionName - Name of the reaction (e.g., 'heart', 'thumbs_up')
 * @returns {Promise<Object>} Created reaction
 */
export async function addReaction(messageId, reactionName) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');
    
    // Validate reaction name
    const validReaction = AVAILABLE_REACTIONS.find(r => r.name === reactionName);
    if (!validReaction) throw new Error('Invalid reaction name');
    
    const supabase = await supabaseClientPromise;
    
    // Check if user already reacted with this emoji
    const { data: existingReaction, error: checkError } = await supabase
      .from('message_reactions')
      .select('id')
      .eq('message_id', messageId)
      .eq('user_id', user.id)
      .eq('reaction_name', reactionName)
      .maybeSingle();
    
    if (checkError) throw checkError;
    
    // If reaction already exists, remove it (toggle behavior)
    if (existingReaction) {
      return removeReaction(existingReaction.id);
    }
    
    // Create the reaction
    const { data, error } = await supabase
      .from('message_reactions')
      .insert({
        message_id: messageId,
        user_id: user.id,
        reaction_name: reactionName,
        reaction_emoji: validReaction.emoji
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error adding reaction:', error);
    throw error;
  }
}

/**
 * Remove a reaction from a message
 * @param {string} reactionId - ID of the reaction to remove
 * @returns {Promise<boolean>} True if successful
 */
export async function removeReaction(reactionId) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');
    
    const supabase = await supabaseClientPromise;
    
    // First verify the user is the one who created the reaction
    const { data: reaction, error: reactionError } = await supabase
      .from('message_reactions')
      .select('user_id')
      .eq('id', reactionId)
      .single();
    
    if (reactionError) throw reactionError;
    
    if (reaction.user_id !== user.id) {
      throw new Error('Not authorized to remove this reaction');
    }
    
    // Remove the reaction
    const { error } = await supabase
      .from('message_reactions')
      .delete()
      .eq('id', reactionId);
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error removing reaction:', error);
    throw error;
  }
}

/**
 * Get all reactions for a message
 * @param {string} messageId - ID of the message
 * @returns {Promise<Array>} Array of reactions
 */
export async function getMessageReactions(messageId) {
  try {
    const supabase = await supabaseClientPromise;
    
    const { data, error } = await supabase
      .from('message_reactions')
      .select(`
        id,
        reaction_name,
        reaction_emoji,
        created_at,
        user_id,
        profiles:user_id (display_name, avatar_url)
      `)
      .eq('message_id', messageId);
    
    if (error) throw error;
    
    // Group reactions by type
    const groupedReactions = {};
    
    data.forEach(reaction => {
      if (!groupedReactions[reaction.reaction_name]) {
        groupedReactions[reaction.reaction_name] = {
          name: reaction.reaction_name,
          emoji: reaction.reaction_emoji,
          count: 0,
          users: []
        };
      }
      
      groupedReactions[reaction.reaction_name].count++;
      groupedReactions[reaction.reaction_name].users.push({
        id: reaction.user_id,
        displayName: reaction.profiles.display_name,
        avatarUrl: reaction.profiles.avatar_url
      });
    });
    
    return Object.values(groupedReactions);
  } catch (error) {
    console.error('Error getting message reactions:', error);
    return [];
  }
}

/**
 * Check if current user has reacted to a message with a specific reaction
 * @param {string} messageId - ID of the message
 * @param {string} reactionName - Name of the reaction
 * @returns {Promise<boolean>} True if user has reacted
 */
export async function hasUserReacted(messageId, reactionName) {
  try {
    const user = await getCurrentUser();
    if (!user) return false;
    
    const supabase = await supabaseClientPromise;
    
    const { data, error } = await supabase
      .from('message_reactions')
      .select('id')
      .eq('message_id', messageId)
      .eq('user_id', user.id)
      .eq('reaction_name', reactionName)
      .maybeSingle();
    
    if (error) throw error;
    
    return !!data;
  } catch (error) {
    console.error('Error checking if user reacted:', error);
    return false;
  }
}

/**
 * Subscribe to reaction changes for a message
 * @param {string} messageId - ID of the message
 * @param {Function} onReactionChange - Callback when reactions change
 * @returns {Promise<Object>} Subscription object
 */
export async function subscribeToReactions(messageId, onReactionChange) {
  try {
    const supabase = await supabaseClientPromise;
    
    const subscription = supabase
      .channel(`reactions:message=${messageId}`)
      .on('postgres_changes', {
        event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
        schema: 'public',
        table: 'message_reactions',
        filter: `message_id=eq.${messageId}`
      }, async (payload) => {
        // Fetch updated reactions
        const reactions = await getMessageReactions(messageId);
        
        // Call the callback
        if (onReactionChange) {
          onReactionChange(reactions);
        }
      })
      .subscribe();
    
    return subscription;
  } catch (error) {
    console.error('Error subscribing to reactions:', error);
    return null;
  }
}

/**
 * Create reaction UI elements for a message
 * @param {string} messageId - ID of the message
 * @param {Array} reactions - Array of reaction objects
 * @param {Function} onReactionClick - Callback when a reaction is clicked
 * @returns {HTMLElement} Reaction container element
 */
export function createReactionElements(messageId, reactions, onReactionClick) {
  const container = document.createElement('div');
  container.className = 'message-reactions';
  container.dataset.messageId = messageId;
  
  // Create reaction bubbles
  reactions.forEach(reaction => {
    const bubble = document.createElement('button');
    bubble.className = 'reaction-bubble';
    bubble.dataset.reaction = reaction.name;
    bubble.innerHTML = `${reaction.emoji} <span class="reaction-count">${reaction.count}</span>`;
    bubble.title = reaction.users.map(u => u.displayName).join(', ');
    
    // Add click handler
    bubble.addEventListener('click', () => {
      if (onReactionClick) {
        onReactionClick(messageId, reaction.name);
      }
    });
    
    container.appendChild(bubble);
  });
  
  // Add reaction button
  const addButton = document.createElement('button');
  addButton.className = 'add-reaction-button';
  addButton.innerHTML = '😀+';
  addButton.title = 'Add reaction';
  
  // Show reaction picker on click
  addButton.addEventListener('click', (event) => {
    event.stopPropagation();
    showReactionPicker(messageId, event.target, onReactionClick);
  });
  
  container.appendChild(addButton);
  
  return container;
}

/**
 * Show reaction picker
 * @param {string} messageId - ID of the message
 * @param {HTMLElement} targetElement - Element to position picker near
 * @param {Function} onReactionClick - Callback when a reaction is clicked
 */
function showReactionPicker(messageId, targetElement, onReactionClick) {
  // Remove any existing pickers
  const existingPickers = document.querySelectorAll('.reaction-picker');
  existingPickers.forEach(picker => picker.remove());
  
  // Create picker
  const picker = document.createElement('div');
  picker.className = 'reaction-picker';
  
  // Add reactions
  AVAILABLE_REACTIONS.forEach(reaction => {
    const emojiButton = document.createElement('button');
    emojiButton.className = 'emoji-button';
    emojiButton.textContent = reaction.emoji;
    emojiButton.title = reaction.name;
    
    emojiButton.addEventListener('click', () => {
      if (onReactionClick) {
        onReactionClick(messageId, reaction.name);
      }
      picker.remove();
    });
    
    picker.appendChild(emojiButton);
  });
  
  // Position picker
  document.body.appendChild(picker);
  const rect = targetElement.getBoundingClientRect();
  picker.style.position = 'absolute';
  picker.style.top = `${rect.bottom + window.scrollY + 5}px`;
  picker.style.left = `${rect.left + window.scrollX}px`;
  
  // Close picker when clicking outside
  document.addEventListener('click', function closePickerOnClickOutside(event) {
    if (!picker.contains(event.target) && event.target !== targetElement) {
      picker.remove();
      document.removeEventListener('click', closePickerOnClickOutside);
    }
  });
}
