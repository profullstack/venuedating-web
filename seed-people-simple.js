import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Sample people data to seed (without predefined IDs)
const peopleData = [
  // The Tipsy Tavern crowd (pub/casual)
  {
    email: 'alex.chen@example.com',
    display_name: 'Alex',
    full_name: 'Alex Chen',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
    bio: 'Software engineer who loves craft beer and live music. Always up for trivia night!',
    birth_date: '1992-03-15',
    gender: 'male',
    interested_in: ['female', 'non-binary'],
    venue_name: 'The Tipsy Tavern'
  },
  {
    email: 'sarah.martinez@example.com',
    display_name: 'Sarah',
    full_name: 'Sarah Martinez',
    avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face',
    bio: 'Marketing manager and beer enthusiast. Love discovering new breweries and live bands.',
    birth_date: '1989-07-22',
    gender: 'female',
    interested_in: ['male'],
    venue_name: 'The Tipsy Tavern'
  },
  {
    email: 'jamie.taylor@example.com',
    display_name: 'Jamie',
    full_name: 'Jamie Taylor',
    avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face',
    bio: 'Graphic designer and music lover. Always down for a good conversation over drinks.',
    birth_date: '1994-11-08',
    gender: 'non-binary',
    interested_in: ['male', 'female', 'non-binary'],
    venue_name: 'The Tipsy Tavern'
  },

  // Skyline Lounge crowd (upscale/sophisticated)
  {
    email: 'michael.wong@example.com',
    display_name: 'Michael',
    full_name: 'Michael Wong',
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
    bio: 'Investment banker with a passion for fine cocktails and city views. Seeking meaningful connections.',
    birth_date: '1987-05-12',
    gender: 'male',
    interested_in: ['female'],
    venue_name: 'Skyline Lounge'
  },
  {
    email: 'elena.rossi@example.com',
    display_name: 'Elena',
    full_name: 'Elena Rossi',
    avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face',
    bio: 'Art curator who appreciates the finer things in life. Love rooftop bars and deep conversations.',
    birth_date: '1990-09-18',
    gender: 'female',
    interested_in: ['male', 'female'],
    venue_name: 'Skyline Lounge'
  },
  {
    email: 'david.kim@example.com',
    display_name: 'David',
    full_name: 'David Kim',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face',
    bio: 'Tech entrepreneur and cocktail connoisseur. Looking for someone who shares my ambition.',
    birth_date: '1985-12-03',
    gender: 'male',
    interested_in: ['female'],
    venue_name: 'Skyline Lounge'
  },

  // Vineyard Wine Bar crowd (wine lovers/sophisticated)
  {
    email: 'sophia.anderson@example.com',
    display_name: 'Sophia',
    full_name: 'Sophia Anderson',
    avatar_url: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=400&fit=crop&crop=face',
    bio: 'Wine sommelier and food blogger. Always exploring new vintages and cuisines.',
    birth_date: '1988-04-25',
    gender: 'female',
    interested_in: ['male'],
    venue_name: 'Vineyard Wine Bar'
  },
  {
    email: 'lucas.brown@example.com',
    display_name: 'Lucas',
    full_name: 'Lucas Brown',
    avatar_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop&crop=face',
    bio: 'Chef and wine enthusiast. Love pairing great food with perfect wines and good company.',
    birth_date: '1991-08-14',
    gender: 'male',
    interested_in: ['female', 'non-binary'],
    venue_name: 'Vineyard Wine Bar'
  },

  // The Brew House crowd (craft beer enthusiasts)
  {
    email: 'maya.patel@example.com',
    display_name: 'Maya',
    full_name: 'Maya Patel',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=face',
    bio: 'Craft beer brewer and outdoor enthusiast. Love trying new IPAs and hiking on weekends.',
    birth_date: '1993-06-30',
    gender: 'female',
    interested_in: ['male', 'female'],
    venue_name: 'The Brew House'
  },
  {
    email: 'ryan.johnson@example.com',
    display_name: 'Ryan',
    full_name: 'Ryan Johnson',
    avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop&crop=face',
    bio: 'Brewery tour guide and beer geek. Always down to share a flight and talk hops.',
    birth_date: '1986-10-07',
    gender: 'male',
    interested_in: ['female'],
    venue_name: 'The Brew House'
  },

  // Neon Nights crowd (nightclub/party scene)
  {
    email: 'zoe.garcia@example.com',
    display_name: 'Zoe',
    full_name: 'Zoe Garcia',
    avatar_url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=400&fit=crop&crop=face',
    bio: 'DJ and music producer. Love dancing until sunrise and connecting through music.',
    birth_date: '1995-01-20',
    gender: 'female',
    interested_in: ['male', 'female', 'non-binary'],
    venue_name: 'Neon Nights'
  },
  {
    email: 'carlos.rivera@example.com',
    display_name: 'Carlos',
    full_name: 'Carlos Rivera',
    avatar_url: 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=400&h=400&fit=crop&crop=face',
    bio: 'Dance instructor and nightlife enthusiast. Looking for someone who loves to move to the beat.',
    birth_date: '1990-02-14',
    gender: 'male',
    interested_in: ['female'],
    venue_name: 'Neon Nights'
  }
];

