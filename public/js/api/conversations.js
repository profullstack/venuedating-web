/**
 * BarCrush Conversations API
 * 
 * Handles all operations related to conversations between matched users
 */

import supabase from './supabase-client.js';
import { getCurrentUser } from './supabase-client.js';

/**
 * Get all conversations for the current user
 * @param {Object} options - Options for pagination (limit, offset)
 * @returns {Promise<Array>} Array of conversations
 */
export async function getUserConversations(options = { limit: 20, offset: 0 }) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('conversations')
      .select(`
        id,
        created_at,
        updated_at,
        last_message_text,
        last_message_at,
        user_id_1,
        user_id_2,
        user_1_unread_count,
        user_2_unread_count,
        is_active,
        profile1:user_id_1 (id, display_name, avatar_url),
        profile2:user_id_2 (id, display_name, avatar_url)
      `)
      .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`)
      .eq('is_active', true)
      .order('last_message_at', { ascending: false })
      .range(options.offset, options.offset + options.limit - 1);

    if (error) throw error;
    
    // Transform the data to make it easier to use
    return data.map(conversation => {
      const isUser1 = conversation.user_id_1 === user.id;
      const otherUser = isUser1 ? conversation.profile2 : conversation.profile1;
      const unreadCount = isUser1 ? conversation.user_1_unread_count : conversation.user_2_unread_count;
      
      return {
        ...conversation,
        otherUser,
        unreadCount
      };
    });
  } catch (error) {
    console.error('Error getting user conversations:', error);
    throw error;
  }
}

/**
 * Get conversation by ID
 * @param {string} conversationId - ID of the conversation to get
 * @returns {Promise<Object>} Conversation data
 */
export async function getConversationById(conversationId) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('conversations')
      .select(`
        id,
        created_at,
        updated_at,
        last_message_text,
        last_message_at,
        user_id_1,
        user_id_2,
        user_1_unread_count,
        user_2_unread_count,
        is_active,
        profile1:user_id_1 (id, display_name, avatar_url),
        profile2:user_id_2 (id, display_name, avatar_url)
      `)
      .eq('id', conversationId)
      .single();

    if (error) throw error;
    
    // Verify the current user is part of the conversation
    if (data.user_id_1 !== user.id && data.user_id_2 !== user.id) {
      throw new Error('Not authorized to access this conversation');
    }
    
    // Transform the data to make it easier to use
    const isUser1 = data.user_id_1 === user.id;
    const otherUser = isUser1 ? data.profile2 : data.profile1;
    const unreadCount = isUser1 ? data.user_1_unread_count : data.user_2_unread_count;
    
    return {
      ...data,
      otherUser,
      unreadCount
    };
  } catch (error) {
    console.error('Error getting conversation by ID:', error);
    throw error;
  }
}

/**
 * Create a new conversation between two users
 * @param {string} userId1 - First user ID
 * @param {string} userId2 - Second user ID
 * @param {string} matchId - Optional match ID that initiated the conversation
 * @returns {Promise<Object>} Created conversation
 */
export async function createConversation(userId1, userId2, matchId = null) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');
    
    // Verify the current user is one of the participants
    if (user.id !== userId1 && user.id !== userId2) {
      throw new Error('Not authorized to create this conversation');
    }
    
    // Check if a conversation already exists between these users
    const { data: existingConvo, error: existingError } = await supabase
      .from('conversations')
      .select('id')
      .or(`and(user_id_1.eq.${userId1},user_id_2.eq.${userId2}),and(user_id_1.eq.${userId2},user_id_2.eq.${userId1})`)
      .single();
    
    if (existingError && existingError.code !== 'PGRST116') { // PGRST116 is "No rows returned" which is expected if no convo exists
      throw existingError;
    }
    
    // If a conversation already exists, return it
    if (existingConvo) {
      return getConversationById(existingConvo.id);
    }
    
    // Create a new conversation
    const { data, error } = await supabase
      .from('conversations')
      .insert({
        user_id_1: userId1,
        user_id_2: userId2,
        match_id: matchId,
        is_active: true
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Return the full conversation details
    return getConversationById(data.id);
  } catch (error) {
    console.error('Error creating conversation:', error);
    throw error;
  }
}

/**
 * Mark a conversation as read for the current user
 * @param {string} conversationId - ID of the conversation to mark as read
 * @returns {Promise<Object>} Updated conversation
 */
export async function markConversationAsRead(conversationId) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');
    
    const { data: conversation, error: convoError } = await supabase
      .from('conversations')
      .select('user_id_1, user_id_2')
      .eq('id', conversationId)
      .single();
    
    if (convoError) throw convoError;
    
    // Verify the current user is part of the conversation
    if (conversation.user_id_1 !== user.id && conversation.user_id_2 !== user.id) {
      throw new Error('Not authorized to update this conversation');
    }
    
    // Determine which unread count to reset
    const updateField = conversation.user_id_1 === user.id 
      ? { user_1_unread_count: 0 } 
      : { user_2_unread_count: 0 };
    
    // Update the conversation
    const { data, error } = await supabase
      .from('conversations')
      .update(updateField)
      .eq('id', conversationId)
      .select()
      .single();
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error marking conversation as read:', error);
    throw error;
  }
}

/**
 * Deactivate a conversation (soft delete)
 * @param {string} conversationId - ID of the conversation to deactivate
 * @returns {Promise<boolean>} True if successful
 */
export async function deactivateConversation(conversationId) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');
    
    const { data: conversation, error: convoError } = await supabase
      .from('conversations')
      .select('user_id_1, user_id_2')
      .eq('id', conversationId)
      .single();
    
    if (convoError) throw convoError;
    
    // Verify the current user is part of the conversation
    if (conversation.user_id_1 !== user.id && conversation.user_id_2 !== user.id) {
      throw new Error('Not authorized to deactivate this conversation');
    }
    
    // Deactivate the conversation
    const { error } = await supabase
      .from('conversations')
      .update({ is_active: false, updated_at: new Date() })
      .eq('id', conversationId);
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error deactivating conversation:', error);
    throw error;
  }
}
