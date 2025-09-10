import { supabase } from '../src/utils/supabase.js';

async function applySeedData() {
  console.log('Starting seed data application...');

  try {
    // Seed data for venues
    console.log('Inserting venue data...');
    const venuesResult = await supabase.from('venues').insert([
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
        images: ['https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=1000', 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?q=80&w=1000'],
        opening_hours: {
          monday: '16:00-00:00',
          tuesday: '16:00-00:00',
          wednesday: '16:00-00:00',
          thursday: '16:00-02:00',
          friday: '16:00-02:00',
          saturday: '14:00-02:00',
          sunday: '14:00-00:00'
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
        images: ['https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?q=80&w=1000', 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?q=80&w=1000'],
        opening_hours: {
          monday: '17:00-01:00',
          tuesday: '17:00-01:00',
          wednesday: '17:00-01:00',
          thursday: '17:00-02:00',
          friday: '17:00-02:00',
          saturday: '16:00-02:00',
          sunday: '16:00-00:00'
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
        images: ['https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=1000', 'https://images.unsplash.com/photo-1567072379583-c0787ba69786?q=80&w=1000'],
        opening_hours: {
          monday: 'closed',
          tuesday: '17:00-23:00',
          wednesday: '17:00-23:00',
          thursday: '17:00-23:00',
          friday: '17:00-00:00',
          saturday: '15:00-00:00',
          sunday: '15:00-22:00'
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
        images: ['https://images.unsplash.com/photo-1559526324-593bc073d938?q=80&w=1000', 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?q=80&w=1000'],
        opening_hours: {
          monday: '16:00-23:00',
          tuesday: '16:00-23:00',
          wednesday: '16:00-23:00',
          thursday: '16:00-00:00',
          friday: '16:00-01:00',
          saturday: '12:00-01:00',
          sunday: '12:00-22:00'
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
        images: ['https://images.unsplash.com/photo-1566737236500-c8ac43014a67?q=80&w=1000', 'https://images.unsplash.com/photo-1571204829887-3b8d69e23af5?q=80&w=1000'],
        opening_hours: {
          monday: 'closed',
          tuesday: 'closed',
          wednesday: 'closed',
          thursday: '22:00-03:00',
          friday: '22:00-04:00',
          saturday: '22:00-04:00',
          sunday: '21:00-02:00'
        },
        phone: '+14155555678',
        website: 'https://neonnights.example.com',
        category: 'nightclub',
        rating: 4.3,
        price_level: 3,
        is_verified: true,
        is_active: true
      }
    ]).select();
    console.log('Venues inserted:', venuesResult);

    // Seed data for matches
    console.log('Inserting match data...');
    const matchesResult = await supabase.from('matches').insert([
      {
        id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a21',
        user_id_1: '00000000-0000-0000-0000-000000000001',
        user_id_2: '00000000-0000-0000-0000-000000000002',
        venue_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        status: 'matched',
        matched_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
        user_id_1: '00000000-0000-0000-0000-000000000002',
        user_id_2: '00000000-0000-0000-0000-000000000001',
        venue_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        status: 'matched',
        matched_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a23',
        user_id_1: '00000000-0000-0000-0000-000000000001',
        user_id_2: '00000000-0000-0000-0000-000000000003',
        venue_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
        status: 'matched',
        matched_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a24',
        user_id_1: '00000000-0000-0000-0000-000000000003',
        user_id_2: '00000000-0000-0000-0000-000000000001',
        venue_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
        status: 'matched',
        matched_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a25',
        user_id_1: '00000000-0000-0000-0000-000000000001',
        user_id_2: '00000000-0000-0000-0000-000000000004',
        venue_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
        status: 'liked',
        matched_at: null
      },
      {
        id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a26',
        user_id_1: '00000000-0000-0000-0000-000000000002',
        user_id_2: '00000000-0000-0000-0000-000000000003',
        venue_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14',
        status: 'liked',
        matched_at: null
      },
      {
        id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a27',
        user_id_1: '00000000-0000-0000-0000-000000000005',
        user_id_2: '00000000-0000-0000-0000-000000000001',
        venue_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15',
        status: 'liked',
        matched_at: null
      }
    ]).select();
    console.log('Matches inserted:', matchesResult);

    // Seed data for conversations
    console.log('Inserting conversation data...');
    const conversationsResult = await supabase.from('conversations').insert([
      {
        id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a31',
        participant_1: '00000000-0000-0000-0000-000000000001',
        participant_2: '00000000-0000-0000-0000-000000000002',
        last_message: 'Hey, are you going to The Tipsy Tavern tonight?',
        last_message_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a32',
        participant_1: '00000000-0000-0000-0000-000000000001',
        participant_2: '00000000-0000-0000-0000-000000000003',
        last_message: 'The view at Skyline Lounge was amazing!',
        last_message_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
      }
    ]).select();
    console.log('Conversations inserted:', conversationsResult);

    // Seed data for messages
    console.log('Inserting message data...');
    const messagesResult = await supabase.from('messages').insert([
      {
        id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a41',
        conversation_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a31',
        sender_id: '00000000-0000-0000-0000-000000000001',
        content: 'Hi there! We matched at The Tipsy Tavern.',
        read: true
      },
      {
        id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a42',
        conversation_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a31',
        sender_id: '00000000-0000-0000-0000-000000000002',
        content: 'Hey! Yes, I remember. That was a fun night!',
        read: true
      },
      {
        id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a43',
        conversation_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a31',
        sender_id: '00000000-0000-0000-0000-000000000001',
        content: 'Would you like to meet up there again sometime?',
        read: true
      },
      {
        id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
        conversation_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a31',
        sender_id: '00000000-0000-0000-0000-000000000002',
        content: 'Definitely! How about this weekend?',
        read: true
      },
      {
        id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a45',
        conversation_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a31',
        sender_id: '00000000-0000-0000-0000-000000000001',
        content: 'Hey, are you going to The Tipsy Tavern tonight?',
        read: false
      },
      {
        id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a46',
        conversation_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a32',
        sender_id: '00000000-0000-0000-0000-000000000003',
        content: 'Hi! We matched at Skyline Lounge.',
        read: true
      },
      {
        id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a47',
        conversation_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a32',
        sender_id: '00000000-0000-0000-0000-000000000001',
        content: 'Hello! Yes, that place has an amazing view!',
        read: true
      },
      {
        id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a48',
        conversation_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a32',
        sender_id: '00000000-0000-0000-0000-000000000003',
        content: 'Have you tried their signature cocktails?',
        read: true
      },
      {
        id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a49',
        conversation_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a32',
        sender_id: '00000000-0000-0000-0000-000000000001',
        content: 'The view at Skyline Lounge was amazing!',
        read: false
      }
    ]).select();
    console.log('Messages inserted:', messagesResult);

    // Seed data for notifications
    console.log('Inserting notification data...');
    const notificationsResult = await supabase.from('notifications').insert([
      {
        id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a51',
        user_id: '00000000-0000-0000-0000-000000000001',
        type: 'match',
        title: 'New Match!',
        message: 'You matched with Test User 2 at The Tipsy Tavern!',
        read: true
      },
      {
        id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a52',
        user_id: '00000000-0000-0000-0000-000000000002',
        type: 'match',
        title: 'New Match!',
        message: 'You matched with Test User 1 at The Tipsy Tavern!',
        read: false
      },
      {
        id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a53',
        user_id: '00000000-0000-0000-0000-000000000001',
        type: 'match',
        title: 'New Match!',
        message: 'You matched with Test User 3 at Skyline Lounge!',
        read: true
      },
      {
        id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a54',
        user_id: '00000000-0000-0000-0000-000000000003',
        type: 'match',
        title: 'New Match!',
        message: 'You matched with Test User 1 at Skyline Lounge!',
        read: false
      },
      {
        id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55',
        user_id: '00000000-0000-0000-0000-000000000001',
        type: 'message',
        title: 'New Message',
        message: 'Test User 2 sent you a message: "Hey! Yes, I remember. That was a fun night!"',
        read: true
      },
      {
        id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a56',
        user_id: '00000000-0000-0000-0000-000000000002',
        type: 'message',
        title: 'New Message',
        message: 'Test User 1 sent you a message: "Would you like to meet up there again sometime?"',
        read: false
      },
      {
        id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a57',
        user_id: '00000000-0000-0000-0000-000000000001',
        type: 'system',
        title: 'Welcome to BarCrush!',
        message: 'Complete your profile to start matching with people at your favorite venues.',
        read: true
      },
      {
        id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a58',
        user_id: '00000000-0000-0000-0000-000000000002',
        type: 'system',
        title: 'Welcome to BarCrush!',
        message: 'Complete your profile to start matching with people at your favorite venues.',
        read: true
      },
      {
        id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a59',
        user_id: '00000000-0000-0000-0000-000000000003',
        type: 'system',
        title: 'Welcome to BarCrush!',
        message: 'Complete your profile to start matching with people at your favorite venues.',
        read: true
      },
      {
        id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a5a',
        user_id: '00000000-0000-0000-0000-000000000004',
        type: 'system',
        title: 'Welcome to BarCrush!',
        message: 'Complete your profile to start matching with people at your favorite venues.',
        read: true
      },
      {
        id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a5b',
        user_id: '00000000-0000-0000-0000-000000000005',
        type: 'system',
        title: 'Welcome to BarCrush!',
        message: 'Complete your profile to start matching with people at your favorite venues.',
        read: true
      }
    ]).select();
    console.log('Notifications inserted:', notificationsResult);

    console.log('All seed data applied successfully!');
  } catch (error) {
    console.error('Error applying seed data:', error);
  }
}

applySeedData().then(() => {
  console.log('Seed data script completed');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
