import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create Supabase client with admin access
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('Creating Supabase client with service role key...');

// Test the connection
async function testConnection() {
  const { data, error } = await supabase.from('venues').select('*', { count: 'exact' });
  
  if (error) {
    console.error('❌ Supabase connection test failed:', error);
    process.exit(1);
  } else {
    console.log('✅ Supabase test query successful - permissions are working properly');
  }
}

async function applySeedData() {
  await testConnection();
  
  console.log('Starting admin seed data application...');
  
  // Step 1: Create test users in auth.users using admin API
  console.log('\nCreating test users in auth.users...');
  
  const testUsers = [
    {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'user1@example.com',
      phone: '+14155551111',
      password: 'Password123!',
      user_metadata: {
        first_name: 'John',
        last_name: 'Doe'
      }
    },
    {
      id: '00000000-0000-0000-0000-000000000002',
      email: 'user2@example.com',
      phone: '+14155552222',
      password: 'Password123!',
      user_metadata: {
        first_name: 'Jane',
        last_name: 'Smith'
      }
    },
    {
      id: '00000000-0000-0000-0000-000000000003',
      email: 'user3@example.com',
      phone: '+14155553333',
      password: 'Password123!',
      user_metadata: {
        first_name: 'Michael',
        last_name: 'Johnson'
      }
    },
    {
      id: '00000000-0000-0000-0000-000000000004',
      email: 'user4@example.com',
      phone: '+14155554444',
      password: 'Password123!',
      user_metadata: {
        first_name: 'Emily',
        last_name: 'Williams'
      }
    }
  ];
  
  // Create users one by one using the admin API
  for (const user of testUsers) {
    try {
      // Check if user already exists
      const { data: existingUser, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();
      
      if (userError || !existingUser) {
        console.log(`Creating user ${user.email} with ID ${user.id}...`);
        
        // Create user with admin API
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          uuid: user.id,
          email: user.email,
          phone: user.phone,
          password: user.password,
          email_confirm: true,
          phone_confirm: true,
          user_metadata: user.user_metadata
        });
        
        if (createError) {
          console.error(`Error creating user ${user.email}:`, createError);
        } else {
          console.log(`User created: ${newUser.user.email} (${newUser.user.id})`);
          
          // Create profile for user (should be auto-created by trigger, but let's ensure it)
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: user.id,
              display_name: `${user.user_metadata.first_name} ${user.user_metadata.last_name}`,
              full_name: `${user.user_metadata.first_name} ${user.user_metadata.last_name}`,
              avatar_url: `https://randomuser.me/api/portraits/${user.user_metadata.first_name === 'Jane' || user.user_metadata.first_name === 'Emily' ? 'women' : 'men'}/${testUsers.indexOf(user) + 1}.jpg`,
              bio: user.user_metadata.first_name === 'John' ? 'I enjoy hiking and craft beer.' : 
                   user.user_metadata.first_name === 'Jane' ? 'Wine enthusiast and book lover.' :
                   user.user_metadata.first_name === 'Michael' ? 'Foodie and travel addict.' : 
                   'Coffee lover and yoga instructor.',
              birth_date: user.user_metadata.first_name === 'John' ? '1990-01-15' :
                          user.user_metadata.first_name === 'Jane' ? '1992-05-20' :
                          user.user_metadata.first_name === 'Michael' ? '1988-09-10' :
                          '1995-03-25',
              gender: user.user_metadata.first_name === 'Jane' || user.user_metadata.first_name === 'Emily' ? 'female' : 'male',
              interested_in: user.user_metadata.first_name === 'Jane' || user.user_metadata.first_name === 'Emily' ? ['male'] : ['female'],
              location_lat: user.user_metadata.first_name === 'John' ? 37.7749 :
                            user.user_metadata.first_name === 'Jane' ? 37.7922 :
                            user.user_metadata.first_name === 'Michael' ? 37.7599 :
                            37.7833,
              location_lng: user.user_metadata.first_name === 'John' ? -122.4194 :
                            user.user_metadata.first_name === 'Jane' ? -122.4071 :
                            user.user_metadata.first_name === 'Michael' ? -122.4148 :
                            -122.4637,
              is_verified: true
            })
            .select();
          
          if (profileError) {
            console.error(`Error creating profile for ${user.id}:`, profileError);
          } else {
            console.log(`Profile created/updated for ${user.id}`);
          }
        }
      } else {
        console.log(`User ${user.id} already exists in profiles`);
      }
    } catch (error) {
      console.error(`Unexpected error for user ${user.email}:`, error);
    }
  }

  // Step 2: Insert venue data (avoiding the generated location column)
  console.log('\nInserting venue data...');
  const venues = [
    {
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      name: 'The Tipsy Tavern',
      description: 'A cozy pub with a wide selection of craft beers and live music on weekends.',
      address: '123 Main Street',
      city: 'San Francisco',
      state: 'CA',
      postal_code: '94105',
      country: 'USA',
      lat: 37.7749,
      lng: -122.4194,
      // Note: location is generated automatically from lat/lng
      images: ['https://images.unsplash.com/photo-1514933651103-005eec06c04b?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1350&q=80'],
      opening_hours: {
        monday: { open: '16:00', close: '02:00' },
        tuesday: { open: '16:00', close: '02:00' },
        wednesday: { open: '16:00', close: '02:00' },
        thursday: { open: '16:00', close: '02:00' },
        friday: { open: '16:00', close: '03:00' },
        saturday: { open: '14:00', close: '03:00' },
        sunday: { open: '14:00', close: '00:00' }
      },
      phone: '+14155551234',
      website: 'https://tipsytavern.example.com',
      category: 'pub',
      rating: 4.7,
      price_level: 2,
      is_verified: true,
      is_active: true
    },
    {
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
      name: 'Skyline Lounge',
      description: 'Upscale rooftop bar with panoramic city views and signature cocktails.',
      address: '456 Market Street',
      city: 'San Francisco',
      state: 'CA',
      postal_code: '94103',
      country: 'USA',
      lat: 37.7922,
      lng: -122.4071,
      images: ['https://images.unsplash.com/photo-1470337458703-46ad1756a187?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1349&q=80'],
      opening_hours: {
        monday: { open: '17:00', close: '01:00' },
        tuesday: { open: '17:00', close: '01:00' },
        wednesday: { open: '17:00', close: '01:00' },
        thursday: { open: '17:00', close: '02:00' },
        friday: { open: '17:00', close: '02:00' },
        saturday: { open: '16:00', close: '02:00' },
        sunday: { open: '16:00', close: '00:00' }
      },
      phone: '+14155552345',
      website: 'https://skylinelounge.example.com',
      category: 'lounge',
      rating: 4.9,
      price_level: 3,
      is_verified: true,
      is_active: true
    },
    {
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
      name: 'Vineyard Wine Bar',
      description: 'Intimate wine bar featuring local and international wines with cheese pairings.',
      address: '789 Valencia Street',
      city: 'San Francisco',
      state: 'CA',
      postal_code: '94110',
      country: 'USA',
      lat: 37.7599,
      lng: -122.4148,
      images: ['https://images.unsplash.com/photo-1470158499416-75be9aa0c4db?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'],
      opening_hours: {
        monday: { open: 'closed', close: 'closed' },
        tuesday: { open: '16:00', close: '23:00' },
        wednesday: { open: '16:00', close: '23:00' },
        thursday: { open: '16:00', close: '23:00' },
        friday: { open: '16:00', close: '00:00' },
        saturday: { open: '14:00', close: '00:00' },
        sunday: { open: '14:00', close: '22:00' }
      },
      phone: '+14155553456',
      website: 'https://vineyardwinebar.example.com',
      category: 'wine_bar',
      rating: 4.6,
      price_level: 3,
      is_verified: true,
      is_active: true
    },
    {
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14',
      name: 'The Brew House',
      description: 'Microbrewery with house-made craft beers and casual pub food.',
      address: '321 Clement Street',
      city: 'San Francisco',
      state: 'CA',
      postal_code: '94118',
      country: 'USA',
      lat: 37.7833,
      lng: -122.4637,
      images: ['https://images.unsplash.com/photo-1559526324-593bc073d938?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'],
      opening_hours: {
        monday: { open: '12:00', close: '23:00' },
        tuesday: { open: '12:00', close: '23:00' },
        wednesday: { open: '12:00', close: '23:00' },
        thursday: { open: '12:00', close: '23:00' },
        friday: { open: '12:00', close: '00:00' },
        saturday: { open: '11:00', close: '00:00' },
        sunday: { open: '11:00', close: '22:00' }
      },
      phone: '+14155554567',
      website: 'https://brewhouse.example.com',
      category: 'brewery',
      rating: 4.5,
      price_level: 2,
      is_verified: true,
      is_active: true
    },
    {
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15',
      name: 'Neon Nights',
      description: 'Trendy nightclub with top DJs and themed party nights.',
      address: '555 Folsom Street',
      city: 'San Francisco',
      state: 'CA',
      postal_code: '94107',
      country: 'USA',
      lat: 37.7857,
      lng: -122.3996,
      images: ['https://images.unsplash.com/photo-1566737236500-c8ac43014a67?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'],
      opening_hours: {
        monday: { open: 'closed', close: 'closed' },
        tuesday: { open: 'closed', close: 'closed' },
        wednesday: { open: '22:00', close: '04:00' },
        thursday: { open: '22:00', close: '04:00' },
        friday: { open: '22:00', close: '06:00' },
        saturday: { open: '22:00', close: '06:00' },
        sunday: { open: 'closed', close: 'closed' }
      },
      phone: '+14155555678',
      website: 'https://neonnights.example.com',
      category: 'nightclub',
      rating: 4.3,
      price_level: 3,
      is_verified: true,
      is_active: true
    }
  ];

  const { data: venuesData, error: venuesError } = await supabase
    .from('venues')
    .upsert(venues, { onConflict: 'id' })
    .select();

  if (venuesError) {
    console.error('Error inserting venues:', venuesError);
  } else {
    console.log(`Venues inserted/updated: ${venuesData.length}`);
  }

  // Step 3: Insert match data
  console.log('\nInserting match data...');
  const matches = [
    {
      id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      user_id_1: '00000000-0000-0000-0000-000000000001',
      user_id_2: '00000000-0000-0000-0000-000000000002',
      venue_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      status: 'matched',
      matched_at: new Date().toISOString()
    },
    {
      id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
      user_id_1: '00000000-0000-0000-0000-000000000003',
      user_id_2: '00000000-0000-0000-0000-000000000004',
      venue_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
      status: 'matched',
      matched_at: new Date().toISOString()
    }
  ];

  const { data: matchesData, error: matchesError } = await supabase
    .from('matches')
    .upsert(matches, { onConflict: 'id' })
    .select();

  if (matchesError) {
    console.error('Error inserting matches:', matchesError);
  } else {
    console.log(`Matches inserted/updated: ${matchesData.length}`);
  }

  // Step 4: Insert conversation data with correct schema
  console.log('\nInserting conversation data...');
  const conversations = [
    {
      id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      user_id_1: '00000000-0000-0000-0000-000000000001',
      user_id_2: '00000000-0000-0000-0000-000000000002',
      match_id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      last_message_text: 'Hey there! I noticed you at The Tipsy Tavern. Would you like to grab a drink sometime?',
      last_message_at: new Date().toISOString()
    },
    {
      id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
      user_id_1: '00000000-0000-0000-0000-000000000003',
      user_id_2: '00000000-0000-0000-0000-000000000004',
      match_id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
      last_message_text: 'Hello! I saw you at Skyline Lounge yesterday. Would you like to meet up there again?',
      last_message_at: new Date().toISOString()
    }
  ];

  const { data: conversationsData, error: conversationsError } = await supabase
    .from('conversations')
    .upsert(conversations, { onConflict: 'id' })
    .select();

  if (conversationsError) {
    console.error('Error inserting conversations:', conversationsError);
  } else {
    console.log(`Conversations inserted/updated: ${conversationsData.length}`);
  }

  // Step 5: Insert message data with correct schema
  console.log('\nInserting message data...');
  const messages = [
    {
      id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      conversation_id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      sender_id: '00000000-0000-0000-0000-000000000001',
      content: 'Hey there! I noticed you at The Tipsy Tavern. Would you like to grab a drink sometime?',
      created_at: new Date().toISOString()
    },
    {
      id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
      conversation_id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      sender_id: '00000000-0000-0000-0000-000000000002',
      content: 'Hi! That sounds great. When were you thinking?',
      created_at: new Date(Date.now() + 3600000).toISOString() // 1 hour later
    },
    {
      id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
      conversation_id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
      sender_id: '00000000-0000-0000-0000-000000000003',
      content: 'Hello! I saw you at Skyline Lounge yesterday. Would you like to meet up there again?',
      created_at: new Date().toISOString()
    }
  ];

  const { data: messagesData, error: messagesError } = await supabase
    .from('messages')
    .upsert(messages, { onConflict: 'id' })
    .select();

  if (messagesError) {
    console.error('Error inserting messages:', messagesError);
  } else {
    console.log(`Messages inserted/updated: ${messagesData.length}`);
  }

  console.log('\nAll seed data applied successfully!');
}

// Run the function and exit when done
applySeedData().then(() => {
  console.log('Seed data script completed');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
