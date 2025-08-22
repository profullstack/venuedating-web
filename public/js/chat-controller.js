/**
 * BarCrush Chat Controller
 * 
 * Handles the chat page functionality including:
 * - Displaying user conversations
 * - Managing conversation navigation
 * - Search functionality
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

// Store for conversation data
let userConversations = [];
let filteredConversations = [];

/**
 * Initialize the chat page
 */
async function initChat() {
  try {
    // Get the user
    const user = await getCurrentUser();
    if (!user) {
      console.error('User not authenticated');
      window.location.href = '/views/login.html';
      return;
    }

    // Set up UI event listeners
    setupEventListeners();
    
    // Check if we should open a specific conversation
    await handleDirectConversationNavigation();
    
    console.log('💬 Chat page initialized');
  
    // Initialize unread message tracking
    await initializeUnreadTracking();
  
    // Load conversations
    await loadConversations();
  } catch (error) {
    console.error('Error initializing chat page:', error);
  }
}

/**
 * Handle direct navigation to a specific conversation
 * Called when user navigates from match modal with ?conversation=id parameter
 */
async function handleDirectConversationNavigation() {
  try {
    // Check for conversation ID in URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const conversationId = urlParams.get('conversation');
    
    if (conversationId) {
      console.log('🎯 Direct navigation to conversation:', conversationId);
      
      // Find the conversation in our loaded conversations
      const conversation = userConversations.find(conv => conv.id === conversationId);
      
      if (conversation) {
        console.log('✅ Found conversation, opening chat...');
        
        // Open the conversation modal/view
        await openConversation(conversation);
        
        // Clear the URL parameter to clean up the URL
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      } else {
        console.warn('⚠️ Conversation not found in user\'s conversations:', conversationId);
        // The conversation might be new or not loaded yet
        // Try to fetch it directly
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
          // Show user-friendly message
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
 * Update the conversation modal with conversation data
 * @param {Object} conversation - The conversation data
 */
function updateConversationModal(conversation) {
  const modal = document.querySelector('.conversation-modal');
  if (!modal) return;
  
  // Update contact name
  const contactName = modal.querySelector('.contact-name');
  if (contactName) {
    contactName.textContent = conversation.otherUser?.display_name || 'Unknown User';
  }
  
  // Update contact avatar
  const contactAvatar = modal.querySelector('.contact-avatar img');
  if (contactAvatar) {
    contactAvatar.src = conversation.otherUser?.avatar_url || '/images/default-avatar.png';
    contactAvatar.alt = conversation.otherUser?.display_name || 'User';
  }
  
  // Store conversation ID for message loading
  modal.dataset.conversationId = conversation.id;
  
  console.log('✅ Conversation modal updated');
}

/**
 * Load and display messages for a specific conversation
 * @param {string} conversationId - The conversation ID to load messages for
 */
async function loadConversationMessages(conversationId) {
  try {
    console.log('📨 Loading messages for conversation:', conversationId);
    
    // Import the messages API
    const { getConversationMessages } = await import('./api/messages.js');
    
    // Get messages for this conversation
    const messages = await getConversationMessages(conversationId);
    
    // Find the messages container in the modal
    const messagesContainer = document.querySelector('.conversation-modal .messages-container');
    if (!messagesContainer) {
      console.error('❌ Messages container not found in conversation modal');
      return;
    }
    
    // Clear existing messages (remove static content)
    messagesContainer.innerHTML = '';
    
    if (messages.length === 0) {
      // Show empty state for new conversation
      messagesContainer.innerHTML = `
        <div class="empty-conversation">
          <div class="empty-icon">💬</div>
          <p>Start your conversation!</p>
          <p class="empty-subtitle">Say hello and break the ice</p>
        </div>
      `;
      console.log('📭 No messages found, showing empty state');
      return;
    }
    
    // Group messages by date
    const messagesByDate = groupMessagesByDate(messages.reverse()); // Reverse to show oldest first
    
    // Render messages grouped by date
    Object.keys(messagesByDate).forEach(dateKey => {
      // Add date divider
      const dateDivider = document.createElement('div');
      dateDivider.className = 'date-divider';
      dateDivider.innerHTML = `<span>${formatMessageDate(dateKey)}</span>`;
      messagesContainer.appendChild(dateDivider);
      
      // Add messages for this date
      messagesByDate[dateKey].forEach(message => {
        const messageElement = createMessageElement(message);
        messagesContainer.appendChild(messageElement);
      });
    });
    
    // Scroll to bottom to show latest messages
    scrollToBottom(messagesContainer);
    
    console.log(`✅ Loaded ${messages.length} messages`);
    
  } catch (error) {
    console.error('❌ Error loading conversation messages:', error);
    
    // Show appropriate error state based on error type
    const messagesContainer = document.querySelector('.conversation-modal .messages-container');
    if (messagesContainer) {
      if (error.message?.includes('network') || error.message?.includes('fetch')) {
        messagesContainer.innerHTML = `
          <div class="error-state network-error">
            <div class="error-icon">📡</div>
            <h3>Connection Problem</h3>
            <p>Unable to load messages. Check your connection and try again.</p>
            <button class="retry-button" onclick="loadConversationMessages('${conversationId}')">Retry</button>
          </div>
        `;
      } else if (error.message?.includes('auth') || error.message?.includes('unauthorized')) {
        messagesContainer.innerHTML = `
          <div class="error-state auth-error">
            <div class="error-icon">🔒</div>
            <h3>Session Expired</h3>
            <p>Please log in again to view messages.</p>
            <button class="retry-button" onclick="window.location.href='/auth'">Log In</button>
          </div>
        `;
      } else {
        messagesContainer.innerHTML = `
          <div class="error-state generic-error">
            <div class="error-icon">⚠️</div>
            <h3>Failed to load messages</h3>
            <p>Something went wrong while loading messages.</p>
            <button class="retry-button" onclick="loadConversationMessages('${conversationId}')">Try Again</button>
          </div>
        `;
      }
    }
  }
}

/**
 * Group messages by date
 * @param {Array} messages - Array of messages
 * @returns {Object} Messages grouped by date
 */
function groupMessagesByDate(messages) {
  const groups = {};
  
  messages.forEach(message => {
    const date = new Date(message.created_at).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
  });
  
  return groups;
}

/**
 * Create a message element
 * @param {Object} message - Message data
 * @returns {HTMLElement} Message element
 */
function createMessageElement(message) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${message.fromCurrentUser ? 'sent' : 'received'}`;
  
  const messageContent = document.createElement('div');
  messageContent.className = 'message-content';
  
  if (message.message_type === 'text') {
    messageContent.innerHTML = `<p>${escapeHtml(message.content)}</p>`;
  } else if (message.message_type === 'image') {
    messageContent.innerHTML = `
      <img src="${message.attachment_url}" alt="Shared image" class="message-image" />
      ${message.content ? `<p>${escapeHtml(message.content)}</p>` : ''}
    `;
  } else if (message.message_type === 'location') {
    messageContent.innerHTML = `
      <div class="location-message">
        <div class="location-icon">📍</div>
        <p>Shared location</p>
        ${message.content ? `<p class="location-name">${escapeHtml(message.content)}</p>` : ''}
      </div>
    `;
  }
  
  const messageTime = document.createElement('div');
  messageTime.className = 'message-time';
  messageTime.textContent = formatMessageTime(message.created_at);
  
  messageDiv.appendChild(messageContent);
  messageDiv.appendChild(messageTime);
  
  return messageDiv;
}

/**
 * Format message date for display
 * @param {string} dateString - Date string
 * @returns {string} Formatted date
 */
function formatMessageDate(dateString) {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }
}

/**
 * Format message time for display
 * @param {string} timestamp - ISO timestamp
 * @returns {string} Formatted time
 */
function formatMessageTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
}

/**
 * Scroll messages container to bottom
 * @param {HTMLElement} container - Messages container element
 */
function scrollToBottom(container) {
  if (container) {
    container.scrollTop = container.scrollHeight;
  }
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Show loading state in messages list
 * @param {HTMLElement} container - Container element
 */
function showLoadingState(container) {
  container.innerHTML = `
    <div class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading conversations...</p>
    </div>
  `;
}

/**
 * Show network error state
 * @param {HTMLElement} container - Container element
 */
function showNetworkErrorState(container) {
  container.innerHTML = `
    <div class="error-state network-error">
      <div class="error-icon">📡</div>
      <h3>Connection Problem</h3>
      <p>Unable to connect to the server. Please check your internet connection and try again.</p>
      <button class="retry-button" onclick="loadConversations()">Retry</button>
    </div>
  `;
}

/**
 * Show authentication error state
 * @param {HTMLElement} container - Container element
 */
function showAuthErrorState(container) {
  container.innerHTML = `
    <div class="error-state auth-error">
      <div class="error-icon">🔒</div>
      <h3>Session Expired</h3>
      <p>Your session has expired. Please log in again to continue.</p>
      <button class="retry-button" onclick="window.location.href='/auth'">Log In</button>
    </div>
  `;
}

/**
 * Show generic error state
 * @param {HTMLElement} container - Container element
 * @param {string} errorMessage - Error message to display
 */
function showGenericErrorState(container, errorMessage) {
  container.innerHTML = `
    <div class="error-state generic-error">
      <div class="error-icon">⚠️</div>
      <h3>Something went wrong</h3>
      <p>We encountered an unexpected error. Please try again.</p>
      ${errorMessage ? `<details class="error-details"><summary>Technical details</summary><p>${escapeHtml(errorMessage)}</p></details>` : ''}
      <button class="retry-button" onclick="loadConversations()">Try Again</button>
    </div>
  `;
}

/**
 * Show empty conversations state
 * @param {HTMLElement} container - Container element
 */
function showEmptyConversationsState(container) {
  container.innerHTML = `
    <div class="empty-state">
      <div class="empty-icon">💬</div>
      <h3>No conversations yet</h3>
      <p>Start matching with people to begin chatting!</p>
      <button class="cta-button" onclick="window.location.href='/matching'">Find Matches</button>
    </div>
  `;
}

/**
 * Show message sending error
 * @param {string} message - Error message
 */
function showMessageError(message) {
  // Create or update error toast
  let errorToast = document.querySelector('.message-error-toast');
  if (!errorToast) {
    errorToast = document.createElement('div');
    errorToast.className = 'message-error-toast';
    document.body.appendChild(errorToast);
  }
  
  errorToast.innerHTML = `
    <div class="toast-content">
      <span class="toast-icon">❌</span>
      <span class="toast-message">${escapeHtml(message)}</span>
      <button class="toast-close" onclick="this.parentElement.parentElement.remove()">×</button>
    </div>
  `;
  
  errorToast.classList.add('show');
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    if (errorToast && errorToast.parentElement) {
      errorToast.classList.remove('show');
      setTimeout(() => errorToast.remove(), 300);
    }
  }, 5000);
}

/**
 * Show success message
 * @param {string} message - Success message
 */
function showSuccessMessage(message) {
  // Create or update success toast
  let successToast = document.querySelector('.message-success-toast');
  if (!successToast) {
    successToast = document.createElement('div');
    successToast.className = 'message-success-toast';
    document.body.appendChild(successToast);
  }
  
  successToast.innerHTML = `
    <div class="toast-content">
      <span class="toast-icon">✅</span>
      <span class="toast-message">${escapeHtml(message)}</span>
      <button class="toast-close" onclick="this.parentElement.parentElement.remove()">×</button>
    </div>
  `;
  
  successToast.classList.add('show');
  
  // Auto-hide after 3 seconds
  setTimeout(() => {
    if (successToast && successToast.parentElement) {
      successToast.classList.remove('show');
      setTimeout(() => successToast.remove(), 300);
    }
  }, 3000);
}

/**
 * Load and display user's conversations
 */
async function loadConversations() {
  const messagesList = document.querySelector('.messages-list');
  if (!messagesList) return;
  
  try {
    // Show loading state
    showLoadingState(messagesList);
    
    userConversations = await getUserConversations();
    filteredConversations = [...userConversations];
    
    await renderConversations(filteredConversations);
    
  } catch (error) {
    console.error('Error loading conversations:', error);
    
    // Show appropriate error state based on error type
    if (error.message?.includes('network') || error.message?.includes('fetch')) {
      showNetworkErrorState(messagesList);
    } else if (error.message?.includes('auth') || error.message?.includes('unauthorized')) {
      showAuthErrorState(messagesList);
    } else {
      showGenericErrorState(messagesList, error.message);
    }
  }
}

/**
 * Render conversations to the messages list
 */
async function renderConversations(conversations) {
  const messagesList = document.querySelector('.messages-list');
  if (!messagesList) return;
  
  // Clear existing content
  messagesList.innerHTML = '';
  
  if (conversations.length === 0) {
    showEmptyConversationsState(messagesList);
    return;
  }
  
  // Load conversations with unread counts
  for (const conversation of conversations) {
    const unreadCount = await getConversationUnreadCount(conversation.id);
    const conversationElement = createConversationElement(conversation, unreadCount);
    messagesList.appendChild(conversationElement);
  }
}

/**
 * Create a conversation list item
 */
function createConversationElement(conversation, unreadCount = 0) {
  const { otherUser, last_message_text, last_message_at } = conversation;
  
  // Create link element
  const link = document.createElement('a');
  link.href = `/views/conversation.html?id=${conversation.id}`;
  link.className = 'message-item-link';
  
  // Format time
  const timeDisplay = formatMessageTime(last_message_at);
  
  // Create HTML
  link.innerHTML = `
    <div class="message-item">
      <div class="message-avatar">
        <img src="${otherUser.avatar_url || '/images/default-avatar.jpg'}" alt="${otherUser.display_name}">
      </div>
      <div class="message-content">
        <div class="message-top">
          <span class="contact-name">${otherUser.display_name}</span>
          <span class="message-time">${timeDisplay}</span>
        </div>
        <div class="message-preview">${last_message_text || 'New match!'}</div>
      </div>
      ${unreadCount > 0 ? `<div class="unread-badge">${unreadCount}</div>` : ''}
    </div>
  `;
  
  // Add event listener
  link.addEventListener('click', function(e) {
    e.preventDefault();
    
    // Store contact info in session storage for the conversation page
    sessionStorage.setItem('currentConversation', JSON.stringify({
      id: conversation.id,
      otherUser: {
        id: otherUser.id,
        name: otherUser.display_name,
        avatar: otherUser.avatar_url
      }
    }));
    
    // Navigate to conversation page
    window.location.href = this.href;
  });
  
  return link;
}

/**
 * Format message time display
 */
function formatMessageTime(timestamp) {
  if (!timestamp) return '';
  
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.round(diffMs / 60000);
  const diffHours = Math.round(diffMs / 3600000);
  const diffDays = Math.round(diffMs / 86400000);
  
  // Less than 24 hours
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} min`;
  if (diffHours < 24) return `${diffHours}h`;
  
  // Less than 7 days
  if (diffDays < 7) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[date.getDay()];
  }
  
  // More than 7 days
  return `${date.getDate()}/${date.getMonth() + 1}`;
}

/**
 * Set up event listeners for UI elements
 */
function setupEventListeners() {
  // Search input
  const searchInput = document.querySelector('.search-input');
  if (searchInput) {
    searchInput.addEventListener('input', async () => {
      const searchTerm = searchInput.value.toLowerCase().trim();
      
      if (!searchTerm) {
        filteredConversations = [...userConversations];
      } else {
        filteredConversations = userConversations.filter(conversation => {
          const { otherUser, last_message_text } = conversation;
          return otherUser.display_name.toLowerCase().includes(searchTerm) || 
                 (last_message_text && last_message_text.toLowerCase().includes(searchTerm));
        });
      }
      
      await renderConversations(filteredConversations);
    });
  }
}

/**
 * Mark a conversation as read
 */
async function markAsRead(conversationId) {
  try {
    await markConversationAsRead(conversationId);
  } catch (error) {
    console.error('Error marking conversation as read:', error);
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initChat);

// Export functions for external use
export { initChat, loadConversations, markAsRead };
