/**
 * BarCrush Enhanced Chat Controller
 * 
 * Enhanced version of the chat controller with:
 * - Real-time message updates using Supabase subscriptions
 * - Typing indicators
 * - Message reactions
 * - Message delivery status indicators
 * - Advanced message search
 */

import { getConversations, createConversation, markAsRead } from './api/conversations.js';
import { getCurrentUser } from './supabase-client.js';
import { formatRelativeTime } from './utils/date-utils.js';
import { 
  initializeUnreadTracking, 
  markConversationAsRead, 
  refreshUnreadCount,
  getConversationUnreadCount 
} from './utils/unread-messages.js';

// Import enhanced chat features
import { 
  subscribeToMessages, 
  subscribeToTypingIndicators,
  sendTypingIndicator,
  unsubscribeFromConversation,
  getTypingUsers,
  isAnyoneTyping
} from './utils/realtime-chat.js';

import {
  addReaction,
  getMessageReactions,
  createReactionElements,
  AVAILABLE_REACTIONS,
  subscribeToReactions
} from './utils/message-reactions.js';

import {
  updateMessageStatus,
  markMessageAsDelivered,
  markMessageAsRead,
  markAllMessagesAsRead,
  MESSAGE_STATUS,
  createStatusIndicator,
  updateStatusIndicator
} from './utils/message-status.js';

import {
  searchConversationMessages,
  searchAllMessages,
  highlightSearchTerms,
  createSearchResultElement,
  initializeConversationSearch
} from './utils/message-search.js';

// Store for conversation data
let userConversations = [];
let filteredConversations = [];
let activeSubscriptions = new Map();

/**
 * Initialize the chat page
 */
async function initChat() {
  try {
    // Get the user - using local storage auth first as per app standards
    const userDataStr = localStorage.getItem('barcrush_user');
    let user;
    
    if (userDataStr) {
      try {
        user = JSON.parse(userDataStr);
        if (!user || !user.id) {
          user = await getCurrentUser();
        }
      } catch (e) {
        user = await getCurrentUser();
      }
    } else {
      user = await getCurrentUser();
    }
    
    if (!user) {
      console.error('User not authenticated');
      window.location.href = '/auth';
      return;
    }

    // Load CSS for enhanced chat features
    loadEnhancedChatStyles();

    // Set up UI event listeners
    setupEventListeners();
    
    // Check if we should open a specific conversation
    await handleDirectConversationNavigation();
    
    console.log('💬 Enhanced chat page initialized');
  
    // Initialize unread message tracking
    await initializeUnreadTracking();
  
    // Load conversations
    await loadConversations();
  } catch (error) {
    console.error('Error initializing chat page:', error);
  }
}

/**
 * Load enhanced chat styles
 */