async function seedPeopleData() {
  try {
    console.log('🌱 Starting to seed people data...');

    // First, get all venues to map names to IDs
    console.log('1. Fetching venues...');
    const { data: venues, error: venuesError } = await supabase
      .from('venues')
      .select('id, name');

    if (venuesError) {
      console.error('❌ Error fetching venues:', venuesError);
      return;
    }

    console.log(`✅ Found ${venues.length} venues`);

    // Create venue name to ID mapping
    const venueMap = {};
    venues.forEach(venue => {
      venueMap[venue.name] = venue.id;
    });

    // Generate random coordinates near San Francisco for each person
    const baseLat = 37.7749;
    const baseLng = -122.4194;

    // Create users and profiles
    console.log('2. Creating users and profiles...');
    const createdProfiles = [];
    const attendanceData = [];

    for (const person of peopleData) {
      try {
        // Check if user already exists by email
        const { data: existingUsers } = await supabase.auth.admin.listUsers();
        const existingUser = existingUsers.users.find(u => u.email === person.email);

        let userId;
        if (existingUser) {
          console.log(`   ✅ User ${person.display_name} already exists`);
          userId = existingUser.id;
        } else {
          // Create new auth user
          const { data: newUser, error: authError } = await supabase.auth.admin.createUser({
            email: person.email,
            password: 'temppassword123',
            email_confirm: true,
            user_metadata: {
              display_name: person.display_name,
              full_name: person.full_name
            }
          });
          
          if (authError) {
            console.log(`   ⚠️ Could not create auth user for ${person.display_name}:`, authError.message);
            continue;
          } else {
            console.log(`   ✅ Created auth user for ${person.display_name}`);
            userId = newUser.user.id;
          }
        }

        // Create profile for this user
        const profileData = {
          id: userId,
          display_name: person.display_name,
          full_name: person.full_name,
          avatar_url: person.avatar_url,
          bio: person.bio,
          birth_date: person.birth_date,
          gender: person.gender,
          interested_in: person.interested_in,
          location_lat: baseLat + (Math.random() - 0.5) * 0.01,
          location_lng: baseLng + (Math.random() - 0.5) * 0.01,
          last_active: new Date(Date.now() - Math.random() * 30 * 60 * 1000),
          preferred_radius_km: 15 + Math.floor(Math.random() * 10),
          is_verified: true
        };

        // Insert/update profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .upsert(profileData, { onConflict: 'id' })
          .select()
          .single();

        if (profileError) {
          console.log(`   ⚠️ Could not create profile for ${person.display_name}:`, profileError.message);
        } else {
          console.log(`   ✅ Created profile for ${person.display_name}`);
          createdProfiles.push(profile);

          // Prepare attendance data
          const venueId = venueMap[person.venue_name];
          if (venueId) {
            attendanceData.push({
              user_id: userId,
              venue_id: venueId,
              checked_in_at: new Date(Date.now() - Math.random() * 30 * 60 * 1000),
              is_active: true
            });
          }
        }

      } catch (err) {
        console.log(`   ⚠️ Error processing ${person.display_name}:`, err.message);
      }
    }

    console.log(`✅ Created ${createdProfiles.length} profiles`);

    // Now let's test the venue people count by updating the venues.js API
    console.log('3. Testing venue people count...');
    
    // For now, let's just log the attendance data we would insert
    console.log('📝 Attendance data prepared (would need venue_attendance table):');
    const venueDistribution = {};
    attendanceData.forEach(attendance => {
      const venueName = Object.keys(venueMap).find(name => venueMap[name] === attendance.venue_id);
      venueDistribution[venueName] = (venueDistribution[venueName] || 0) + 1;
    });
    
    Object.entries(venueDistribution).forEach(([venue, count]) => {
      console.log(`   • ${venue}: ${count} people`);
    });

    console.log('🎉 People seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   • ${createdProfiles.length} user profiles created`);
    console.log(`   • ${attendanceData.length} venue attendance records prepared`);
    console.log('\n💡 Next steps:');
    console.log('   • Update venues.js API to return people count from profiles table');
    console.log('   • Test the discover page to see people counts on venue cards');

  } catch (error) {
    console.error('❌ Error seeding people data:', error);
  }
}

// Run the seeding
seedPeopleData();
