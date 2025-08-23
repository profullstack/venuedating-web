/**
 * BarCrush Message Search Utilities
 * 
 * Handles searching through messages in conversations
 */

import { supabaseClientPromise } from '../supabase-client.js';
import { getCurrentUser } from '../supabase-client.js';

/**
 * Search for messages in a specific conversation
 * @param {string} conversationId - ID of the conversation to search in
 * @param {string} query - Search query
 * @param {Object} options - Search options
 * @returns {Promise<Array>} Array of matching messages
 */
export async function searchConversationMessages(conversationId, query, options = { limit: 20, offset: 0 }) {
  try {
    if (!query || query.trim().length < 2) {
      return [];
    }
    
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');
    
    const supabase = await supabaseClientPromise;
    
    // Search for messages containing the query
    const { data, error } = await supabase
      .from('messages')
      .select(`
        id,
        conversation_id,
        sender_id,
        message_type,
        content,
        attachment_url,
        metadata,
        created_at,
        is_read,
        read_at,
        status,
        profiles:sender_id (display_name, avatar_url)
      `)
      .eq('conversation_id', conversationId)
      .ilike('content', `%${query}%`)
      .order('created_at', { ascending: false })
      .range(options.offset, options.offset + options.limit - 1);
    
    if (error) throw error;
    
    // Transform messages to add a "fromCurrentUser" flag
    return data.map(message => ({
      ...message,
      fromCurrentUser: message.sender_id === user.id
    }));
  } catch (error) {
    console.error('Error searching conversation messages:', error);
    return [];
  }
}

/**
 * Search for messages across all user conversations
 * @param {string} query - Search query
 * @param {Object} options - Search options
 * @returns {Promise<Array>} Array of matching messages with conversation details
 */
export async function searchAllMessages(query, options = { limit: 20, offset: 0 }) {
  try {
    if (!query || query.trim().length < 2) {
      return [];
    }
    
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');
    
    const supabase = await supabaseClientPromise;
    
    // First get all conversations the user is part of
    const { data: conversations, error: convoError } = await supabase
      .from('conversations')
      .select('id')
      .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`)
      .eq('is_active', true);
    
    if (convoError) throw convoError;
    
    if (!conversations || conversations.length === 0) {
      return [];
    }
    
    // Get conversation IDs
    const conversationIds = conversations.map(c => c.id);
    
    // Search for messages in these conversations
    const { data, error } = await supabase
      .from('messages')
      .select(`
        id,
        conversation_id,
        sender_id,
        message_type,
        content,
        attachment_url,
        metadata,
        created_at,
        is_read,
        read_at,
        status,
        profiles:sender_id (display_name, avatar_url),
        conversations:conversation_id (
          user_id_1, 
          user_id_2,
          profile1:user_id_1 (id, display_name, avatar_url),
          profile2:user_id_2 (id, display_name, avatar_url)
        )
      `)
      .in('conversation_id', conversationIds)
      .ilike('content', `%${query}%`)
      .order('created_at', { ascending: false })
      .range(options.offset, options.offset + options.limit - 1);
    
    if (error) throw error;
    
    // Transform messages to add conversation details and fromCurrentUser flag
    return data.map(message => {
      const conversation = message.conversations;
      const isUser1 = conversation.user_id_1 === user.id;
      const otherUser = isUser1 ? conversation.profile2 : conversation.profile1;
      
      return {
        ...message,
        fromCurrentUser: message.sender_id === user.id,
        otherUser
      };
    });
  } catch (error) {
    console.error('Error searching all messages:', error);
    return [];
  }
}

/**
 * Highlight search terms in text
 * @param {string} text - Original text
 * @param {string} query - Search query to highlight
 * @returns {string} HTML with highlighted text
 */
export function highlightSearchTerms(text, query) {
  if (!query || !text) return text;
  
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedQuery})`, 'gi');
  
  return text.replace(regex, '<mark>$1</mark>');
}

/**
 * Create search result element
 * @param {Object} message - Message object
 * @param {string} query - Search query
 * @param {Function} onClick - Click handler
 * @returns {HTMLElement} Search result element
 */
export function createSearchResultElement(message, query, onClick) {
  const element = document.createElement('div');
  element.className = 'search-result-item';
  element.dataset.messageId = message.id;
  element.dataset.conversationId = message.conversation_id;
  
  // Highlight the search term in the message content
  const highlightedContent = highlightSearchTerms(message.content, query);
  
  // Create the HTML structure
  element.innerHTML = `
    <div class="search-result-avatar">
      <img src="${message.profiles.avatar_url || '/images/default-avatar.png'}" alt="${message.profiles.display_name}">
    </div>
    <div class="search-result-content">
      <div class="search-result-header">
        <span class="search-result-name">${message.profiles.display_name}</span>
        <span class="search-result-time">${formatMessageTime(message.created_at)}</span>
      </div>
      <div class="search-result-message">${highlightedContent}</div>
      ${message.otherUser ? `
        <div class="search-result-conversation">
          <small>Conversation with ${message.otherUser.display_name}</small>
        </div>
      ` : ''}
    </div>
  `;
  
  // Add click handler
  if (onClick) {
    element.addEventListener('click', () => onClick(message));
  }
  
  return element;
}

/**
 * Format message time for display
 * @param {string} timestamp - ISO timestamp
 * @returns {string} Formatted time
 */
function formatMessageTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    // Today - show time
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays === 1) {
    // Yesterday
    return 'Yesterday';
  } else if (diffDays < 7) {
    // This week - show day name
    return date.toLocaleDateString([], { weekday: 'short' });
  } else {
    // Older - show date
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
}

/**
 * Initialize search functionality in a conversation
 * @param {string} conversationId - ID of the conversation
 * @param {HTMLElement} searchInput - Search input element
 * @param {HTMLElement} resultsContainer - Container for search results
 * @param {Function} onResultClick - Callback when a result is clicked
 */
export function initializeConversationSearch(conversationId, searchInput, resultsContainer, onResultClick) {
  let searchTimeout;
  
  searchInput.addEventListener('input', () => {
    const query = searchInput.value.trim();
    
    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // Clear results if query is too short
    if (query.length < 2) {
      resultsContainer.innerHTML = '';
      resultsContainer.classList.remove('active');
      return;
    }
    
    // Set timeout to avoid too many requests
    searchTimeout = setTimeout(async () => {
      // Show loading indicator
      resultsContainer.innerHTML = '<div class="search-loading">Searching...</div>';
      resultsContainer.classList.add('active');
      
      // Perform search
      const results = await searchConversationMessages(conversationId, query);
      
      // Display results
      resultsContainer.innerHTML = '';
      
      if (results.length === 0) {
        resultsContainer.innerHTML = '<div class="search-no-results">No messages found</div>';
      } else {
        results.forEach(message => {
          const resultElement = createSearchResultElement(message, query, onResultClick);
          resultsContainer.appendChild(resultElement);
        });
      }
    }, 300);
  });
  
  // Clear search when input is cleared
  searchInput.addEventListener('search', () => {
    if (searchInput.value.trim() === '') {
      resultsContainer.innerHTML = '';
      resultsContainer.classList.remove('active');
    }
  });
}
