/**
 * Notifications API module
 * Handles loading, updating, and managing user notifications from Supabase
 */

import { supabaseClientPromise } from '../supabase-client.js';

/**
 * Get user notifications from the database
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Array of notifications
 */
export async function getUserNotifications(userId, options = {}) {
  try {
    const supabase = await supabaseClientPromise;
    
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    // Apply filters
    if (options.type) {
      query = query.eq('type', options.type);
    }
    
    if (options.read !== undefined) {
      query = query.eq('read', options.read);
    }
    
    // Apply limit
    if (options.limit) {
      query = query.limit(options.limit);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
    
    console.log(`📧 Loaded ${data?.length || 0} notifications for user ${userId}`);
    return data || [];
    
  } catch (error) {
    console.error('Error in getUserNotifications:', error);
    throw error;
  }
}

/**
 * Mark a notification as read
 * @param {string} notificationId - Notification ID
 * @returns {Promise<Object>} Updated notification
 */
export async function markNotificationAsRead(notificationId) {
  try {
    const supabase = await supabaseClientPromise;
    
    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
      .select()
      .single();
    
    if (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
    
    console.log(`✅ Marked notification ${notificationId} as read`);
    return data;
    
  } catch (error) {
    console.error('Error in markNotificationAsRead:', error);
    throw error;
  }
}

/**
 * Mark all notifications as read for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Updated notifications
 */
export async function markAllNotificationsAsRead(userId) {
  try {
    const supabase = await supabaseClientPromise;
    
    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false)
      .select();
    
    if (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
    
    console.log(`✅ Marked ${data?.length || 0} notifications as read for user ${userId}`);
    return data || [];
    
  } catch (error) {
    console.error('Error in markAllNotificationsAsRead:', error);
    throw error;
  }
}

/**
 * Delete a notification
 * @param {string} notificationId - Notification ID
 * @returns {Promise<boolean>} Success status
 */
export async function deleteNotification(notificationId) {
  try {
    const supabase = await supabaseClientPromise;
    
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);
    
    if (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
    
    console.log(`🗑️ Deleted notification ${notificationId}`);
    return true;
    
  } catch (error) {
    console.error('Error in deleteNotification:', error);
    throw error;
  }
}

/**
 * Get notification counts by type and read status
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Notification counts
 */
export async function getNotificationCounts(userId) {
  try {
    const supabase = await supabaseClientPromise;
    
    // Get all notifications for the user
    const { data, error } = await supabase
      .from('notifications')
      .select('type, read')
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error fetching notification counts:', error);
      throw error;
    }
    
    // Calculate counts
    const counts = {
      total: data?.length || 0,
      unread: data?.filter(n => !n.read).length || 0,
      matches: data?.filter(n => n.type === 'match').length || 0,
      venues: data?.filter(n => n.type === 'venue').length || 0,
      system: data?.filter(n => n.type === 'system').length || 0,
      messages: data?.filter(n => n.type === 'message').length || 0
    };
    
    console.log(`📊 Notification counts for user ${userId}:`, counts);
    return counts;
    
  } catch (error) {
    console.error('Error in getNotificationCounts:', error);
    throw error;
  }
}

/**
 * Create a new notification (for system use)
 * @param {Object} notification - Notification data
 * @returns {Promise<Object>} Created notification
 */
export async function createNotification(notification) {
  try {
    const supabase = await supabaseClientPromise;
    
    const { data, error } = await supabase
      .from('notifications')
      .insert([{
        user_id: notification.userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data || {},
        read: false
      }])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
    
    console.log(`📧 Created notification for user ${notification.userId}:`, data.title);
    return data;
    
  } catch (error) {
    console.error('Error in createNotification:', error);
    throw error;
  }
}
