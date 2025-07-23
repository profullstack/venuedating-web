import { initI18n } from './i18n-setup.js';
import authMiddleware from './auth-middleware.js';

/**
 * Notifications page script
 * Handles loading, filtering, and managing user notifications
 */

// Initialize i18n
await initI18n();

// DOM Elements
const notificationsList = document.getElementById('notifications-list');
const notificationPlaceholder = document.getElementById('notification-placeholder');
const filterButtons = document.querySelectorAll('.filter-btn');
const notificationTemplate = document.getElementById('notification-template');

// State
let notifications = [];
let currentFilter = 'all';

// Initialize the page
async function init() {
  // Check authentication
  await authMiddleware.checkAuth();
  
  // Load notifications
  await loadNotifications();
  
  // Set up event listeners
  setupEventListeners();
}

// Load notifications from API
async function loadNotifications() {
  try {
    // Show loading state
    showLoading();
    
    // Get user from auth middleware
    const user = authMiddleware.getUser();
    
    if (!user || !user.id) {
      throw new Error('User not authenticated');
    }
    
    // Fetch notifications from the API
    const response = await fetch('/api/notifications', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authMiddleware.getToken()}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch notifications');
    }
    
    // Parse response data
    notifications = await response.json();
    
    // If no notifications yet, use mock data for development
    if (!notifications || notifications.length === 0) {
      notifications = getMockNotifications();
    }
    
    // Render notifications based on current filter
    renderNotifications();
  } catch (error) {
    console.error('Error loading notifications:', error);
    showError(error.message);
  }
}

// Render notifications based on current filter
function renderNotifications() {
  // Clear previous notifications (except placeholder)
  const existingNotifications = notificationsList.querySelectorAll('.notification-item');
  existingNotifications.forEach(item => item.remove());
  
  // Filter notifications based on current filter
  const filteredNotifications = filterNotifications(notifications, currentFilter);
  
  // Show placeholder if no notifications
  if (filteredNotifications.length === 0) {
    notificationPlaceholder.style.display = 'flex';
  } else {
    notificationPlaceholder.style.display = 'none';
    
    // Render each notification
    filteredNotifications.forEach(notification => {
      const notificationElement = createNotificationElement(notification);
      notificationsList.appendChild(notificationElement);
    });
  }
}

// Filter notifications based on filter type
function filterNotifications(notifications, filter) {
  if (filter === 'all') {
    return notifications;
  } else if (filter === 'unread') {
    return notifications.filter(notification => !notification.read);
  }
  return notifications;
}

// Create notification element from template
function createNotificationElement(notification) {
  const template = notificationTemplate.content.cloneNode(true);
  const notificationItem = template.querySelector('.notification-item');
  
  // Add unread class if notification is unread
  if (!notification.read) {
    notificationItem.classList.add('unread');
  }
  
  // Set notification icon
  const iconContainer = notificationItem.querySelector('.notification-icon');
  iconContainer.innerHTML = getNotificationIcon(notification.type);
  
  // Set notification content
  notificationItem.querySelector('.notification-title').textContent = notification.title;
  notificationItem.querySelector('.notification-time').textContent = formatTime(notification.timestamp);
  notificationItem.querySelector('.notification-message').textContent = notification.message;
  
  // Set up mark as read button
  const markReadBtn = notificationItem.querySelector('.mark-read-btn');
  if (notification.read) {
    markReadBtn.style.display = 'none';
  } else {
    markReadBtn.addEventListener('click', () => markAsRead(notification.id));
  }
  
  return notificationItem;
}

// Get appropriate icon based on notification type
function getNotificationIcon(type) {
  const icons = {
    match: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>',
    like: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>',
    message: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>',
    system: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>'
  };
  
  return icons[type] || icons.system;
}