function loadEnhancedChatStyles() {
  // Check if styles are already loaded
  if (!document.querySelector('link[href="/css/enhanced-chat.css"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/css/enhanced-chat.css';
    document.head.appendChild(link);
  }
}

/**
 * Handle direct navigation to a specific conversation
 */
async function handleDirectConversationNavigation() {
  try {
    // Check for conversation ID in URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const conversationId = urlParams.get('conversation');
    
    if (conversationId) {
      console.log('🎥 Direct navigation to conversation:', conversationId);
      
      // Find the conversation in our loaded conversations
      const conversation = userConversations.find(conv => conv.id === conversationId);
      
      if (conversation) {
        console.log('✅ Found conversation, opening chat...');
        await openConversation(conversation);
        
        // Clear the URL parameter to clean up the URL
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      } else {
        console.warn('⚠️ Conversation not found in user\'s conversations:', conversationId);
        // The conversation might be new or not loaded yet
        try {
          const { getConversationById } = await import('./api/conversations.js');
          const directConversation = await getConversationById(conversationId);
          
          if (directConversation) {
            console.log('✅ Found conversation via direct fetch, opening chat...');
            await openConversation(directConversation);
            
            // Clear the URL parameter
            const newUrl = window.location.pathname;
            window.history.replaceState({}, '', newUrl);
          }
        } catch (fetchError) {
          console.error('❌ Error fetching conversation directly:', fetchError);
          alert('Sorry, we couldn\'t find that conversation. It may have been deleted.');
        }
      }
    }
  } catch (error) {
    console.error('❌ Error handling direct conversation navigation:', error);
  }
}

/**
 * Open a conversation (either in modal or navigate to conversation page)
 * @param {Object} conversation - The conversation to open
 */
async function openConversation(conversation) {
  try {
    console.log('💬 Opening conversation with:', conversation.otherUser?.display_name);
    
    // Check if we have a conversation modal in the current page
    const conversationModal = document.querySelector('.conversation-modal');
    
    if (conversationModal) {
      // We're on the chat page with a modal - show the modal
      console.log('📱 Opening conversation in modal...');
      
      // Update modal with conversation data
      updateConversationModal(conversation);
      
      // Load and display messages for this conversation
      await loadConversationMessages(conversation.id);
      
      // Show the modal
      conversationModal.style.display = 'flex';
      
      // Mark conversation as read when opened
      await markConversationAsRead(conversation.id);
      await markAsRead(conversation.id);
      await markAllMessagesAsRead(conversation.id);
      
      // Subscribe to real-time updates for this conversation
      subscribeToConversationUpdates(conversation.id);
      
      // Initialize message search for this conversation
      initializeMessageSearch(conversation.id);
    } else {
      // Navigate to dedicated conversation page
      console.log('🚀 Navigating to conversation page...');
      
      if (window.router && window.router.navigate) {
        window.router.navigate(`/conversation?id=${conversation.id}`);
      } else {
        window.location.href = `/conversation?id=${conversation.id}`;
      }
    }
  } catch (error) {
    console.error('❌ Error opening conversation:', error);
    alert('Sorry, there was an error opening the conversation. Please try again.');
  }
}

/**
 * Subscribe to real-time updates for a conversation
 * @param {string} conversationId - The conversation ID
 */
async function subscribeToConversationUpdates(conversationId) {
  try {
    // Unsubscribe from any previous subscriptions
    if (activeSubscriptions.has(conversationId)) {
      await unsubscribeFromConversation(conversationId);
      activeSubscriptions.delete(conversationId);
    }
    
    // Subscribe to new messages
    const messageSubscription = await subscribeToMessages(
      conversationId,
      handleNewMessage,
      handleMessageUpdate,
      handleMessageDelete
    );
    
    // Subscribe to typing indicators
    await subscribeToTypingIndicators(conversationId, (typingUsers) => {
      updateTypingIndicator(typingUsers);
    });
    
    // Subscribe to message reactions
    await subscribeToReactions(conversationId, (reaction) => {
      updateMessageReaction(reaction);
    });
    
    activeSubscriptions.set(conversationId, messageSubscription);
    
    console.log('🔔 Subscribed to real-time updates for conversation:', conversationId);
  } catch (error) {
    console.error('❌ Error subscribing to conversation updates:', error);
  }
}

/**
 * Handle new message from subscription
 * @param {Object} message - New message data
 */
async function handleNewMessage(message) {
  try {
    // Find the messages container
    const messagesContainer = document.querySelector('.conversation-modal .messages-container');
    if (!messagesContainer) return;
    
    // Create message element
    const messageElement = createMessageElement(message);
    messageElement.classList.add('message-new');
    
    // Add to container
    messagesContainer.appendChild(messageElement);
    
    // Scroll to bottom
    scrollToBottom(messagesContainer);
    
    // Play notification sound if message is from other user
    if (!message.fromCurrentUser) {
      playMessageSound();
      
      // Mark as delivered
      await markMessageAsDelivered(message.id);
      
      // If the conversation is visible, mark as read
      if (isConversationVisible()) {
        await markMessageAsRead(message.id);
      }
    }
  } catch (error) {
    console.error('❌ Error handling new message:', error);
  }
}

/**
 * Handle message update from subscription
 * @param {Object} message - Updated message data
 */
function handleMessageUpdate(message) {
  try {
    // Find the message element
    const messageElement = document.querySelector(`.message[data-message-id="${message.id}"]`);
    if (!messageElement) return;
    
    // Update content if needed
    const contentElement = messageElement.querySelector('.message-content p');
    if (contentElement && message.content) {
      contentElement.textContent = message.content;
    }
    
    // Update status indicator
    if (message.status) {
      updateStatusIndicator(message.id, message.status);
    }
  } catch (error) {
    console.error('❌ Error handling message update:', error);
  }
}

/**
 * Handle message deletion from subscription
 * @param {string} messageId - ID of deleted message
 */
function handleMessageDelete(messageId) {
  try {
    // Find the message element
    const messageElement = document.querySelector(`.message[data-message-id="${messageId}"]`);
    if (!messageElement) return;
    
    // Add deleted class for animation
    messageElement.classList.add('message-deleted');
    
    // Remove after animation
    setTimeout(() => {
      messageElement.remove();
    }, 300);
  } catch (error) {
    console.error('❌ Error handling message deletion:', error);
  }
}

/**
 * Update the typing indicator based on who is typing
 * @param {Array} typingUsers - List of users who are currently typing
 */
function updateTypingIndicator(typingUsers) {
  try {
    const typingIndicator = document.querySelector('.typing-indicator');
    if (!typingIndicator) return;
    
    if (typingUsers && typingUsers.length > 0) {
      // Format the typing message
      let typingMessage = '';
      
      if (typingUsers.length === 1) {
        typingMessage = `${typingUsers[0].display_name || 'Someone'} is typing...`;
      } else if (typingUsers.length === 2) {
        typingMessage = `${typingUsers[0].display_name} and ${typingUsers[1].display_name} are typing...`;
      } else {
        typingMessage = 'Several people are typing...';
      }
      
      // Update and show the indicator
      typingIndicator.textContent = typingMessage;
      typingIndicator.classList.add('active');
    } else {
      // Hide the indicator
      typingIndicator.classList.remove('active');
      typingIndicator.textContent = '';
    }
  } catch (error) {
    console.error('❌ Error updating typing indicator:', error);
  }
}

/**
 * Update message reaction UI
 * @param {Object} reaction - Reaction data
 */
function updateMessageReaction(reaction) {
  try {
    // Find the message element
    const messageElement = document.querySelector(`.message[data-message-id="${reaction.message_id}"]`);
    if (!messageElement) return;
    
    // Find or create reactions container
    let reactionsContainer = messageElement.querySelector('.message-reactions');
    if (!reactionsContainer) {
      reactionsContainer = document.createElement('div');
      reactionsContainer.className = 'message-reactions';
      messageElement.appendChild(reactionsContainer);
    }
    
    // Check if this reaction already exists
    const existingReaction = reactionsContainer.querySelector(`.reaction-${reaction.reaction_type}[data-user-id="${reaction.user_id}"]`);
    
    if (reaction.deleted) {
      // Remove the reaction if it exists
      if (existingReaction) {
        existingReaction.remove();
        
        // Check if reactions container is now empty
        if (reactionsContainer.children.length === 0) {
          reactionsContainer.remove();
        }
      }
    } else {
      // Add or update the reaction
      if (!existingReaction) {
        const reactionElement = document.createElement('span');
        reactionElement.className = `message-reaction reaction-${reaction.reaction_type}`;
        reactionElement.setAttribute('data-user-id', reaction.user_id);
        reactionElement.setAttribute('data-reaction-type', reaction.reaction_type);
        reactionElement.textContent = AVAILABLE_REACTIONS[reaction.reaction_type] || '👍';
        
        // Add tooltip with user name
        if (reaction.user_name) {
          reactionElement.setAttribute('title', `${reaction.user_name}`);
        }
        
        reactionsContainer.appendChild(reactionElement);
      }
    }
  } catch (error) {
    console.error('❌ Error updating message reaction:', error);
  }
}

/**
 * Initialize message search for a conversation
 * @param {string} conversationId - The conversation ID
 */
function initializeMessageSearch(conversationId) {
  try {
    // Get search UI elements
    const searchButton = document.querySelector('.conversation-modal .search-button');
    const searchContainer = document.querySelector('.conversation-modal .search-container');
    const searchInput = document.querySelector('.conversation-modal .search-input');
    const searchResults = document.querySelector('.conversation-modal .search-results');
    const closeSearchButton = document.querySelector('.conversation-modal .close-search-button');
    
    if (!searchButton || !searchContainer || !searchInput || !searchResults || !closeSearchButton) {
      console.warn('⚠️ Search UI elements not found, creating them...');
      createSearchUI();
      return;
    }
    
    // Set up search button click handler
    searchButton.addEventListener('click', () => {
      searchContainer.classList.toggle('active');
      if (searchContainer.classList.contains('active')) {
        searchInput.focus();
      } else {
        // Clear search results when closing
        searchResults.innerHTML = '';
        searchInput.value = '';
        
        // Remove highlights from messages
        const highlightedElements = document.querySelectorAll('.highlight');
        highlightedElements.forEach(el => {
          el.outerHTML = el.innerHTML;
        });
      }
    });
    
    // Set up close search button
    closeSearchButton.addEventListener('click', () => {
      searchContainer.classList.remove('active');
      searchResults.innerHTML = '';
      searchInput.value = '';
      
      // Remove highlights
      const highlightedElements = document.querySelectorAll('.highlight');
      highlightedElements.forEach(el => {
        el.outerHTML = el.innerHTML;
      });
    });
    
    // Set up search input handler
    searchInput.addEventListener('input', debounce(async () => {
      const searchTerm = searchInput.value.trim();
      
      if (searchTerm.length < 2) {
        searchResults.innerHTML = '';
        return;
      }
      
      // Search for messages
      const results = await searchConversationMessages(conversationId, searchTerm);
      
      // Display results
      displaySearchResults(results, searchTerm);
    }, 300));
    
    console.log('🔍 Message search initialized for conversation:', conversationId);
  } catch (error) {
    console.error('❌ Error initializing message search:', error);
  }
}

/**
 * Display search results
 * @param {Array} results - Search results
 * @param {string} searchTerm - Search term
 */
function displaySearchResults(results, searchTerm) {
  try {
    const searchResults = document.querySelector('.conversation-modal .search-results');
    if (!searchResults) return;
    
    // Clear previous results
    searchResults.innerHTML = '';
    
    if (results.length === 0) {
      const noResults = document.createElement('div');
      noResults.className = 'no-results';
      noResults.textContent = 'No messages found';
      searchResults.appendChild(noResults);
      return;
    }
    
    // Create results list
    results.forEach(message => {
      const resultElement = createSearchResultElement(message, searchTerm);
      
      // Add click handler to scroll to message
      resultElement.addEventListener('click', () => {
        // Find the message in the DOM
        const messageElement = document.querySelector(`.message[data-message-id="${message.id}"]`);
        if (messageElement) {
          // Highlight the message
          messageElement.classList.add('highlighted-message');
          
          // Highlight search terms in the message
          const contentElement = messageElement.querySelector('.message-content p');
          if (contentElement) {
            contentElement.innerHTML = highlightSearchTerms(contentElement.textContent, searchTerm);
          }
          
          // Scroll to the message
          messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          
          // Remove highlight after a delay
          setTimeout(() => {
            messageElement.classList.remove('highlighted-message');
          }, 3000);
        }
      });
      
      searchResults.appendChild(resultElement);
    });
  } catch (error) {
    console.error('❌ Error displaying search results:', error);
  }
}

/**
 * Create search UI elements if they don't exist
 */
function createSearchUI() {
  try {
    const conversationModal = document.querySelector('.conversation-modal');
    if (!conversationModal) return;
    
    // Check if header exists
    let modalHeader = conversationModal.querySelector('.modal-header');
    if (!modalHeader) {
      modalHeader = document.createElement('div');
      modalHeader.className = 'modal-header';
      conversationModal.prepend(modalHeader);
    }
    
    // Add search button to header if it doesn't exist
    if (!modalHeader.querySelector('.search-button')) {
      const searchButton = document.createElement('button');
      searchButton.className = 'search-button';
      searchButton.innerHTML = '<i class="fas fa-search"></i>';
      searchButton.setAttribute('title', 'Search conversation');
      modalHeader.appendChild(searchButton);
    }
    
    // Create search container if it doesn't exist
    if (!conversationModal.querySelector('.search-container')) {
      const searchContainer = document.createElement('div');
      searchContainer.className = 'search-container';
      searchContainer.innerHTML = `
        <div class="search-input-wrapper">
          <input type="text" class="search-input" placeholder="Search in conversation...">
          <button class="close-search-button"><i class="fas fa-times"></i></button>
        </div>
        <div class="search-results"></div>
      `;
      conversationModal.insertBefore(searchContainer, conversationModal.querySelector('.messages-container'));
    }
    
    // Initialize the search functionality
    const currentConversationId = conversationModal.getAttribute('data-conversation-id');
    if (currentConversationId) {
      initializeMessageSearch(currentConversationId);
    }
  } catch (error) {
    console.error('❌ Error creating search UI:', error);
  }
}

/**
 * Load conversations for the current user
 */
async function loadConversations() {
  try {
    const conversationsContainer = document.querySelector('.conversations-list');
    if (!conversationsContainer) {
      console.error('❌ Conversations container not found');
      return;
    }
    
    // Show loading state
    conversationsContainer.innerHTML = '<div class="loading-conversations">Loading conversations...</div>';
    
    // Get conversations
    const conversations = await getConversations();
    
    if (!conversations || conversations.length === 0) {
      conversationsContainer.innerHTML = '<div class="no-conversations">No conversations yet</div>';
      return;
    }
    
    // Store conversations
    userConversations = conversations;
    filteredConversations = [...conversations];
    
    // Render conversations
    renderConversations(filteredConversations);
    
    console.log('💬 Loaded', conversations.length, 'conversations');
  } catch (error) {
    console.error('❌ Error loading conversations:', error);
    const conversationsContainer = document.querySelector('.conversations-list');
    if (conversationsContainer) {
      conversationsContainer.innerHTML = '<div class="error-message">Error loading conversations</div>';
    }
  }
}

/**
 * Render conversations in the list
 * @param {Array} conversations - List of conversations to render
 */
function renderConversations(conversations) {
  try {
    const conversationsContainer = document.querySelector('.conversations-list');
    if (!conversationsContainer) return;
    
    // Clear container
    conversationsContainer.innerHTML = '';
    
    if (!conversations || conversations.length === 0) {
      conversationsContainer.innerHTML = '<div class="no-conversations">No conversations found</div>';
      return;
    }
    
    // Sort conversations by last message time
    const sortedConversations = [...conversations].sort((a, b) => {
      const timeA = a.last_message_time ? new Date(a.last_message_time) : new Date(0);
      const timeB = b.last_message_time ? new Date(b.last_message_time) : new Date(0);
      return timeB - timeA;
    });
    
    // Create conversation elements
    sortedConversations.forEach(conversation => {
      const conversationElement = createConversationElement(conversation);
      conversationsContainer.appendChild(conversationElement);
    });
  } catch (error) {
    console.error('❌ Error rendering conversations:', error);
  }
}

/**
 * Create a conversation list item element
 * @param {Object} conversation - Conversation data
 * @returns {HTMLElement} - Conversation element
 */
function createConversationElement(conversation) {
  try {
    const conversationElement = document.createElement('div');
    conversationElement.className = 'conversation-item';
    conversationElement.setAttribute('data-conversation-id', conversation.id);
    
    // Get other user info
    const otherUser = conversation.otherUser || {};
    
    // Get unread count
    const unreadCount = getConversationUnreadCount(conversation.id) || 0;
    
    // Format last message time
    const lastMessageTime = conversation.last_message_time 
      ? formatRelativeTime(new Date(conversation.last_message_time)) 
      : '';
    
    // Create HTML structure
    conversationElement.innerHTML = `
      <div class="conversation-avatar">
        <img src="${otherUser.avatar_url || '/images/default-avatar.png'}" alt="${otherUser.display_name || 'User'}" onerror="this.src='/images/default-avatar.png'">
        ${otherUser.online ? '<span class="online-indicator"></span>' : ''}
      </div>
      <div class="conversation-details">
        <div class="conversation-header">
          <h4 class="user-name">${otherUser.display_name || 'Unknown User'}</h4>
          <span class="last-message-time">${lastMessageTime}</span>
        </div>
        <div class="conversation-preview">
          <p class="last-message">${conversation.last_message || 'No messages yet'}</p>
          ${unreadCount > 0 ? `<span class="unread-badge">${unreadCount}</span>` : ''}
        </div>
      </div>
    `;
    
    // Add click handler to open conversation
    conversationElement.addEventListener('click', async () => {
      await openConversation(conversation);
    });
    
    return conversationElement;
  } catch (error) {
    console.error('❌ Error creating conversation element:', error);
    
    // Return a fallback element
    const fallbackElement = document.createElement('div');
    fallbackElement.className = 'conversation-item error';
    fallbackElement.textContent = 'Error loading conversation';
    return fallbackElement;
  }
}

/**
 * Update conversation modal with conversation data
 * @param {Object} conversation - Conversation data
 */
function updateConversationModal(conversation) {
  try {
    const modal = document.querySelector('.conversation-modal');
    if (!modal) return;
    
    // Set conversation ID
    modal.setAttribute('data-conversation-id', conversation.id);
    
    // Update header
    const modalHeader = modal.querySelector('.modal-header') || document.createElement('div');
    if (!modalHeader.classList.contains('modal-header')) {
      modalHeader.className = 'modal-header';
      modal.prepend(modalHeader);
    }
    
    // Update user info in header
    const otherUser = conversation.otherUser || {};
    modalHeader.innerHTML = `
      <div class="user-info">
        <div class="user-avatar">
          <img src="${otherUser.avatar_url || '/images/default-avatar.png'}" alt="${otherUser.display_name || 'User'}" onerror="this.src='/images/default-avatar.png'">
          ${otherUser.online ? '<span class="online-indicator"></span>' : ''}
        </div>
        <div class="user-details">
          <h3>${otherUser.display_name || 'Unknown User'}</h3>
          <span class="user-status">${otherUser.online ? 'Online' : 'Offline'}</span>
        </div>
      </div>
      <div class="modal-actions">
        <button class="search-button" title="Search in conversation"><i class="fas fa-search"></i></button>
        <button class="close-modal" title="Close conversation"><i class="fas fa-times"></i></button>
      </div>
    `;
    
    // Set up close button
    const closeButton = modalHeader.querySelector('.close-modal');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        modal.style.display = 'none';
        
        // Unsubscribe from conversation updates
        if (activeSubscriptions.has(conversation.id)) {
          unsubscribeFromConversation(conversation.id);
          activeSubscriptions.delete(conversation.id);
        }
      });
    }
    
    // Create or update typing indicator
    let typingIndicator = modal.querySelector('.typing-indicator');
    if (!typingIndicator) {
      typingIndicator = document.createElement('div');
      typingIndicator.className = 'typing-indicator';
      
      // Insert before the message input
      const messageInput = modal.querySelector('.message-input-container');
      if (messageInput) {
        modal.insertBefore(typingIndicator, messageInput);
      } else {
        modal.appendChild(typingIndicator);
      }
    }
  } catch (error) {
    console.error('❌ Error updating conversation modal:', error);
  }
}

