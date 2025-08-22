/**
 * BarCrush Conversation Controller
 * 
 * Handles the individual conversation functionality including:
 * - Loading and displaying messages
 * - Sending new messages
 * - Real-time updates using Supabase subscriptions
 */

import { getConversationById, markConversationAsRead } from './api/conversations.js';
import { getConversationMessages, sendTextMessage, markMessagesAsRead, sendMediaMessage, sendLocationMessage } from './api/messages.js';
import { getCurrentUser } from './supabase-client.js';
import { supabaseClientPromise } from './supabase-client.js';

// Store for conversation data
let currentConversation = null;
let currentUser = null;
let messages = [];
let messagesSubscription = null;

/**
 * Initialize the conversation page
 */
async function initConversation() {
  try {
    // Get current user
    currentUser = await getCurrentUser();
    if (!currentUser) {
      console.error('User not authenticated');
      window.location.href = '/views/login.html';
      return;
    }

    // Get conversation ID from URL or session storage
    const urlParams = new URLSearchParams(window.location.search);
    const conversationId = urlParams.get('id');
    
    if (!conversationId) {
      console.error('No conversation ID provided');
      window.location.href = '/views/chat.html';
      return;
    }

    // Load conversation data
    currentConversation = await getConversationById(conversationId);
    
    // Update UI with conversation data
    updateConversationUI();
    
    // Load messages
    await loadMessages();
    
    // Mark conversation as read
    await markConversationAsRead(conversationId);
    await markMessagesAsRead(conversationId);
    
    // Subscribe to new messages
    subscribeToMessages();
    
    // Set up UI event listeners
    setupEventListeners();
    
    console.log('Conversation page initialized');
  } catch (error) {
    console.error('Error initializing conversation:', error);
  }
}

/**
 * Update the conversation UI with current data
 */
function updateConversationUI() {
  if (!currentConversation) return;
  
  const { otherUser } = currentConversation;
  
  // Update header with contact info
  const contactName = document.querySelector('.contact-name');
  if (contactName) {
    contactName.textContent = otherUser.display_name;
  }
  
  const contactAvatar = document.querySelector('.contact-avatar img');
  if (contactAvatar) {
    contactAvatar.src = otherUser.avatar_url || '/images/default-avatar.jpg';
    contactAvatar.alt = otherUser.display_name;
  }
}

/**
 * Load and display conversation messages
 */
async function loadMessages() {
  try {
    if (!currentConversation) return;
    
    messages = await getConversationMessages(currentConversation.id);
    
    // Sort messages by date (oldest first)
    messages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    
    renderMessages();
    
    // Scroll to bottom
    scrollToBottom();
  } catch (error) {
    console.error('Error loading messages:', error);
  }
}

/**
 * Render messages in the messages container
 */
function renderMessages() {
  const messagesContainer = document.querySelector('.messages-container');
  if (!messagesContainer) return;
  
  // Group messages by date
  const messagesByDate = groupMessagesByDate(messages);
  
  // Clear existing content
  messagesContainer.innerHTML = '';
  
  // Add each date group
  Object.entries(messagesByDate).forEach(([date, dateMessages]) => {
    // Add date divider
    const dateDivider = document.createElement('div');
    dateDivider.className = 'date-divider';
    dateDivider.innerHTML = `<span>${formatMessageDate(date)}</span>`;
    messagesContainer.appendChild(dateDivider);
    
    // Add messages for this date
    dateMessages.forEach(message => {
      const messageElement = createMessageElement(message);
      messagesContainer.appendChild(messageElement);
    });
  });
}

/**
 * Group messages by date
 */