// Format timestamp to relative time
function formatTime(timestamp) {
  const now = new Date();
  const notificationDate = new Date(timestamp);
  const diffInSeconds = Math.floor((now - notificationDate) / 1000);
  
  if (diffInSeconds < 60) {
    return window.app.localizer.translate('notifications.time_just_now');
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return window.app.localizer.translate('notifications.time_minutes_ago').replace('{0}', minutes);
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return window.app.localizer.translate('notifications.time_hours_ago').replace('{0}', hours);
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return days === 1 ? 
      window.app.localizer.translate('notifications.time_yesterday') : 
      window.app.localizer.translate('notifications.time_days_ago').replace('{0}', days);
  }
}

// Mark notification as read
async function markAsRead(notificationId) {
  try {
    // Send API request to mark notification as read
    const response = await fetch(`/api/notifications/${notificationId}/read`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authMiddleware.getToken()}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || window.app.localizer.translate('notifications.error_mark_read'));
    }
    
    // Find notification and mark as read locally
    const notification = notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      
      // Re-render notifications
      renderNotifications();
    }
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
}

// Set up event listeners
function setupEventListeners() {
  // Filter buttons
  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Update active filter
      filterButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      
      // Update current filter
      currentFilter = button.dataset.filter;
      
      // Re-render notifications
      renderNotifications();
    });
  });
  
  // Add mark all as read functionality
  const markAllReadBtn = document.createElement('button');
  markAllReadBtn.className = 'mark-all-read-btn';
  markAllReadBtn.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M18 6L6 18"></path>
      <path d="M6 6L18 18"></path>
    </svg>
    <span data-i18n="notifications.mark_all_read">Mark all as read</span>
  `;
  
  // Add translation to the new button
  if (window.app && window.app.localizer) {
    window.app.localizer.translateElement(markAllReadBtn);
  }
  
  // Add event listener to mark all as read button
  markAllReadBtn.addEventListener('click', markAllAsRead);
  
  // Add button to filters container
  document.querySelector('.notification-filters').appendChild(markAllReadBtn);
}

// Show loading state
function showLoading() {
  notificationPlaceholder.style.display = 'flex';
  notificationPlaceholder.querySelector('.placeholder-text').textContent = window.app.localizer.translate('notifications.loading') || 'Loading...';
  notificationPlaceholder.querySelector('.placeholder-subtext').textContent = '';
}

// Show error state
function showError(message) {
  notificationPlaceholder.style.display = 'flex';
  notificationPlaceholder.querySelector('.placeholder-text').textContent = window.app.localizer.translate('notifications.error') || 'Error loading notifications';
  notificationPlaceholder.querySelector('.placeholder-subtext').textContent = message;
}

// Mock notifications data for development
function getMockNotifications() {
  const localizer = window.app.localizer;
  return [
    {
      id: 1,
      type: 'match',
      title: localizer.translate('notifications.mock_match_title'),
      message: localizer.translate('notifications.mock_match_message'),
      timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
      read: false
    },
    {
      id: 2,
      type: 'like',
      title: localizer.translate('notifications.mock_like_title'),
      message: localizer.translate('notifications.mock_like_message'),
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
      read: false
    },
    {
      id: 3,
      type: 'message',
      title: localizer.translate('notifications.mock_message_title'),
      message: localizer.translate('notifications.mock_message_content'),
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
      read: true
    },
    {
      id: 4,
      type: 'system',
      title: localizer.translate('notifications.mock_system_title'),
      message: localizer.translate('notifications.mock_system_message'),
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
      read: true
    }
  ];
}

// Mark all notifications as read
async function markAllAsRead() {
  try {
    // Send API request to mark all notifications as read
    const response = await fetch('/api/notifications/read-all', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authMiddleware.getToken()}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || window.app.localizer.translate('notifications.error_mark_all_read'));
    }
    
    // Mark all notifications as read locally
    notifications.forEach(notification => {
      notification.read = true;
    });
    
    // Re-render notifications
    renderNotifications();
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
  }
}

// Initialize the page
init();