/**
 * Load messages for a conversation
 * @param {string} conversationId - The conversation ID
 */
async function loadConversationMessages(conversationId) {
  try {
    const messagesContainer = document.querySelector('.conversation-modal .messages-container');
    if (!messagesContainer) {
      console.error('❌ Messages container not found');
      return;
    }
    
    // Show loading state
    messagesContainer.innerHTML = '<div class="loading-messages">Loading messages...</div>';
    
    // Import messages API
    const { getMessages } = await import('./api/messages.js');
    
    // Get messages
    const messages = await getMessages(conversationId);
    
    if (!messages || messages.length === 0) {
      messagesContainer.innerHTML = '<div class="no-messages">No messages yet</div>';
      return;
    }
    
    // Clear container
    messagesContainer.innerHTML = '';
    
    // Group messages by date
    const messagesByDate = groupMessagesByDate(messages);
    
    // Render message groups
    Object.entries(messagesByDate).forEach(([date, dateMessages]) => {
      // Add date separator
      const dateSeparator = document.createElement('div');
      dateSeparator.className = 'date-separator';
      dateSeparator.textContent = date;
      messagesContainer.appendChild(dateSeparator);
      
      // Add messages for this date
      dateMessages.forEach(message => {
        const messageElement = createMessageElement(message);
        messagesContainer.appendChild(messageElement);
      });
    });
    
    // Scroll to bottom
    scrollToBottom(messagesContainer);
    
    // Mark all messages as read
    await markAllMessagesAsRead(conversationId);
    
    console.log('💬 Loaded', messages.length, 'messages for conversation:', conversationId);
  } catch (error) {
    console.error('❌ Error loading conversation messages:', error);
    
    const messagesContainer = document.querySelector('.conversation-modal .messages-container');
    if (messagesContainer) {
      messagesContainer.innerHTML = '<div class="error-message">Error loading messages</div>';
    }
  }
}

