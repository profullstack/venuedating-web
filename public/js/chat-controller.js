/**
 * BarCrush Chat Controller
 * 
 * Handles the chat page functionality including:
 * - Displaying user conversations
 * - Managing conversation navigation
 * - Search functionality
 */

import { getUserConversations, markConversationAsRead } from './api/conversations.js';
import { getCurrentUser } from './api/supabase-client.js';

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

    // Load user's conversations
    await loadConversations();
    
    // Set up UI event listeners
    setupEventListeners();
    
    console.log('Chat page initialized');
  } catch (error) {
    console.error('Error initializing chat page:', error);
  }
}

/**
 * Load and display user's conversations
 */
async function loadConversations() {
  try {
    userConversations = await getUserConversations();
    filteredConversations = [...userConversations];
    
    renderConversations(filteredConversations);
  } catch (error) {
    console.error('Error loading conversations:', error);
  }
}

/**
 * Render conversations to the messages list
 */
function renderConversations(conversations) {
  const messagesList = document.querySelector('.messages-list');
  if (!messagesList) return;
  
  // Clear existing content
  messagesList.innerHTML = '';
  
  if (conversations.length === 0) {
    messagesList.innerHTML = `
      <div class="empty-state">
        <p>No conversations yet</p>
        <p class="empty-state-subtext">Start matching with people to chat</p>
      </div>
    `;
    return;
  }
  
  // Add each conversation to the list
  conversations.forEach(conversation => {
    const messageItem = createConversationItem(conversation);
    messagesList.appendChild(messageItem);
  });
}

/**
 * Create a conversation list item
 */
function createConversationItem(conversation) {
  const { otherUser, last_message_text, last_message_at, unreadCount } = conversation;
  
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
    searchInput.addEventListener('input', () => {
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
      
      renderConversations(filteredConversations);
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
