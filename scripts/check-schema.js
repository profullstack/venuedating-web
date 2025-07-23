import { supabase } from '../src/utils/supabase.js';

async function checkSchema() {
  console.log('Checking database schema...');
  
  // Check users table
  console.log('\nChecking users table:');
  try {
    const { data: users, error } = await supabase.from('users').select('*').limit(1);
    if (error) {
      console.log('Error querying users:', error);
    } else {
      console.log('Users table exists. Sample columns:', Object.keys(users[0] || {}).join(', '));
      console.log('User count:', users.length);
    }
  } catch (err) {
    console.log('Error checking users table:', err.message);
  }

  // Check matches table
  console.log('\nChecking matches table:');
  try {
    const { data: matches, error } = await supabase.from('matches').select('*').limit(1);
    if (error) {
      console.log('Error querying matches:', error);
    } else {
      console.log('Matches table exists. Sample columns:', Object.keys(matches[0] || {}).join(', '));
    }
  } catch (err) {
    console.log('Error checking matches table:', err.message);
  }

  // Check conversations table
  console.log('\nChecking conversations table:');
  try {
    const { data: conversations, error } = await supabase.from('conversations').select('*').limit(1);
    if (error) {
      console.log('Error querying conversations:', error);
    } else {
      console.log('Conversations table exists. Sample columns:', Object.keys(conversations[0] || {}).join(', '));
    }
  } catch (err) {
    console.log('Error checking conversations table:', err.message);
  }

  // Check messages table
  console.log('\nChecking messages table:');
  try {
    const { data: messages, error } = await supabase.from('messages').select('*').limit(1);
    if (error) {
      console.log('Error querying messages:', error);
    } else {
      console.log('Messages table exists. Sample columns:', Object.keys(messages[0] || {}).join(', '));
    }
  } catch (err) {
    console.log('Error checking messages table:', err.message);
  }

  // Check notifications table
  console.log('\nChecking notifications table:');
  try {
    const { data: notifications, error } = await supabase.from('notifications').select('*').limit(1);
    if (error) {
      console.log('Error querying notifications:', error);
    } else {
      console.log('Notifications table exists. Sample columns:', Object.keys(notifications[0] || {}).join(', '));
    }
  } catch (err) {
    console.log('Error checking notifications table:', err.message);
  }
}

// Run the function and exit when done
checkSchema().then(() => {
  console.log('\nSchema check completed');
  process.exit(0);
}).catch(error => {
  console.error('\nFatal error:', error);
  process.exit(1);
});
