/**
 * BarCrush Message Status Utilities
 * 
 * Handles message delivery status indicators and tracking
 */

import { supabaseClientPromise } from '../supabase-client.js';
import { getCurrentUser } from '../supabase-client.js';

// Message status constants
export const MESSAGE_STATUS = {
  SENDING: 'sending',
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read',
  FAILED: 'failed'
};

// Store message status by message ID
const messageStatusCache = new Map();

/**
 * Update message status in the database
 * @param {string} messageId - ID of the message
 * @param {string} status - New status (one of MESSAGE_STATUS values)
 * @returns {Promise<Object>} Updated message
 */
export async function updateMessageStatus(messageId, status) {
  try {
    if (!Object.values(MESSAGE_STATUS).includes(status)) {
      throw new Error(`Invalid status: ${status}`);
    }
    
    const supabase = await supabaseClientPromise;
    
    // Update the message status
    const { data, error } = await supabase
      .from('messages')
      .update({
        status,
        status_updated_at: new Date().toISOString()
      })
      .eq('id', messageId)
      .select()
      .single();
    
    if (error) throw error;
    
    // Update local cache
    messageStatusCache.set(messageId, status);
    
    return data;
  } catch (error) {
    console.error('Error updating message status:', error);
    throw error;
  }
}

/**
 * Mark message as delivered
 * @param {string} messageId - ID of the message
 * @returns {Promise<Object>} Updated message
 */
export async function markMessageAsDelivered(messageId) {
  return updateMessageStatus(messageId, MESSAGE_STATUS.DELIVERED);
}

/**
 * Mark message as read
 * @param {string} messageId - ID of the message
 * @returns {Promise<Object>} Updated message
 */
export async function markMessageAsRead(messageId) {
  return updateMessageStatus(messageId, MESSAGE_STATUS.READ);
}

/**
 * Mark message as failed
 * @param {string} messageId - ID of the message
 * @returns {Promise<Object>} Updated message
 */
export async function markMessageAsFailed(messageId) {
  return updateMessageStatus(messageId, MESSAGE_STATUS.FAILED);
}

/**
 * Get message status
 * @param {string} messageId - ID of the message
 * @returns {Promise<string>} Message status
 */
export async function getMessageStatus(messageId) {
  // Check cache first
  if (messageStatusCache.has(messageId)) {
    return messageStatusCache.get(messageId);
  }
  
  try {
    const supabase = await supabaseClientPromise;
    
    const { data, error } = await supabase
      .from('messages')
      .select('status')
      .eq('id', messageId)
      .single();
    
    if (error) throw error;
    
    // Update cache
    messageStatusCache.set(messageId, data.status);
    
    return data.status;
  } catch (error) {
    console.error('Error getting message status:', error);
    return null;
  }
}

/**
 * Subscribe to message status changes
 * @param {string} messageId - ID of the message
 * @param {Function} onStatusChange - Callback when status changes
 * @returns {Promise<Object>} Subscription object
 */
export async function subscribeToMessageStatus(messageId, onStatusChange) {
  try {
    const supabase = await supabaseClientPromise;
    
    const subscription = supabase
      .channel(`message-status:${messageId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `id=eq.${messageId}`
      }, (payload) => {
        if (payload.new.status !== payload.old.status) {
          // Update cache
          messageStatusCache.set(messageId, payload.new.status);
          
          // Call callback
          if (onStatusChange) {
            onStatusChange(messageId, payload.new.status);
          }
        }
      })
      .subscribe();
    
    return subscription;
  } catch (error) {
    console.error('Error subscribing to message status:', error);
    return null;
  }
}

/**
 * Create status indicator element
 * @param {string} status - Message status
 * @returns {HTMLElement} Status indicator element
 */
export function createStatusIndicator(status) {
  const indicator = document.createElement('span');
  indicator.className = 'message-status-indicator';
  
  switch (status) {
    case MESSAGE_STATUS.SENDING:
      indicator.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none" stroke-dasharray="30 30" stroke-dashoffset="0"><animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/></circle></svg>';
      indicator.title = 'Sending...';
      break;
    case MESSAGE_STATUS.SENT:
      indicator.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="currentColor"/></svg>';
      indicator.title = 'Sent';
      break;
    case MESSAGE_STATUS.DELIVERED:
      indicator.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41zM.41 13.41L6 19l1.41-1.41L1.83 12 .41 13.41z" fill="currentColor"/></svg>';
      indicator.title = 'Delivered';
      break;
    case MESSAGE_STATUS.READ:
      indicator.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41zM.41 13.41L6 19l1.41-1.41L1.83 12 .41 13.41z" fill="currentColor"/></svg>';
      indicator.classList.add('read');
      indicator.title = 'Read';
      break;
    case MESSAGE_STATUS.FAILED:
      indicator.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="currentColor"/></svg>';
      indicator.classList.add('failed');
      indicator.title = 'Failed to send';
      break;
    default:
      indicator.textContent = '?';
      indicator.title = 'Unknown status';
  }
  
  return indicator;
}

/**
 * Update message status indicators in the UI
 * @param {string} messageId - ID of the message
 * @param {string} status - New status
 */
export function updateStatusIndicator(messageId, status) {
  const messageElement = document.querySelector(`.message[data-message-id="${messageId}"]`);
  if (!messageElement) return;
  
  // Find existing indicator or create a new one
  let indicator = messageElement.querySelector('.message-status-indicator');
  if (!indicator) {
    indicator = document.createElement('span');
    indicator.className = 'message-status-indicator';
    messageElement.querySelector('.message-meta')?.appendChild(indicator);
  }
  
  // Replace with new indicator
  const newIndicator = createStatusIndicator(status);
  indicator.parentNode.replaceChild(newIndicator, indicator);
}

/**
 * Mark all messages in a conversation as read
 * @param {string} conversationId - ID of the conversation
 * @returns {Promise<boolean>} True if successful
 */
export async function markAllMessagesAsRead(conversationId) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');
    
    const supabase = await supabaseClientPromise;
    
    // Update all unread messages sent by the other user
    const { error } = await supabase
      .from('messages')
      .update({
        status: MESSAGE_STATUS.READ,
        status_updated_at: new Date().toISOString(),
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('conversation_id', conversationId)
      .neq('sender_id', user.id)
      .eq('is_read', false);
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error marking all messages as read:', error);
    return false;
  }
}
