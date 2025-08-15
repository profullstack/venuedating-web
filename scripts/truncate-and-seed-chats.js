#!/usr/bin/env node

/**
 * Truncate Database and Seed Chat Data
 * 
 * This script safely truncates relevant tables and seeds the database
 * with test users, profiles, matches, conversations, and messages
 * for chat functionality testing.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env file');
  console.log('Available env vars:', Object.keys(process.env).filter(k => k.includes('SUPABASE')));
  process.exit(1);
}

// Create Supabase client with service key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Test user data
const testUsers = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    phone: '+15551234567',
    profile: {
      display_name: 'Alex Johnson',
      full_name: 'Alex Johnson',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      bio: 'Love exploring new bars and meeting interesting people! 📸🍺',
      birth_date: '1995-03-15',
      location_lat: 37.7749,
      location_lng: -122.4194,
      bypass_otp: true
    }
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    phone: '+15551234568',
    profile: {
      display_name: 'Sarah Chen',
      full_name: 'Sarah Chen',
      avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
      bio: 'Wine enthusiast and foodie. Always up for trying new places! 🍷✨',
      birth_date: '1992-07-22',
      location_lat: 37.7849,
      location_lng: -122.4094,
      bypass_otp: true
    }
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    phone: '+15551234569',
    profile: {
      display_name: 'Mike Rodriguez',
      full_name: 'Mike Rodriguez',
      avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      bio: 'Sports fan and craft cocktail lover. Let\'s grab a drink! 🏈🍸',
      birth_date: '1988-11-08',
      location_lat: 37.7649,
      location_lng: -122.4294,
      bypass_otp: true
    }
  }
];

// Match data
const matches = [
  {
    id: 'c0000000-0000-0000-0000-000000000001',
    user1_id: '00000000-0000-0000-0000-000000000001', // Alex
    user2_id: '00000000-0000-0000-0000-000000000002', // Sarah
    status: 'active',
    matched_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
  },
  {
    id: 'c0000000-0000-0000-0000-000000000002',
    user1_id: '00000000-0000-0000-0000-000000000002', // Sarah
    user2_id: '00000000-0000-0000-0000-000000000003', // Mike
    status: 'active',
    matched_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
  }
];

// Conversation data
const conversations = [
  {
    id: 'd0000000-0000-0000-0000-000000000001',
    user_id_1: '00000000-0000-0000-0000-000000000001', // Alex
    user_id_2: '00000000-0000-0000-0000-000000000002', // Sarah
    match_id: 'c0000000-0000-0000-0000-000000000001',
    last_message_text: 'That sounds perfect! See you at 7pm 😊',
    last_message_at: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    user_1_unread_count: 0,
    user_2_unread_count: 1,
    is_active: true
  },
  {
    id: 'd0000000-0000-0000-0000-000000000002',
    user_id_1: '00000000-0000-0000-0000-000000000002', // Sarah
    user_id_2: '00000000-0000-0000-0000-000000000003', // Mike
    match_id: 'c0000000-0000-0000-0000-000000000002',
    last_message_text: 'I love their wine selection! Have you tried the Pinot Noir?',
    last_message_at: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    user_1_unread_count: 1,
    user_2_unread_count: 0,
    is_active: true
  }
];

// Message data
const messages = [
  // Conversation 1: Alex and Sarah
  {
    id: 'e0000000-0000-0000-0000-000000000001',
    conversation_id: 'd0000000-0000-0000-0000-000000000001',
    sender_id: '00000000-0000-0000-0000-000000000001', // Alex
    message_type: 'text',
    content: 'Hey Sarah! Great to match with you at The Tipsy Tavern. How did you like it there?',
    is_read: true,
    read_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
  },
  {
    id: 'e0000000-0000-0000-0000-000000000002',
    conversation_id: 'd0000000-0000-0000-0000-000000000001',
    sender_id: '00000000-0000-0000-0000-000000000002', // Sarah
    message_type: 'text',
    content: 'Hi Alex! I loved the atmosphere there. The live music was amazing! 🎵',
    is_read: true,
    read_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
    created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000)
  },
  {
    id: 'e0000000-0000-0000-0000-000000000003',
    conversation_id: 'd0000000-0000-0000-0000-000000000001',
    sender_id: '00000000-0000-0000-0000-000000000001', // Alex
    message_type: 'text',
    content: 'Right? I\'m a photographer so I really appreciate good ambiance. Did you try their craft beer selection?',
    is_read: true,
    read_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
    created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000)
  },
  {
    id: 'e0000000-0000-0000-0000-000000000004',
    conversation_id: 'd0000000-0000-0000-0000-000000000001',
    sender_id: '00000000-0000-0000-0000-000000000002', // Sarah
    message_type: 'text',
    content: 'I\'m more of a wine person actually! But their beer selection looked impressive. Photography sounds interesting - what do you like to shoot?',
    is_read: true,
    read_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000)
  },
  {
    id: 'e0000000-0000-0000-0000-000000000005',
    conversation_id: 'd0000000-0000-0000-0000-000000000001',
    sender_id: '00000000-0000-0000-0000-000000000001', // Alex
    message_type: 'text',
    content: 'Mostly urban landscapes and street photography. SF has so many great spots! Wine is great too - maybe we could check out that Vineyard Wine Bar sometime?',
    is_read: true,
    read_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
    created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
  },
  {
    id: 'e0000000-0000-0000-0000-000000000006',
    conversation_id: 'd0000000-0000-0000-0000-000000000001',
    sender_id: '00000000-0000-0000-0000-000000000002', // Sarah
    message_type: 'text',
    content: 'That sounds wonderful! I actually love wine tasting. When were you thinking?',
    is_read: true,
    read_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000)
  },
  {
    id: 'e0000000-0000-0000-0000-000000000007',
    conversation_id: 'd0000000-0000-0000-0000-000000000001',
    sender_id: '00000000-0000-0000-0000-000000000001', // Alex
    message_type: 'text',
    content: 'How about this Friday evening? Around 7pm?',
    is_read: true,
    read_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000),
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
  },
  {
    id: 'e0000000-0000-0000-0000-000000000008',
    conversation_id: 'd0000000-0000-0000-0000-000000000001',
    sender_id: '00000000-0000-0000-0000-000000000002', // Sarah
    message_type: 'text',
    content: 'That sounds perfect! See you at 7pm 😊',
    is_read: false,
    read_at: null,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000)
  },
  // Conversation 2: Sarah and Mike
  {
    id: 'e0000000-0000-0000-0000-000000000009',
    conversation_id: 'd0000000-0000-0000-0000-000000000002',
    sender_id: '00000000-0000-0000-0000-000000000003', // Mike
    message_type: 'text',
    content: 'Hey Sarah! Saw we both were at Vineyard Wine Bar. What\'s your favorite wine there?',
    is_read: true,
    read_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
  },
  {
    id: 'e0000000-0000-0000-0000-000000000010',
    conversation_id: 'd0000000-0000-0000-0000-000000000002',
    sender_id: '00000000-0000-0000-0000-000000000002', // Sarah
    message_type: 'text',
    content: 'I love their wine selection! Have you tried the Pinot Noir?',
    is_read: false,
    read_at: null,
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000)
  }
];

/**
 * Truncate tables in correct order (respecting foreign key constraints)
 */
