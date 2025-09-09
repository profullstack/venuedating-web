import { supabase } from '../src/utils/supabase.js';

async function applySeedData() {
  console.log('Starting complete seed data application...');
  
  // Step 1: Create test users
  console.log('Creating test users...');
  const testUsers = [
    {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'user1@example.com',
      phone: '+14155551111',
      first_name: 'John',
      last_name: 'Doe',
      birthday: '1990-01-15',
      gender: 'male',
      looking_for: ['female'],
      bio: 'I enjoy hiking and craft beer.',
      images: ['https://randomuser.me/api/portraits/men/1.jpg'],
      location: 'POINT(-122.4194 37.7749)',
      is_verified: true,
      is_active: true
    },
    {
      id: '00000000-0000-0000-0000-000000000002',
      email: 'user2@example.com',
      phone: '+14155552222',
      first_name: 'Jane',
      last_name: 'Smith',
      birthday: '1992-05-20',
      gender: 'female',
      looking_for: ['male'],
      bio: 'Wine enthusiast and book lover.',
      images: ['https://randomuser.me/api/portraits/women/1.jpg'],
      location: 'POINT(-122.4071 37.7922)',
      is_verified: true,
      is_active: true
    },
    {
      id: '00000000-0000-0000-0000-000000000003',
      email: 'user3@example.com',
      phone: '+14155553333',
      first_name: 'Michael',
      last_name: 'Johnson',
      birthday: '1988-09-10',
      gender: 'male',
      looking_for: ['female'],
      bio: 'Foodie and travel addict.',
      images: ['https://randomuser.me/api/portraits/men/2.jpg'],
      location: 'POINT(-122.4148 37.7599)',
      is_verified: true,
      is_active: true
    },
    {
      id: '00000000-0000-0000-0000-000000000004',
      email: 'user4@example.com',
      phone: '+14155554444',
      first_name: 'Emily',
      last_name: 'Williams',
      birthday: '1995-03-25',
      gender: 'female',
      looking_for: ['male'],
      bio: 'Coffee lover and yoga instructor.',
      images: ['https://randomuser.me/api/portraits/women/2.jpg'],
      location: 'POINT(-122.4637 37.7833)',
      is_verified: true,
      is_active: true
    }
  ];

  const { data: usersData, error: usersError } = await supabase
    .from('users')
    .upsert(testUsers)
    .select();

  if (usersError) {
    console.error('Error inserting users:', usersError);
  } else {
    console.log(`Users inserted: ${usersData.length}`);
  }

  // Step 2: Insert venue data (already working)
  console.log('Inserting venue data...');
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
      location: 'POINT(-122.4194 37.7749)',
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
      location: 'POINT(-122.4071 37.7922)',
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
      location: 'POINT(-122.4148 37.7599)',
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
      location: 'POINT(-122.4637 37.7833)',
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
      location: 'POINT(-122.3996 37.7857)',
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
    .upsert(venues)
    .select();

  if (venuesError) {
    console.error('Error inserting venues:', venuesError);
  } else {
    console.log(`Venues inserted: ${venuesData.length}`);
  }

  // Step 3: Insert match data with correct schema
  console.log('Inserting match data...');
  const matches = [
    {
      id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      user_id_1: '00000000-0000-0000-0000-000000000001',
      user_id_2: '00000000-0000-0000-0000-000000000002',
      venue_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      status: 'matched',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
      user_id_1: '00000000-0000-0000-0000-000000000003',
      user_id_2: '00000000-0000-0000-0000-000000000004',
      venue_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
      status: 'matched',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  const { data: matchesData, error: matchesError } = await supabase
    .from('matches')
    .upsert(matches)
    .select();

  if (matchesError) {
    console.error('Error inserting matches:', matchesError);
  } else {
    console.log(`Matches inserted: ${matchesData.length}`);
  }

  // Step 4: Insert conversation data with correct schema
  console.log('Inserting conversation data...');
  const conversations = [
    {
      id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      match_id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
      match_id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  const { data: conversationsData, error: conversationsError } = await supabase
    .from('conversations')
    .upsert(conversations)
    .select();

  if (conversationsError) {
    console.error('Error inserting conversations:', conversationsError);
  } else {
    console.log(`Conversations inserted: ${conversationsData.length}`);
  }

  // Step 5: Insert message data with correct schema
  console.log('Inserting message data...');
  const messages = [
    {
      id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      conversation_id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      sender_id: '00000000-0000-0000-0000-000000000001',
      content: 'Hey there! I noticed you at The Tipsy Tavern. Would you like to grab a drink sometime?',
      created_at: new Date().toISOString(),
      is_read: false
    },
    {
      id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
      conversation_id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      sender_id: '00000000-0000-0000-0000-000000000002',
      content: 'Hi! That sounds great. When were you thinking?',
      created_at: new Date(Date.now() + 3600000).toISOString(), // 1 hour later
      is_read: false
    },
    {
      id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
      conversation_id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
      sender_id: '00000000-0000-0000-0000-000000000003',
      content: 'Hello! I saw you at Skyline Lounge yesterday. Would you like to meet up there again?',
      created_at: new Date().toISOString(),
      is_read: false
    }
  ];

  const { data: messagesData, error: messagesError } = await supabase
    .from('messages')
    .upsert(messages)
    .select();

  if (messagesError) {
    console.error('Error inserting messages:', messagesError);
  } else {
    console.log(`Messages inserted: ${messagesData.length}`);
  }

  // Step 6: Create notifications table if it doesn't exist
  console.log('Creating notifications table if it does not exist...');
  const { error: createTableError } = await supabase.rpc('create_notifications_table_if_not_exists');
  
  if (createTableError) {
    console.error('Error creating notifications table:', createTableError);
    
    // Try an alternative approach using raw SQL
    console.log('Attempting to create notifications table using raw SQL...');
    const { error: rawSqlError } = await supabase.rpc('execute_sql', { 
      sql: `
        CREATE TABLE IF NOT EXISTS public.notifications (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL REFERENCES public.users(id),
          type VARCHAR(50) NOT NULL,
          content JSONB NOT NULL,
          is_read BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES public.users(id)
        );
      `
    });
    
    if (rawSqlError) {
      console.error('Error creating notifications table with raw SQL:', rawSqlError);
    } else {
      console.log('Notifications table created successfully with raw SQL');
    }
  } else {
    console.log('Notifications table created or already exists');
  }

  // Step 7: Insert notification data
  console.log('Inserting notification data...');
  const notifications = [
    {
      user_id: '00000000-0000-0000-0000-000000000001',
      type: 'match',
      content: {
        match_id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        other_user_id: '00000000-0000-0000-0000-000000000002',
        venue_name: 'The Tipsy Tavern'
      },
      is_read: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      user_id: '00000000-0000-0000-0000-000000000002',
      type: 'match',
      content: {
        match_id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        other_user_id: '00000000-0000-0000-0000-000000000001',
        venue_name: 'The Tipsy Tavern'
      },
      is_read: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      user_id: '00000000-0000-0000-0000-000000000003',
      type: 'match',
      content: {
        match_id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
        other_user_id: '00000000-0000-0000-0000-000000000004',
        venue_name: 'Skyline Lounge'
      },
      is_read: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      user_id: '00000000-0000-0000-0000-000000000001',
      type: 'message',
      content: {
        conversation_id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        sender_id: '00000000-0000-0000-0000-000000000002',
        preview: 'Hi! That sounds great. When were...'
      },
      is_read: false,
      created_at: new Date(Date.now() + 3600000).toISOString(), // 1 hour later
      updated_at: new Date(Date.now() + 3600000).toISOString()
    }
  ];

  const { data: notificationsData, error: notificationsError } = await supabase
    .from('notifications')
    .upsert(notifications)
    .select();

  if (notificationsError) {
    console.error('Error inserting notifications:', notificationsError);
  } else {
    console.log(`Notifications inserted: ${notificationsData ? notificationsData.length : 0}`);
  }

  console.log('All seed data applied successfully!');
}

// Run the function and exit when done
applySeedData().then(() => {
  console.log('Seed data script completed');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
