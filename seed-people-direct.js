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

// Sample people data to seed
const peopleData = [
  // The Tipsy Tavern crowd (pub/casual)
  {
    id: 'a1111111-1111-1111-1111-111111111111',
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
    id: 'a2222222-2222-2222-2222-222222222222',
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
    id: 'a3333333-3333-3333-3333-333333333333',
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
    id: 'b1111111-1111-1111-1111-111111111111',
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
    id: 'b2222222-2222-2222-2222-222222222222',
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
    id: 'b3333333-3333-3333-3333-333333333333',
    display_name: 'David',
    full_name: 'David Kim',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face',
    bio: 'Tech entrepreneur and cocktail connoisseur. Looking for someone who shares my ambition.',
    birth_date: '1985-12-03',
    gender: 'male',
    interested_in: ['female'],
    venue_name: 'Skyline Lounge'
  },
  {
    id: 'b4444444-4444-4444-4444-444444444444',
    display_name: 'Jordan',
    full_name: 'Jordan Smith',
    avatar_url: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=400&h=400&fit=crop&crop=face',
    bio: 'Photographer and craft cocktail enthusiast. Always looking for the perfect shot and perfect drink.',
    birth_date: '1988-07-11',
    gender: 'male',
    interested_in: ['female', 'non-binary'],
    venue_name: 'Skyline Lounge'
  },

  // Vineyard Wine Bar crowd (wine lovers/sophisticated)
  {
    id: 'c1111111-1111-1111-1111-111111111111',
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
    id: 'c2222222-2222-2222-2222-222222222222',
    display_name: 'Lucas',
    full_name: 'Lucas Brown',
    avatar_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop&crop=face',
    bio: 'Chef and wine enthusiast. Love pairing great food with perfect wines and good company.',
    birth_date: '1991-08-14',
    gender: 'male',
    interested_in: ['female', 'non-binary'],
    venue_name: 'Vineyard Wine Bar'
  },
  {
    id: 'c3333333-3333-3333-3333-333333333333',
    display_name: 'Priya',
    full_name: 'Priya Sharma',
    avatar_url: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=400&h=400&fit=crop&crop=face',
    bio: 'Data scientist and yoga instructor. Love balancing work and wellness with good company.',
    birth_date: '1991-03-28',
    gender: 'female',
    interested_in: ['male'],
    venue_name: 'Vineyard Wine Bar'
  },

  // The Brew House crowd (craft beer enthusiasts)
  {
    id: 'd1111111-1111-1111-1111-111111111111',
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
    id: 'd2222222-2222-2222-2222-222222222222',
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
    id: 'e1111111-1111-1111-1111-111111111111',
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
    id: 'e2222222-2222-2222-2222-222222222222',
    display_name: 'Carlos',
    full_name: 'Carlos Rivera',
    avatar_url: 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=400&h=400&fit=crop&crop=face',
    bio: 'Dance instructor and nightlife enthusiast. Looking for someone who loves to move to the beat.',
    birth_date: '1990-02-14',
    gender: 'male',
    interested_in: ['female'],
    venue_name: 'Neon Nights'
  },
  {
    id: 'e3333333-3333-3333-3333-333333333333',
    display_name: 'Taylor',
    full_name: 'Taylor Lee',
    avatar_url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=400&fit=crop&crop=face',
    bio: 'Fashion designer who loves the nightlife scene. Always dressed to impress and ready to dance.',
    birth_date: '1992-12-05',
    gender: 'non-binary',
    interested_in: ['male', 'female', 'non-binary'],
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

    // Create auth users first (required for profiles foreign key)
    console.log('2. Creating auth users...');
    const authUsers = [];
    
    for (const person of peopleData) {
      try {
        // Check if user already exists
        const { data: existingUser } = await supabase.auth.admin.getUserById(person.id);
        
        if (existingUser.user) {
          console.log(`   ✅ User ${person.display_name} already exists`);
          authUsers.push(existingUser.user);
        } else {
          // Create new auth user
          const { data: newUser, error: authError } = await supabase.auth.admin.createUser({
            user_id: person.id,
            email: `${person.display_name.toLowerCase()}@example.com`,
            password: 'temppassword123',
            email_confirm: true,
            user_metadata: {
              display_name: person.display_name,
              full_name: person.full_name
            }
          });
          
          if (authError) {
            console.log(`   ⚠️ Could not create auth user for ${person.display_name}:`, authError.message);
          } else {
            console.log(`   ✅ Created auth user for ${person.display_name}`);
            authUsers.push(newUser.user);
          }
        }
      } catch (err) {
        console.log(`   ⚠️ Error checking/creating user ${person.display_name}:`, err.message);
      }
    }

    console.log(`✅ Processed ${authUsers.length} auth users`);

    // Prepare profiles data
    const profilesData = peopleData.map(person => ({
      id: person.id,
      display_name: person.display_name,
      full_name: person.full_name,
      avatar_url: person.avatar_url,
      bio: person.bio,
      birth_date: person.birth_date,
      gender: person.gender,
      interested_in: person.interested_in,
      location_lat: baseLat + (Math.random() - 0.5) * 0.01,
      location_lng: baseLng + (Math.random() - 0.5) * 0.01,
      last_active: new Date(Date.now() - Math.random() * 30 * 60 * 1000), // Random time within last 30 minutes
      preferred_radius_km: 15 + Math.floor(Math.random() * 10), // 15-25 km
      is_verified: true,
      created_at: new Date(),
      updated_at: new Date()
    }));

    // Insert profiles using upsert
    console.log('3. Inserting profiles...');
    const { data: insertedProfiles, error: profilesError } = await supabase
      .from('profiles')
      .upsert(profilesData, { onConflict: 'id' })
      .select();

    if (profilesError) {
      console.error('❌ Error inserting profiles:', profilesError);
      return;
    }

    console.log(`✅ Inserted/updated ${insertedProfiles.length} profiles`);

    // Create venue attendance table if it doesn't exist
    console.log('4. Creating venue attendance table...');
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS public.venue_attendance (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
        venue_id UUID REFERENCES public.venues(id) ON DELETE CASCADE,
        checked_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        checked_out_at TIMESTAMPTZ,
        is_active BOOLEAN DEFAULT true,
        UNIQUE(user_id, venue_id, checked_in_at)
      );
    `;

    const { error: tableError } = await supabase.rpc('exec_sql', { sql: createTableQuery });
    if (tableError && !tableError.message.includes('already exists')) {
      console.log('⚠️ Could not create table via RPC, it may already exist');
    }

    // Prepare attendance data
    const attendanceData = [];
    peopleData.forEach(person => {
      const venueId = venueMap[person.venue_name];
      if (venueId) {
        attendanceData.push({
          user_id: person.id,
          venue_id: venueId,
          checked_in_at: new Date(Date.now() - Math.random() * 30 * 60 * 1000), // Random time within last 30 minutes
          is_active: true
        });
      }
    });

    // Try to insert attendance data directly
    console.log('5. Inserting venue attendance...');
    try {
      const { data: attendanceResult, error: attendanceError } = await supabase
        .from('venue_attendance')
        .upsert(attendanceData, { onConflict: 'user_id,venue_id,checked_in_at' })
        .select();

      if (attendanceError) {
        console.log('⚠️ Could not insert attendance via table (may not exist):', attendanceError.message);
        console.log('📝 Attendance data prepared for manual insertion if needed');
      } else {
        console.log(`✅ Inserted ${attendanceResult.length} attendance records`);
      }
    } catch (err) {
      console.log('⚠️ Attendance table may not exist, skipping attendance insertion');
    }

    console.log('🎉 People seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   • ${insertedProfiles.length} user profiles created/updated`);
    console.log(`   • ${attendanceData.length} venue attendance records prepared`);
    console.log('\n🏢 People distribution by venue:');
    
    const venueDistribution = {};
    peopleData.forEach(person => {
      venueDistribution[person.venue_name] = (venueDistribution[person.venue_name] || 0) + 1;
    });
    
    Object.entries(venueDistribution).forEach(([venue, count]) => {
      console.log(`   • ${venue}: ${count} people`);
    });

  } catch (error) {
    console.error('❌ Error seeding people data:', error);
  }
}

// Run the seeding
seedPeopleData();
