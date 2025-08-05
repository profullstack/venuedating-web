/**
 * Unread Messages Utility
 * Manages unread message counts and badge display across the app
 */

import { supabase } from '../config/supabase.js';

/**
 * Get unread message count for current user
 * @returns {Promise<number>} Number of unread messages
 */
export async function getUnreadMessageCount() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log('🔒 No authenticated user for unread count');
      return 0;
    }

    // Count unread messages in conversations where user is a participant
    const { data, error } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('is_read', false)
      .neq('sender_id', user.id); // Don't count own messages as unread

    if (error) {
      console.error('❌ Error getting unread count:', error);
      return 0;
    }

    const count = data || 0;
    console.log(`📬 Unread messages: ${count}`);
    return count;

  } catch (error) {
    console.error('❌ Error in getUnreadMessageCount:', error);
    return 0;
  }
}

/**
 * Update the unread badge display
 * @param {number} count - Number of unread messages
 */
export function updateUnreadBadge(count) {
  // Update badge in bottom navigation (shadow DOM)
  const bottomNav = document.querySelector('bottom-navigation');
  if (bottomNav && bottomNav.shadowRoot) {
    const badge = bottomNav.shadowRoot.querySelector('#chat-unread-badge');
    if (badge) {
      if (count > 0) {
        badge.classList.remove('hidden');
        if (count > 99) {
          badge.textContent = '99+';
        } else if (count > 9) {
          badge.textContent = count.toString();
        } else {
          badge.textContent = count.toString();
          // For single digits, make it a smaller dot
          if (count < 10) {
            badge.classList.add('dot');
            badge.textContent = '';
          }
        }
      } else {
        badge.classList.add('hidden');
        badge.classList.remove('dot');
      }
    }
  }

  // Update badge in chat page if present
  const chatBadge = document.querySelector('#chat-page-unread-badge');
  if (chatBadge) {
    if (count > 0) {
      chatBadge.classList.remove('hidden');
      chatBadge.textContent = count > 99 ? '99+' : count.toString();
    } else {
      chatBadge.classList.add('hidden');
    }
  }

  console.log(`🔔 Updated unread badge: ${count}`);
}

/**
 * Mark messages as read for a specific conversation
 * @param {string} conversationId - The conversation ID
 */
export async function markConversationAsRead(conversationId) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log('🔒 No authenticated user to mark as read');
      return;
    }

    // Mark all unread messages in this conversation as read
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .eq('is_read', false)
      .neq('sender_id', user.id); // Don't update own messages

    if (error) {
      console.error('❌ Error marking conversation as read:', error);
      return;
    }

    console.log(`✅ Marked conversation ${conversationId} as read`);
    
    // Refresh unread count
    await refreshUnreadCount();

  } catch (error) {
    console.error('❌ Error in markConversationAsRead:', error);
  }
}

/**
 * Refresh unread message count and update badge
 */
export async function refreshUnreadCount() {
  const count = await getUnreadMessageCount();
  updateUnreadBadge(count);
  return count;
}

/**
 * Initialize unread message tracking
 * Sets up real-time subscriptions and initial count
 */
export async function initializeUnreadTracking() {
  try {
    console.log('🔔 Initializing unread message tracking...');
    
    // Get initial unread count
    await refreshUnreadCount();
    
    // Set up real-time subscription for new messages
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log('🔒 No authenticated user for real-time tracking');
      return;
    }

    // Subscribe to new messages in conversations where user is a participant
    const subscription = supabase
      .channel('unread-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=neq.${user.id}` // Only messages from others
        },
        async (payload) => {
          console.log('📨 New message received:', payload.new);
          
          // Check if this message is in a conversation the user participates in
          const { data: conversation } = await supabase
            .from('conversations')
            .select('*')
            .eq('id', payload.new.conversation_id)
            .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`)
            .single();
            
          if (conversation) {
            // Refresh unread count
            await refreshUnreadCount();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `is_read=eq.true`
        },
        async () => {
          // Message marked as read, refresh count
          await refreshUnreadCount();
        }
      )
      .subscribe();

    console.log('✅ Unread message tracking initialized');
    
    // Return cleanup function
    return () => {
      subscription.unsubscribe();
      console.log('🔕 Unread message tracking stopped');
    };

  } catch (error) {
    console.error('❌ Error initializing unread tracking:', error);
  }
}

/**
 * Get unread count for a specific conversation
 * @param {string} conversationId - The conversation ID
 * @returns {Promise<number>} Number of unread messages in conversation
 */
export async function getConversationUnreadCount(conversationId) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return 0;
    }

    const { data, error } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('conversation_id', conversationId)
      .eq('is_read', false)
      .neq('sender_id', user.id);

    if (error) {
      console.error('❌ Error getting conversation unread count:', error);
      return 0;
    }

    return data || 0;

  } catch (error) {
    console.error('❌ Error in getConversationUnreadCount:', error);
    return 0;
  }
}