/**
 * Group messages by date
 * @param {Array} messages - List of messages
 * @returns {Object} - Messages grouped by date
 */
function groupMessagesByDate(messages) {
  const groups = {};
  
  messages.forEach(message => {
    const messageDate = new Date(message.created_at);
    const dateKey = formatMessageDate(messageDate);
    
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    
    groups[dateKey].push(message);
  });
  
  return groups;
}

/**
 * Format message date for grouping
 * @param {Date} date - Message date
 * @returns {string} - Formatted date
 */
function formatMessageDate(date) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    // Format as Month Day, Year
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }
}

/**
 * Create a message element
 * @param {Object} message - Message data
 * @returns {HTMLElement} - Message element
 */
function createMessageElement(message) {
  try {
    const messageElement = document.createElement('div');
    messageElement.className = `message ${message.fromCurrentUser ? 'outgoing' : 'incoming'}`;
    messageElement.setAttribute('data-message-id', message.id);
    messageElement.setAttribute('data-sender-id', message.sender_id);
    messageElement.setAttribute('data-timestamp', message.created_at);
    
    // Format message time
    const messageTime = new Date(message.created_at);
    const formattedTime = messageTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Create message HTML structure
    messageElement.innerHTML = `
      <div class="message-avatar">
        <img src="${message.sender_avatar || '/images/default-avatar.png'}" alt="${message.sender_name || 'User'}" onerror="this.src='/images/default-avatar.png'">
      </div>
      <div class="message-content">
        <div class="message-header">
          <span class="sender-name">${message.sender_name || 'Unknown User'}</span>
          <span class="message-time">${formattedTime}</span>
        </div>
        <p>${message.content || ''}</p>
        <div class="message-status-container">
          ${createStatusIndicator(message.id, message.status || 'sent')}
        </div>
      </div>
    `;
    
    // Add message reactions if any
    if (message.reactions && message.reactions.length > 0) {
      const reactionsContainer = document.createElement('div');
      reactionsContainer.className = 'message-reactions';
      
      // Create reaction elements
      const reactionElements = createReactionElements(message.reactions);
      reactionsContainer.append(...reactionElements);
      
      // Add to message
      messageElement.appendChild(reactionsContainer);
    }
    
    // Add reaction button
    const reactionButton = document.createElement('button');
    reactionButton.className = 'reaction-button';
    reactionButton.innerHTML = '<i class="far fa-smile"></i>';
    reactionButton.setAttribute('title', 'Add reaction');
    
    // Add click handler for reaction button
    reactionButton.addEventListener('click', (event) => {
      event.stopPropagation();
      showReactionPicker(message.id, reactionButton);
    });
    
    messageElement.querySelector('.message-content').appendChild(reactionButton);
    
    return messageElement;
  } catch (error) {
    console.error('❌ Error creating message element:', error);
    
    // Return a fallback element
    const fallbackElement = document.createElement('div');
    fallbackElement.className = 'message error';
    fallbackElement.textContent = 'Error displaying message';
    return fallbackElement;
  }
}

