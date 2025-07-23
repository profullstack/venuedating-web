import { supabase } from '../utils/supabase.js';
import { authMiddleware } from '../middleware/auth-middleware.js';

/**
 * Get user notifications
 */
export async function getUserNotifications(c) {
  try {
    const user = c.get('user');
    
    // Check if notifications table exists
    try {
      // Get notifications from database
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        // If table doesn't exist, return empty array instead of error
        if (error.code === '42P01') { // PostgreSQL code for undefined_table
          console.log('Notifications table does not exist yet, returning empty array');
          return c.json([]);
        }
        
        console.error('Error fetching notifications:', error);
        return c.json({ error: 'Failed to fetch notifications' }, 500);
      }
      
      // Return notifications data
      return c.json(data || []);
    } catch (dbError) {
      // If any other error occurs during the query, return empty array
      console.error('Database error in getUserNotifications:', dbError);
      return c.json([]);
    }
  } catch (error) {
    console.error('Error in getUserNotifications:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(c) {
  try {
    const notificationId = c.req.param('id');
    const user = c.get('user');
    
    // Security check: users can only mark their own notifications as read
    const { data: notification, error: fetchError } = await supabase
      .from('notifications')
      .select('user_id')
      .eq('id', notificationId)
      .single();
    
    if (fetchError) {
      console.error('Error fetching notification:', fetchError);
      return c.json({ error: 'Failed to fetch notification' }, 500);
    }
    
    if (!notification) {
      return c.json({ error: 'Notification not found' }, 404);
    }
    
    if (notification.user_id !== user.id) {
      return c.json({ error: 'Unauthorized access to notification' }, 403);
    }
    
    // Update notification to mark as read
    const { error: updateError } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);
    
    if (updateError) {
      console.error('Error marking notification as read:', updateError);
      return c.json({ error: 'Failed to mark notification as read' }, 500);
    }
    
    // Return success
    return c.json({ success: true });
  } catch (error) {
    console.error('Error in markNotificationAsRead:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(c) {
  try {
    const user = c.get('user');
    
    // Update all unread notifications for the user
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false);
    
    if (error) {
      console.error('Error marking all notifications as read:', error);
      return c.json({ error: 'Failed to mark all notifications as read' }, 500);
    }
    
    // Return success
    return c.json({ success: true });
  } catch (error) {
    console.error('Error in markAllNotificationsAsRead:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
}

// Export notification routes
export const notificationRoutes = [
  {
    method: 'GET',
    path: '/api/notifications',
    handler: getUserNotifications,
    middleware: [authMiddleware]
  },
  {
    method: 'PUT',
    path: '/api/notifications/:id/read',
    handler: markNotificationAsRead,
    middleware: [authMiddleware]
  },
  {
    method: 'PUT',
    path: '/api/notifications/read-all',
    handler: markAllNotificationsAsRead,
    middleware: [authMiddleware]
  }
];
