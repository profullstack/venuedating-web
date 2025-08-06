import { initI18n } from './i18n-setup.js';
import authMiddleware from './auth-middleware.js';
import { 
  getUserNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  deleteNotification, 
  getNotificationCounts 
} from './api/notifications.js';

/**
 * Notifications page script
 * Handles loading, filtering, and managing user notifications
 */

// Initialize i18n
await initI18n();

// DOM Elements
const notificationsList = document.getElementById('notifications-list');
const notificationPlaceholder = document.getElementById('notification-placeholder');
const loadingState = document.getElementById('loading-state');
const filterButtons = document.querySelectorAll('.filter-btn');
const notificationTemplate = document.getElementById('notification-template');
const markAllReadBtn = document.getElementById('mark-all-read-btn');

// Stats elements
const totalCountEl = document.getElementById('total-count');
const unreadCountEl = document.getElementById('unread-count');
const allCountEl = document.getElementById('all-count');
const unreadFilterCountEl = document.getElementById('unread-filter-count');
const matchesCountEl = document.getElementById('matches-count');
const venuesCountEl = document.getElementById('venues-count');

// State
let notifications = [];
let currentFilter = 'all';

// Initialize the page
async function init() {
  // Check authentication
  await authMiddleware.requireAuth();
  
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
      console.log('User not authenticated');
      showError('Please log in to view notifications');
      return;
    }
    
    console.log('Loading notifications for user:', user.id);
    
    // Load notifications from Supabase
    notifications = await getUserNotifications(user.id, {
      limit: 50 // Load last 50 notifications
    });
    
    console.log(`📧 Loaded ${notifications.length} notifications`);
    
    // Render notifications
    renderNotifications();
    
  } catch (error) {
    console.error('Error loading notifications:', error);
    showError(error.message || 'Failed to load notifications');
  }
}

// Update notification stats
function updateStats() {
  const totalCount = notifications.length;
  const unreadCount = notifications.filter(n => !n.read).length;
  const matchesCount = notifications.filter(n => n.type === 'match').length;
  const venuesCount = notifications.filter(n => n.type === 'venue').length;
  
  // Update stats display
  if (totalCountEl) totalCountEl.textContent = totalCount;
  if (unreadCountEl) unreadCountEl.textContent = unreadCount;
  
  // Update filter counts
  if (allCountEl) allCountEl.textContent = totalCount;
  if (unreadFilterCountEl) unreadFilterCountEl.textContent = unreadCount;
  if (matchesCountEl) matchesCountEl.textContent = matchesCount;
  if (venuesCountEl) venuesCountEl.textContent = venuesCount;
  
  // Show/hide mark all read button
  if (markAllReadBtn) {
    markAllReadBtn.style.display = unreadCount > 0 ? 'flex' : 'none';
  }
}

// Render notifications based on current filter
function renderNotifications() {
  // Get the notifications container
  const notificationsContainer = document.getElementById('notifications-container');
  
  // Filter notifications based on current filter
  const filteredNotifications = filterNotifications(notifications, currentFilter);
  
  // Hide loading state
  if (loadingState) loadingState.style.display = 'none';
  
  // Clear existing notifications
  if (notificationsContainer) {
    notificationsContainer.innerHTML = '';
  }
  
  if (filteredNotifications.length === 0) {
    if (notificationPlaceholder) {
      notificationPlaceholder.style.display = 'flex';
    }
    return;
  }
  
  if (notificationPlaceholder) {
    notificationPlaceholder.style.display = 'none';
  }
  
  // Create notification elements
  filteredNotifications.forEach(notification => {
    const notificationElement = createNotificationElement(notification);
    if (notificationsContainer) {
      notificationsContainer.appendChild(notificationElement);
    }
  });
  
  // Update stats after rendering
  updateStats();
}

// Filter notifications based on filter type
function filterNotifications(notifications, filter) {
  switch (filter) {
    case 'all':
      return notifications;
    case 'unread':
      return notifications.filter(notification => !notification.read);
    case 'matches':
      return notifications.filter(notification => notification.type === 'match');
    case 'venues':
      return notifications.filter(notification => notification.type === 'venue');
    default:
      return notifications;
  }
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
    // Find the notification in our local array
    const notification = notifications.find(n => n.id === notificationId);
    if (!notification) {
      throw new Error('Notification not found');
    }
    
    // Update in database
    await markNotificationAsRead(notificationId);
    
    // Update local state
    notification.read = true;
    
    // Re-render notifications to update UI
    renderNotifications();
    
    console.log(`✅ Marked notification ${notificationId} as read`);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    // Show error to user
    showError('Failed to mark notification as read');
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
  // Show loading indicator
  if (loadingState) {
    loadingState.style.display = 'flex';
  }
  
  // Hide placeholder
  if (notificationPlaceholder) {
    notificationPlaceholder.style.display = 'none';
  }
  
  // Clear notifications container
  const notificationsContainer = document.getElementById('notifications-container');
  if (notificationsContainer) {
    notificationsContainer.innerHTML = '';
  }
}

// Show error state
function showError(message) {
  // Hide loading indicator
  if (loadingState) {
    loadingState.style.display = 'none';
  }
  
  // Show placeholder with error message
  if (notificationPlaceholder) {
    notificationPlaceholder.style.display = 'flex';
    
    const titleEl = notificationPlaceholder.querySelector('.placeholder-title');
    const textEl = notificationPlaceholder.querySelector('.placeholder-text');
    
    if (titleEl) {
      titleEl.textContent = 'Error loading notifications';
    }
    if (textEl) {
      textEl.textContent = message || 'Something went wrong. Please try again.';
    }
  }
}



// Mark all notifications as read
async function markAllAsRead() {
  try {
    // Get user from auth middleware
    const user = authMiddleware.getUser();
    
    if (!user || !user.id) {
      throw new Error('User not authenticated');
    }
    
    // Mark all notifications as read in database
    await markAllNotificationsAsRead(user.id);
    
    // Mark all notifications as read locally
    notifications.forEach(notification => {
      notification.read = true;
    });
    
    // Re-render notifications
    renderNotifications();
    
    console.log('✅ Marked all notifications as read');
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    showError('Failed to mark all notifications as read');
  }
}

// Initialize the page
init();