/**
 * Show reaction picker for a message
 * @param {string} messageId - Message ID
 * @param {HTMLElement} buttonElement - Button that was clicked
 */
function showReactionPicker(messageId, buttonElement) {
  try {
    // Remove any existing reaction pickers
    const existingPickers = document.querySelectorAll('.reaction-picker');
    existingPickers.forEach(picker => picker.remove());
    
    // Create reaction picker
    const reactionPicker = document.createElement('div');
    reactionPicker.className = 'reaction-picker';
    
    // Add reactions to picker
    Object.entries(AVAILABLE_REACTIONS).forEach(([type, emoji]) => {
      const reactionButton = document.createElement('button');
      reactionButton.className = 'reaction-option';
      reactionButton.textContent = emoji;
      reactionButton.setAttribute('data-reaction-type', type);
      
      // Add click handler
      reactionButton.addEventListener('click', async () => {
        // Add reaction
        await addReaction(messageId, type);
        
        // Close picker
        reactionPicker.remove();
      });
      
      reactionPicker.appendChild(reactionButton);
    });
    
    // Position picker near the button
    const buttonRect = buttonElement.getBoundingClientRect();
    reactionPicker.style.position = 'absolute';
    reactionPicker.style.top = `${buttonRect.top - 40}px`;
    reactionPicker.style.left = `${buttonRect.left}px`;
    
    // Add to document
    document.body.appendChild(reactionPicker);
    
    // Close picker when clicking outside
    document.addEventListener('click', function closeReactionPicker(event) {
      if (!reactionPicker.contains(event.target) && event.target !== buttonElement) {
        reactionPicker.remove();
        document.removeEventListener('click', closeReactionPicker);
      }
    });
  } catch (error) {
    console.error('❌ Error showing reaction picker:', error);
  }
}

