import { supabase } from '../utils/supabase.js';
import { authMiddleware } from '../middleware/auth-middleware.js';

/**
 * Get user conversations
 */
export async function getUserConversations(c) {
  try {
    const user = c.get('user');
    
    // Get conversations from database where the user is either user_id_1 or user_id_2
    // Using a simpler query without joins to avoid foreign key relationship issues
    const { data, error } = await supabase
      .from('conversations')
      .select('id, created_at, updated_at, user_id_1, user_id_2, last_message_text, last_message_at')
      .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`)
      .order('last_message_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching conversations:', error);
      return c.json({ error: 'Failed to fetch conversations' }, 500);
    }
    
    // If no conversations found, return empty array
    if (!data || data.length === 0) {
      return c.json([]);
    }
    
    // Get all unique user IDs from the conversations
    const userIds = new Set();
    data.forEach(conversation => {
      // Add the other user's ID (not the current user)
      if (conversation.user_id_1 === user.id) {
        userIds.add(conversation.user_id_2);
      } else {
        userIds.add(conversation.user_id_1);
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
    
    // Create a map of user profiles for easy lookup
    const profileMap = {};
    userProfiles.forEach(profile => {
      profileMap[profile.id] = profile;
    });
    
    // Process data to format it for the client
    const formattedConversations = data.map(conversation => {
      // Determine which user ID is the other user (not the current user)
      const otherUserId = conversation.user_id_1 === user.id ? conversation.user_id_2 : conversation.user_id_1;
      const otherUserProfile = profileMap[otherUserId] || { id: otherUserId };
      
      return {
        id: conversation.id,
        created_at: conversation.created_at,
        updated_at: conversation.updated_at,
        last_message: conversation.last_message_text,
        last_message_at: conversation.last_message_at,
        other_user: otherUserProfile
      };
    });
    
    // Return conversations data
    return c.json(formattedConversations || []);
  } catch (error) {
    console.error('Error in getUserConversations:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
}

/**
 * Get conversation messages
 */
export async function getConversationMessages(c) {
  try {
    const user = c.get('user');
    const conversationId = c.req.param('id');
    const { limit = 50, offset = 0 } = c.req.query();
    
    // Check if the user is a participant in this conversation
    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .select('user_id_1, user_id_2')
      .eq('id', conversationId)
      .single();
    
    if (conversationError) {
      console.error('Error fetching conversation:', conversationError);
      return c.json({ error: 'Failed to fetch conversation' }, 500);
    }
    
    if (!conversation) {
      return c.json({ error: 'Conversation not found' }, 404);
    }
    
    // Security check: users can only access conversations they are a part of
    if (conversation.user_id_1 !== user.id && conversation.user_id_2 !== user.id) {
      return c.json({ error: 'Unauthorized access to conversation' }, 403);
    }
    
    // Get messages from database
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select(`
        id,
        created_at,
        sender_id,
        content,
        read,
        profile:sender_id (
          id,
          first_name,
          last_name,
          avatar_url
        )
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      return c.json({ error: 'Failed to fetch messages' }, 500);
    }
    
    // Mark unread messages as read if the user is the recipient
    const unreadMessages = messages.filter(
      message => message.sender_id !== user.id && !message.read
    );
    
    if (unreadMessages.length > 0) {
      const unreadIds = unreadMessages.map(message => message.id);
      
      const { error: updateError } = await supabase
        .from('messages')
        .update({ read: true })
        .in('id', unreadIds);
      
      if (updateError) {
        console.error('Error marking messages as read:', updateError);
        // Continue anyway, this is not critical
      }
    }
    
    // Return messages data
    return c.json(messages || []);
  } catch (error) {
    console.error('Error in getConversationMessages:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
}

/**
 * Send a message in a conversation
 */
export async function sendMessage(c) {
  try {
    const user = c.get('user');
    const conversationId = c.req.param('id');
    const { content } = await c.req.json();
    
    if (!content || content.trim() === '') {
      return c.json({ error: 'Message content is required' }, 400);
    }
    
    // Check if the user is a participant in this conversation
    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .select('user_id_1, user_id_2')
      .eq('id', conversationId)
      .single();
    
    if (conversationError) {
      console.error('Error fetching conversation:', conversationError);
      return c.json({ error: 'Failed to fetch conversation' }, 500);
    }
    
    if (!conversation) {
      return c.json({ error: 'Conversation not found' }, 404);
    }
    
    // Security check: users can only send messages in conversations they are a part of
    if (conversation.user_id_1 !== user.id && conversation.user_id_2 !== user.id) {
      return c.json({ error: 'Unauthorized access to conversation' }, 403);
    }
    
    // Insert the new message
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: content,
        read: false
      })
      .select()
      .single();
    
    if (messageError) {
      console.error('Error sending message:', messageError);
      return c.json({ error: 'Failed to send message' }, 500);
    }
    
    // Update the conversation's last message and timestamp
    // This is handled by a database trigger, so we don't need to do it here
    
    // Create a notification for the recipient
    const recipientId = conversation.user_id_1 === user.id ? conversation.user_id_2 : conversation.user_id_1;
    await createMessageNotification(user.id, recipientId, content);
    
    // Return the new message
    return c.json(message);
  } catch (error) {
    console.error('Error in sendMessage:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
}

/**
 * Create a new conversation
 */
export async function createConversation(c) {
  try {
    const user = c.get('user');
    const { participant_id } = await c.req.json();
    
    if (!participant_id) {
      return c.json({ error: 'Participant ID is required' }, 400);
    }
    
    // Check if a conversation already exists between these users
    const { data: existingConversation, error: checkError } = await supabase
      .from('conversations')
      .select('id')
      .or(`and(user_id_1.eq.${user.id},user_id_2.eq.${participant_id}),and(user_id_1.eq.${participant_id},user_id_2.eq.${user.id})`)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Error checking for existing conversation:', checkError);
      return c.json({ error: 'Failed to check for existing conversation' }, 500);
    }
    
    // If a conversation already exists, return it
    if (existingConversation) {
      return c.json({ id: existingConversation.id, already_exists: true });
    }
    
    // Create a new conversation
    const { data: conversation, error: createError } = await supabase
      .from('conversations')
      .insert({
        user_id_1: user.id,
        user_id_2: participant_id
      })
      .select()
      .single();
    
    if (createError) {
      console.error('Error creating conversation:', createError);
      return c.json({ error: 'Failed to create conversation' }, 500);
    }
    
    // Return the new conversation
    return c.json({ ...conversation, already_exists: false });
  } catch (error) {
    console.error('Error in createConversation:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
}

/**
 * Create a notification for a new message
 */
async function createMessageNotification(senderId, recipientId, messageContent) {
  try {
    // Get the sender's name
    const { data: sender } = await supabase
      .from('users')
      .select('first_name')
      .eq('id', senderId)
      .single();
    
    // Create the notification
    await supabase
      .from('notifications')
      .insert({
        user_id: recipientId,
        type: 'message',
        title: 'New Message',
        message: `${sender?.first_name || 'Someone'} sent you a message: "${messageContent.substring(0, 30)}${messageContent.length > 30 ? '...' : ''}"`,
        read: false
      });
  } catch (error) {
    console.error('Error creating message notification:', error);
  }
}

// Export conversation routes
export const conversationRoutes = [
  {
    method: 'GET',
    path: '/api/conversations',
    handler: getUserConversations,
    middleware: [authMiddleware]
  },
  {
    method: 'GET',
    path: '/api/conversations/:id/messages',
    handler: getConversationMessages,
    middleware: [authMiddleware]
  },
  {
    method: 'POST',
    path: '/api/conversations/:id/messages',
    handler: sendMessage,
    middleware: [authMiddleware]
  },
  {
    method: 'POST',
    path: '/api/conversations',
    handler: createConversation,
    middleware: [authMiddleware]
  }
];
