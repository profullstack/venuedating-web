/**
 * BarCrush Realtime Chat Utilities
 * 
 * Handles real-time message updates and typing indicators using Supabase subscriptions
 */

import { supabaseClientPromise } from '../supabase-client.js';
import { getCurrentUser } from '../supabase-client.js';

// Store active subscriptions by conversation ID
const activeSubscriptions = new Map();
const typingStates = new Map();
let typingTimeout;

/**
 * Subscribe to real-time message updates for a conversation
 * @param {string} conversationId - The conversation ID to subscribe to
 * @param {Function} onNewMessage - Callback function when new message is received
 * @param {Function} onMessageUpdated - Callback function when message is updated
 * @param {Function} onMessageDeleted - Callback function when message is deleted
 * @returns {Promise<Object>} Subscription object
 */
export async function subscribeToMessages(
  conversationId, 
  onNewMessage, 
  onMessageUpdated = null, 
  onMessageDeleted = null
) {
  try {
    // Check if we already have an active subscription for this conversation
    if (activeSubscriptions.has(conversationId)) {
      console.log('🔄 Already subscribed to conversation:', conversationId);
      return activeSubscriptions.get(conversationId);
    }

    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');
    
    const supabase = await supabaseClientPromise;
    
    console.log('🔔 Subscribing to messages for conversation:', conversationId);
    
    // Create subscription to messages table filtered by conversation_id
    const subscription = supabase
      .channel(`messages:conversation=${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      }, (payload) => {
        console.log('📨 New message received:', payload);
        
        // Only process messages from other users
        if (payload.new.sender_id !== user.id) {
          const message = {
            ...payload.new,
            fromCurrentUser: false
          };
          
          // Call the callback function
          if (onNewMessage) onNewMessage(message);
          
          // Update unread count in the conversation
          updateUnreadCount(conversationId);
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      }, (payload) => {
        console.log('✏️ Message updated:', payload);
        
        // Call the callback function if provided
        if (onMessageUpdated) {
          const message = {
            ...payload.new,
            fromCurrentUser: payload.new.sender_id === user.id
          };
          onMessageUpdated(message);
        }
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      }, (payload) => {
        console.log('🗑️ Message deleted:', payload);
        
        // Call the callback function if provided
        if (onMessageDeleted) {
          onMessageDeleted(payload.old.id);
        }
      })
      .subscribe();
    
    // Also subscribe to typing indicators
    subscribeToTypingIndicators(conversationId);
    
    // Store the subscription
    activeSubscriptions.set(conversationId, subscription);
    
    return subscription;
  } catch (error) {
    console.error('❌ Error subscribing to messages:', error);
    throw error;
  }
}

/**
 * Subscribe to typing indicators for a conversation
 * @param {string} conversationId - The conversation ID to subscribe to
 * @returns {Promise<Object>} Subscription object
 */
export async function subscribeToTypingIndicators(conversationId) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');
    
    const supabase = await supabaseClientPromise;
    
    // Create a presence channel for typing indicators
    const channel = supabase.channel(`typing:${conversationId}`);
    
    // Track who is typing
    channel
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
        console.log('Presence state synchronized:', newState);
        
        // Update typing states
        updateTypingStates(conversationId, newState, user.id);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User started typing:', newPresences);
        
        // Update typing states
        const state = channel.presenceState();
        updateTypingStates(conversationId, state, user.id);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User stopped typing:', leftPresences);
        
        // Update typing states
        const state = channel.presenceState();
        updateTypingStates(conversationId, state, user.id);
      })
      .subscribe();
    
    return channel;
  } catch (error) {
    console.error('❌ Error subscribing to typing indicators:', error);
    return null;
  }
}

/**
 * Update typing states and trigger UI updates
 * @param {string} conversationId - The conversation ID
 * @param {Object} state - The presence state
 * @param {string} currentUserId - The current user's ID
 */
function updateTypingStates(conversationId, state, currentUserId) {
  // Extract users who are typing (excluding current user)
  const typingUsers = [];
  
  Object.keys(state).forEach(key => {
    state[key].forEach(presence => {
      if (presence.user_id !== currentUserId && presence.isTyping) {
        typingUsers.push({
          userId: presence.user_id,
          displayName: presence.display_name
        });
      }
    });
  });
  
  // Update typing states
  typingStates.set(conversationId, typingUsers);
  
  // Trigger UI update
  const event = new CustomEvent('typing-indicator-update', {
    detail: {
      conversationId,
      typingUsers
    }
  });
  document.dispatchEvent(event);
}

/**
 * Send typing indicator
 * @param {string} conversationId - The conversation ID
 * @param {boolean} isTyping - Whether the user is typing
 */
export async function sendTypingIndicator(conversationId, isTyping = true) {
  try {
    const user = await getCurrentUser();
    if (!user) return;
    
    const supabase = await supabaseClientPromise;
    const channel = supabase.channel(`typing:${conversationId}`);
    
    // Clear previous timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    
    if (isTyping) {
      // Send typing status
      await channel.track({
        user_id: user.id,
        display_name: user.user_metadata?.display_name || 'User',
        isTyping: true
      });
      
      // Automatically clear typing status after 3 seconds of inactivity
      typingTimeout = setTimeout(() => {
        sendTypingIndicator(conversationId, false);
      }, 3000);
    } else {
      // Send not typing status
      await channel.track({
        user_id: user.id,
        display_name: user.user_metadata?.display_name || 'User',
        isTyping: false
      });
    }
  } catch (error) {
    console.error('❌ Error sending typing indicator:', error);
  }
}

/**
 * Update unread count in the conversation
 * @param {string} conversationId - The conversation ID
 */
async function updateUnreadCount(conversationId) {
  try {
    const user = await getCurrentUser();
    if (!user) return;
    
    const supabase = await supabaseClientPromise;
    
    // First get the conversation to determine which user we are
    const { data: conversation, error: convoError } = await supabase
      .from('conversations')
      .select('user_id_1, user_id_2, user_1_unread_count, user_2_unread_count')
      .eq('id', conversationId)
      .single();
    
    if (convoError) throw convoError;
    
    // Determine which user we are and increment the appropriate unread count
    const isUser1 = conversation.user_id_1 === user.id;
    const updateField = isUser1 
      ? { user_1_unread_count: conversation.user_1_unread_count + 1 } 
      : { user_2_unread_count: conversation.user_2_unread_count + 1 };
    
    // Update the conversation
    const { error } = await supabase
      .from('conversations')
      .update(updateField)
      .eq('id', conversationId);
    
    if (error) throw error;
    
    // Dispatch event to update UI
    const event = new CustomEvent('unread-count-updated', {
      detail: {
        conversationId,
        unreadCount: isUser1 ? conversation.user_1_unread_count + 1 : conversation.user_2_unread_count + 1
      }
    });
    document.dispatchEvent(event);
    
  } catch (error) {
    console.error('❌ Error updating unread count:', error);
  }
}

/**
 * Unsubscribe from a conversation
 * @param {string} conversationId - The conversation ID to unsubscribe from
 */
export async function unsubscribeFromConversation(conversationId) {
  try {
    if (!activeSubscriptions.has(conversationId)) {
      return;
    }
    
    const subscription = activeSubscriptions.get(conversationId);
    
    // Remove subscription
    const supabase = await supabaseClientPromise;
    await supabase.removeChannel(subscription);
    
    // Remove from active subscriptions
    activeSubscriptions.delete(conversationId);
    
    console.log('🔕 Unsubscribed from conversation:', conversationId);
  } catch (error) {
    console.error('❌ Error unsubscribing from conversation:', error);
  }
}

/**
 * Get typing users for a conversation
 * @param {string} conversationId - The conversation ID
 * @returns {Array} Array of typing users
 */
export function getTypingUsers(conversationId) {
  return typingStates.get(conversationId) || [];
}

/**
 * Check if anyone is typing in a conversation
 * @param {string} conversationId - The conversation ID
 * @returns {boolean} True if someone is typing
 */
export function isAnyoneTyping(conversationId) {
  const typingUsers = typingStates.get(conversationId) || [];
  return typingUsers.length > 0;
}