/**
 * Set up event listeners for the chat UI
 */
function setupEventListeners() {
  try {
    // Set up conversation filter
    const searchInput = document.querySelector('.conversation-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', debounce(() => {
        filterConversations(searchInput.value.trim());
      }, 300));
    }
    
    // Set up message input
    const messageInput = document.querySelector('.message-input');
    const sendButton = document.querySelector('.send-message-button');
    
    if (messageInput && sendButton) {
      // Send on enter (but not with shift+enter for new line)
      messageInput.addEventListener('keydown', async (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault();
          await sendMessage();
        }
        
        // Send typing indicator
        const conversationId = document.querySelector('.conversation-modal').getAttribute('data-conversation-id');
        if (conversationId) {
          await sendTypingIndicator(conversationId);
        }
      });
      
      // Send on button click
      sendButton.addEventListener('click', async () => {
        await sendMessage();
      });
    }
    
    // Set up new conversation button
    const newConversationButton = document.querySelector('.new-conversation-button');
    if (newConversationButton) {
      newConversationButton.addEventListener('click', () => {
        showNewConversationModal();
      });
    }
    
    console.log('💬 Chat event listeners set up');
  } catch (error) {
    console.error('❌ Error setting up event listeners:', error);
  }
}

/**
 * Filter conversations by search term
 * @param {string} searchTerm - Search term
 */
