/**
 * BarCrush Messages API
 * 
 * Handles all operations related to messages within conversations
 */

import supabase from './supabase-client.js';
import { getCurrentUser } from './supabase-client.js';
import { getConversationById } from './conversations.js';

/**
 * Get messages for a conversation
 * @param {string} conversationId - ID of the conversation
 * @param {Object} options - Options for pagination (limit, offset)
 * @returns {Promise<Array>} Array of messages
 */
export async function getConversationMessages(conversationId, options = { limit: 50, offset: 0 }) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    // First verify the user has access to this conversation
    const conversation = await getConversationById(conversationId);
    
    // Get messages
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false }) // Most recent first
      .range(options.offset, options.offset + options.limit - 1);

    if (error) throw error;
    
    // Transform messages to add a "fromCurrentUser" flag
    return data.map(message => ({
      ...message,
      fromCurrentUser: message.sender_id === user.id
    }));
  } catch (error) {
    console.error('Error getting conversation messages:', error);
    throw error;
  }
}

/**
 * Send a new text message
 * @param {string} conversationId - ID of the conversation
 * @param {string} content - Message content
 * @returns {Promise<Object>} Created message
 */
export async function sendTextMessage(conversationId, content) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    // First verify the user has access to this conversation
    const conversation = await getConversationById(conversationId);
    
    // Create the message
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        message_type: 'text',
        content
      })
      .select()
      .single();

    if (error) throw error;
    
    return {
      ...data,
      fromCurrentUser: true
    };
  } catch (error) {
    console.error('Error sending text message:', error);
    throw error;
  }
}

/**
 * Send a location message
 * @param {string} conversationId - ID of the conversation
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {string} locationName - Optional name of the location
 * @returns {Promise<Object>} Created message
 */
export async function sendLocationMessage(conversationId, lat, lng, locationName = null) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    // First verify the user has access to this conversation
    const conversation = await getConversationById(conversationId);
    
    // Create the location content JSON
    const locationContent = {
      lat,
      lng,
      name: locationName
    };
    
    // Create the message
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        message_type: 'location',
        content: locationName || 'Shared a location',
        metadata: locationContent
      })
      .select()
      .single();

    if (error) throw error;
    
    return {
      ...data,
      fromCurrentUser: true
    };
  } catch (error) {
    console.error('Error sending location message:', error);
    throw error;
  }
}

/**
 * Upload and send a media message (image, audio)
 * @param {string} conversationId - ID of the conversation
 * @param {File} file - File to upload
 * @param {string} messageType - Type of message ('image' or 'audio')
 * @returns {Promise<Object>} Created message
 */
export async function sendMediaMessage(conversationId, file, messageType) {
  try {
    if (!['image', 'audio'].includes(messageType)) {
      throw new Error('Invalid message type. Must be "image" or "audio"');
    }
    
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    // First verify the user has access to this conversation
    const conversation = await getConversationById(conversationId);
    
    // Generate a unique file path
    const fileExt = file.name.split('.').pop();
    const fileName = `${conversationId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `messages/${fileName}`;

    // Upload the file to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('message-content')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('message-content')
      .getPublicUrl(filePath);
    
    // Create content text based on message type
    const content = messageType === 'image' 
      ? 'Sent an image' 
      : 'Sent an audio message';
    
    // Create the message
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        message_type: messageType,
        content,
        attachment_url: publicUrl
      })
      .select()
      .single();

    if (error) throw error;
    
    return {
      ...data,
      fromCurrentUser: true
    };
  } catch (error) {
    console.error(`Error sending ${messageType} message:`, error);
    throw error;
  }
}

/**
 * Mark messages as read
 * @param {string} conversationId - ID of the conversation
 * @returns {Promise<boolean>} True if successful
 */
export async function markMessagesAsRead(conversationId) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    // First verify the user has access to this conversation
    const conversation = await getConversationById(conversationId);
    
    // Update only messages sent by the other user
    const { error } = await supabase
      .from('messages')
      .update({ 
        is_read: true,
        read_at: new Date()
      })
      .eq('conversation_id', conversationId)
      .neq('sender_id', user.id)
      .eq('is_read', false);

    if (error) throw error;
    
    // Also reset the unread count in the conversation
    const isUser1 = conversation.user_id_1 === user.id;
    const updateField = isUser1 
      ? { user_1_unread_count: 0 } 
      : { user_2_unread_count: 0 };
    
    const { error: convoError } = await supabase
      .from('conversations')
      .update(updateField)
      .eq('id', conversationId);
    
    if (convoError) throw convoError;
    
    return true;
  } catch (error) {
    console.error('Error marking messages as read:', error);
    throw error;
  }
}

/**
 * Delete a message (for sender only)
 * @param {string} messageId - ID of the message to delete
 * @returns {Promise<boolean>} True if successful
 */
export async function deleteMessage(messageId) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    // First verify the user is the sender
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .select('sender_id, conversation_id')
      .eq('id', messageId)
      .single();
    
    if (messageError) throw messageError;
    
    if (message.sender_id !== user.id) {
      throw new Error('Not authorized to delete this message');
    }
    
    // Delete the message
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId);
    
    if (error) throw error;
    
    // If this was the last message in the conversation, update the conversation's last_message
    const { data: latestMessage, error: latestError } = await supabase
      .from('messages')
      .select('content, created_at')
      .eq('conversation_id', message.conversation_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (latestError && latestError.code !== 'PGRST116') { // PGRST116 is "No rows returned"
      throw latestError;
    }
    
    if (latestMessage) {
      // Update the conversation with the new latest message
      const { error: updateError } = await supabase
        .from('conversations')
        .update({ 
          last_message_text: latestMessage.content,
          last_message_at: latestMessage.created_at,
          updated_at: new Date()
        })
        .eq('id', message.conversation_id);
      
      if (updateError) throw updateError;
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting message:', error);
    throw error;
  }
}