function groupMessagesByDate(messageList) {
  const groups = {};
  
  messageList.forEach(message => {
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
 */
function createMessageElement(message) {
  const isCurrentUser = message.fromCurrentUser;
  const messageClass = isCurrentUser ? 'message outgoing' : 'message incoming';
  
  const messageDiv = document.createElement('div');
  messageDiv.className = messageClass;
  
  // Handle different message types
  let messageContent;
  
  switch (message.message_type) {
    case 'text':
      messageContent = message.content;
      break;
    case 'image':
      messageContent = `<img src="${message.attachment_url}" class="message-image" alt="Shared image">`;
      break;
    case 'audio':
      messageContent = `
        <audio controls class="message-audio">
          <source src="${message.attachment_url}" type="audio/mpeg">
          Your browser does not support the audio element.
        </audio>
      `;
      break;
    case 'location':
      messageContent = `
        <div class="location-message">
          <div class="location-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <circle cx="12" cy="10" r="3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="location-text">${message.content}</div>
        </div>
      `;
      break;
    default:
      messageContent = message.content;
  }
  
  // Format time
  const messageTime = formatMessageTime(message.created_at);
  
  messageDiv.innerHTML = `
    <div class="message-bubble">
      ${messageContent}
      <span class="message-time">${messageTime}</span>
    </div>
  `;
  
  return messageDiv;
}

/**
 * Format message date display
 */
function formatMessageDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (date.toDateString() === now.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    // Format as MM/DD/YYYY
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  }
}

/**
 * Format message time display
 */
function formatMessageTime(timestamp) {
  const date = new Date(timestamp);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  
  // Format as HH:MM with leading zeros
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Subscribe to real-time message updates
 */
function subscribeToMessages() {
  if (!currentConversation) return;
  
  // Unsubscribe from previous subscription if exists
  if (messagesSubscription) {
    supabase.removeSubscription(messagesSubscription);
  }
  
  // Subscribe to new messages in this conversation
  messagesSubscription = supabase
    .channel(`messages:${currentConversation.id}`)
    .on('postgres_changes', { 
      event: 'INSERT', 
      schema: 'public', 
      table: 'messages',
      filter: `conversation_id=eq.${currentConversation.id}`
    }, (payload) => {
      handleNewMessage(payload.new);
    })
    .subscribe();
}

/**
 * Handle a new incoming message
 */
async function handleNewMessage(newMessage) {
  // Add fromCurrentUser flag
  newMessage.fromCurrentUser = newMessage.sender_id === currentUser.id;
  
  // Add to messages array
  messages.push(newMessage);
  
  // Re-render messages
  renderMessages();
  
  // Scroll to bottom
  scrollToBottom();
  
  // If message is not from current user, mark as read
  if (!newMessage.fromCurrentUser) {
    await markMessagesAsRead(currentConversation.id);
  }
}

/**
 * Scroll the messages container to the bottom
 */
function scrollToBottom() {
  const messagesContainer = document.querySelector('.messages-container');
  if (messagesContainer) {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
}

/**
 * Set up event listeners for UI elements
 */
function setupEventListeners() {
  // Back button
  const backButton = document.querySelector('.back-button');
  if (backButton) {
    backButton.addEventListener('click', () => {
      window.location.href = '/views/chat.html';
    });
  }
  
  // Send button
  const sendButton = document.querySelector('.send-button');
  const messageInput = document.querySelector('.message-input');
  
  if (sendButton && messageInput) {
    sendButton.addEventListener('click', () => {
      sendMessage();
    });
    
    messageInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
  }
  
  // Attachment button
  const attachmentButton = document.querySelector('.attachment-button');
  const fileInput = document.querySelector('#file-input');
  
  if (attachmentButton && fileInput) {
    attachmentButton.addEventListener('click', () => {
      fileInput.click();
    });
    
    fileInput.addEventListener('change', async () => {
      const file = fileInput.files[0];
      if (!file) return;
      
      try {
        // Determine type (image or audio)
        const messageType = file.type.startsWith('image/') ? 'image' : 'audio';
        
        // Send media message
        await sendMediaMessage(currentConversation.id, file, messageType);
        
        // Reset file input
        fileInput.value = '';
      } catch (error) {
        console.error('Error sending media message:', error);
      }
    });
  }
  
  // Location button
  const locationButton = document.querySelector('.location-button');
  
  if (locationButton) {
    locationButton.addEventListener('click', async () => {
      try {
        const position = await getCurrentPosition();
        const { latitude, longitude } = position.coords;
        
        await sendLocationMessage(
          currentConversation.id,
          latitude,
          longitude,
          'Shared my location'
        );
      } catch (error) {
        console.error('Error sending location:', error);
      }
    });
  }
}

/**
 * Send a text message
 */
async function sendMessage() {
  const messageInput = document.querySelector('.message-input');
  if (!messageInput || !currentConversation) return;
  
  const content = messageInput.value.trim();
  if (!content) return;
  
  try {
    // Clear input
    messageInput.value = '';
    
    // Send message
    await sendTextMessage(currentConversation.id, content);
  } catch (error) {
    console.error('Error sending message:', error);
  }
}

/**
 * Get current position as a promise
 */
function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    });
  });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initConversation);

// Export functions for external use
export { initConversation, sendMessage };