function filterConversations(searchTerm) {
  try {
    if (!searchTerm) {
      // Reset to all conversations
      filteredConversations = [...userConversations];
      renderConversations(filteredConversations);
      return;
    }
    
    // Filter conversations by user name or last message
    filteredConversations = userConversations.filter(conversation => {
      const userName = conversation.otherUser?.display_name?.toLowerCase() || '';
      const lastMessage = conversation.last_message?.toLowerCase() || '';
      const searchTermLower = searchTerm.toLowerCase();
      
      return userName.includes(searchTermLower) || lastMessage.includes(searchTermLower);
    });
    
    renderConversations(filteredConversations);
  } catch (error) {
    console.error('❌ Error filtering conversations:', error);
  }
}

/**
 * Send a message in the current conversation
 */
async function sendMessage() {
  try {
    const messageInput = document.querySelector('.message-input');
    const conversationModal = document.querySelector('.conversation-modal');
    
    if (!messageInput || !conversationModal) return;
    
    const content = messageInput.value.trim();
    if (!content) return;
    
    const conversationId = conversationModal.getAttribute('data-conversation-id');
    if (!conversationId) {
      console.error('❌ No conversation ID found');
      return;
    }
    
    // Clear input
    messageInput.value = '';
    
    // Import messages API
    const { sendMessage: apiSendMessage } = await import('./api/messages.js');
    
    // Send message
    const message = await apiSendMessage(conversationId, content);
    
    // No need to manually add message to UI since we're subscribed to real-time updates
    
    console.log('💬 Message sent:', message);
  } catch (error) {
    console.error('❌ Error sending message:', error);
    alert('Error sending message. Please try again.');
  }
}

/**
 * Show new conversation modal
 */