async function truncateTables() {
  console.log('🗑️  Truncating tables...');
  
  const tables = [
    'messages',
    'conversations', 
    'matches',
    'profiles'
  ];

  for (const table of tables) {
    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records
      
      if (error) {
        console.warn(`⚠️  Warning truncating ${table}:`, error.message);
      } else {
        console.log(`✅ Truncated ${table}`);
      }
    } catch (err) {
      console.warn(`⚠️  Warning truncating ${table}:`, err.message);
    }
  }

  // Delete auth users (requires admin API)
  try {
    const { data: users } = await supabase.auth.admin.listUsers();
    for (const user of users.users || []) {
      if (user.id.startsWith('00000000-0000-0000-0000-00000000000')) {
        await supabase.auth.admin.deleteUser(user.id);
        console.log(`✅ Deleted auth user: ${user.phone || user.email}`);
      }
    }
  } catch (err) {
    console.warn('⚠️  Warning deleting auth users:', err.message);
  }
}

/**
 * Create auth users
 */
async function createAuthUsers() {
  console.log('👤 Creating auth users...');
  
  for (const user of testUsers) {
    try {
      const { data, error } = await supabase.auth.admin.createUser({
        user_id: user.id,
        phone: user.phone,
        phone_confirm: true,
        user_metadata: {
          full_name: user.profile.full_name,
          avatar_url: user.profile.avatar_url
        }
      });

      if (error) {
        console.error(`❌ Error creating user ${user.phone}:`, error.message);
      } else {
        console.log(`✅ Created auth user: ${user.phone}`);
      }
    } catch (err) {
      console.error(`❌ Error creating user ${user.phone}:`, err.message);
    }
  }
}