function showNewConversationModal() {
  try {
    // Check if modal exists
    let newConversationModal = document.querySelector('.new-conversation-modal');
    
    if (!newConversationModal) {
      // Create modal
      newConversationModal = document.createElement('div');
      newConversationModal.className = 'new-conversation-modal';
      newConversationModal.innerHTML = `
        <div class="modal-content">
          <div class="modal-header">
            <h3>New Conversation</h3>
            <button class="close-modal"><i class="fas fa-times"></i></button>
          </div>
          <div class="modal-body">
            <div class="search-container">
              <input type="text" class="user-search-input" placeholder="Search for users...">
              <div class="search-results"></div>
            </div>
          </div>
        </div>
      `;
      
      document.body.appendChild(newConversationModal);
      
      // Set up close button
      const closeButton = newConversationModal.querySelector('.close-modal');
      closeButton.addEventListener('click', () => {
        newConversationModal.style.display = 'none';
      });
      
      // Set up user search
      const searchInput = newConversationModal.querySelector('.user-search-input');
      searchInput.addEventListener('input', debounce(async () => {
        await searchUsers(searchInput.value.trim());
      }, 300));
    }
    
    // Show modal
    newConversationModal.style.display = 'flex';
    
    // Focus search input
    newConversationModal.querySelector('.user-search-input').focus();
  } catch (error) {
    console.error('❌ Error showing new conversation modal:', error);
  }
}

/**
 * Search for users to start a conversation with
 * @param {string} searchTerm - Search term
 */
async function searchUsers(searchTerm) {
  try {
    const searchResults = document.querySelector('.new-conversation-modal .search-results');
    if (!searchResults) return;
    
    if (!searchTerm || searchTerm.length < 2) {
      searchResults.innerHTML = '';
      return;
    }
    
    // Show loading
    searchResults.innerHTML = '<div class="loading">Searching...</div>';
    
    // Import user search API
    const { searchUsers: apiSearchUsers } = await import('./api/users.js');
    
    // Search users
    const users = await apiSearchUsers(searchTerm);
    
    // Display results
    if (!users || users.length === 0) {
      searchResults.innerHTML = '<div class="no-results">No users found</div>';
      return;
    }
    
    // Clear results
    searchResults.innerHTML = '';
    
    // Add user results
    users.forEach(user => {
      const userElement = document.createElement('div');
      userElement.className = 'user-result';
      userElement.innerHTML = `
        <div class="user-avatar">
          <img src="${user.avatar_url || '/images/default-avatar.png'}" alt="${user.display_name || 'User'}" onerror="this.src='/images/default-avatar.png'">
          ${user.online ? '<span class="online-indicator"></span>' : ''}
        </div>
        <div class="user-details">
          <h4>${user.display_name || 'Unknown User'}</h4>
          ${user.bio ? `<p class="user-bio">${user.bio}</p>` : ''}
        </div>
      `;
      
      // Add click handler to start conversation
      userElement.addEventListener('click', async () => {
        await startConversationWithUser(user);
      });
      
      searchResults.appendChild(userElement);
    });
  } catch (error) {
    console.error('❌ Error searching users:', error);
    const searchResults = document.querySelector('.new-conversation-modal .search-results');
    if (searchResults) {
      searchResults.innerHTML = '<div class="error-message">Error searching users</div>';
    }
  }
}

/**
 * Start a conversation with a user
 * @param {Object} user - User to start conversation with
 */
async function startConversationWithUser(user) {
  try {
    // Create conversation
    const conversation = await createConversation(user.id);
    
    // Close modal
    const newConversationModal = document.querySelector('.new-conversation-modal');
    if (newConversationModal) {
      newConversationModal.style.display = 'none';
    }
    
    // Add conversation to list if it's new
    if (!userConversations.some(conv => conv.id === conversation.id)) {
      userConversations.unshift(conversation);
      filteredConversations = [...userConversations];
      renderConversations(filteredConversations);
    }
    
    // Open conversation
    await openConversation(conversation);
  } catch (error) {
    console.error('❌ Error starting conversation:', error);
    alert('Error starting conversation. Please try again.');
  }
}

/**
 * Scroll messages container to bottom
 * @param {HTMLElement} container - Messages container
 */
function scrollToBottom(container) {
  if (container) {
    container.scrollTop = container.scrollHeight;
  }
}

/**
 * Play message notification sound
 */
function playMessageSound() {
  try {
    const audio = new Audio('/sounds/message.mp3');
    audio.volume = 0.5;
    audio.play();
  } catch (error) {
    console.error('❌ Error playing message sound:', error);
  }
}

/**
 * Check if conversation is currently visible
 * @returns {boolean} - True if conversation is visible
 */
function isConversationVisible() {
  const conversationModal = document.querySelector('.conversation-modal');
  return conversationModal && conversationModal.style.display === 'flex';
}

/**
 * Simple debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} - Debounced function
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Initialize chat when DOM is loaded
document.addEventListener('DOMContentLoaded', initChat);

// Export functions for use in other modules
export {
  initChat,
  openConversation,
  loadConversations,
  sendMessage,
  showNewConversationModal
};