/**
 * Create user profiles
 */
async function createProfiles() {
  console.log('📋 Creating user profiles...');
  
  const profileData = testUsers.map(user => ({
    id: user.id,
    ...user.profile,
    created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString()
  }));

  const { data, error } = await supabase
    .from('profiles')
    .insert(profileData);

  if (error) {
    console.error('❌ Error creating profiles:', error.message);
  } else {
    console.log(`✅ Created ${profileData.length} profiles`);
  }
}

/**
 * Create matches
 */
async function createMatches() {
  console.log('💕 Creating matches...');
  
  const matchData = matches.map(match => ({
    ...match,
    created_at: match.matched_at.toISOString(),
    updated_at: match.matched_at.toISOString()
  }));

  const { data, error } = await supabase
    .from('matches')
    .insert(matchData);

  if (error) {
    console.error('❌ Error creating matches:', error.message);
  } else {
    console.log(`✅ Created ${matchData.length} matches`);
  }
}

/**
 * Create conversations
 */
async function createConversations() {
  console.log('💬 Creating conversations...');
  
  const conversationData = conversations.map(conv => ({
    ...conv,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: conv.last_message_at.toISOString()
  }));

  const { data, error } = await supabase
    .from('conversations')
    .insert(conversationData);

  if (error) {
    console.error('❌ Error creating conversations:', error.message);
  } else {
    console.log(`✅ Created ${conversationData.length} conversations`);
  }
}

/**
 * Create messages
 */
async function createMessages() {
  console.log('💭 Creating messages...');
  
  const messageData = messages.map(msg => ({
    ...msg,
    created_at: msg.created_at.toISOString(),
    updated_at: msg.created_at.toISOString(),
    read_at: msg.read_at ? msg.read_at.toISOString() : null
  }));

  const { data, error } = await supabase
    .from('messages')
    .insert(messageData);

  if (error) {
    console.error('❌ Error creating messages:', error.message);
  } else {
    console.log(`✅ Created ${messageData.length} messages`);
  }
}

/**
 * Update conversation statistics
 */
async function updateConversationStats() {
  console.log('📊 Updating conversation statistics...');
  
  for (const conv of conversations) {
    // Count unread messages for each user
    const user1UnreadCount = messages.filter(m => 
      m.conversation_id === conv.id && 
      m.sender_id === conv.user_id_2 && 
      !m.is_read
    ).length;
    
    const user2UnreadCount = messages.filter(m => 
      m.conversation_id === conv.id && 
      m.sender_id === conv.user_id_1 && 
      !m.is_read
    ).length;

    const { error } = await supabase
      .from('conversations')
      .update({
        user_1_unread_count: user1UnreadCount,
        user_2_unread_count: user2UnreadCount
      })
      .eq('id', conv.id);

    if (error) {
      console.error(`❌ Error updating conversation stats for ${conv.id}:`, error.message);
    }
  }
  
  console.log('✅ Updated conversation statistics');
}

/**
 * Main execution function
 */
async function main() {
  console.log('🚀 Starting database truncate and seed process...\n');
  
  try {
    // Step 1: Truncate existing data
    await truncateTables();
    console.log('');
    
    // Step 2: Create auth users
    await createAuthUsers();
    console.log('');
    
    // Step 3: Create profiles
    await createProfiles();
    console.log('');
    
    // Step 4: Create matches
    await createMatches();
    console.log('');
    
    // Step 5: Create conversations
    await createConversations();
    console.log('');
    
    // Step 6: Create messages
    await createMessages();
    console.log('');
    
    // Step 7: Update conversation statistics
    await updateConversationStats();
    console.log('');
    
    console.log('🎉 Database seeding completed successfully!');
    console.log('');
    console.log('📱 Test Accounts Created:');
    console.log('  Alex Johnson: +15551234567 (OTP: 123456)');
    console.log('  Sarah Chen:   +15551234568 (OTP: 123456) ← Most active');
    console.log('  Mike Rodriguez: +15551234569 (OTP: 123456)');
    console.log('');
    console.log('💬 Chat Data:');
    console.log('  • 2 active matches');
    console.log('  • 2 conversations');
    console.log('  • 10 realistic messages');
    console.log('  • Proper read/unread status');
    console.log('');
    console.log('🔐 Login with any phone number above using OTP code: 123456');
    
  } catch (error) {
    console.error('❌ Error during seeding process:', error);
    process.exit(1);
  }
}

// Run the script
main().catch(console.error);
