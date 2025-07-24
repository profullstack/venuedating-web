import { supabase } from './src/utils/supabase.js';

/**
 * Comprehensive seed script to create realistic people at different venues
 * This creates diverse user profiles and assigns them to venues for matching
 */

// Realistic user data for seeding
const seedUsers = [
  // The Tipsy Tavern crowd (pub/casual)
  {
    email: 'alex.chen@email.com',
    profile: {
      display_name: 'Alex',
      full_name: 'Alex Chen',
      bio: 'Software engineer who loves craft beer and live music. Always up for trivia night!',
      birth_date: '1992-03-15',
      gender: 'male',
      interested_in: ['female', 'non-binary'],
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
      preferred_radius_km: 15
    },
    venue_preference: 'The Tipsy Tavern'
  },
  {
    email: 'sarah.martinez@email.com',
    profile: {
      display_name: 'Sarah',
      full_name: 'Sarah Martinez',
      bio: 'Marketing manager and beer enthusiast. Love discovering new breweries and live bands.',
      birth_date: '1989-07-22',
      gender: 'female',
      interested_in: ['male'],
      avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face',
      preferred_radius_km: 12
    },
    venue_preference: 'The Tipsy Tavern'
  },
  {
    email: 'jamie.taylor@email.com',
    profile: {
      display_name: 'Jamie',
      full_name: 'Jamie Taylor',
      bio: 'Graphic designer and music lover. Always down for a good conversation over drinks.',
      birth_date: '1994-11-08',
      gender: 'non-binary',
      interested_in: ['male', 'female', 'non-binary'],
      avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face',
      preferred_radius_km: 10
    },
    venue_preference: 'The Tipsy Tavern'
  },

  // Skyline Lounge crowd (upscale/sophisticated)
  {
    email: 'michael.wong@email.com',
    profile: {
      display_name: 'Michael',
      full_name: 'Michael Wong',
      bio: 'Investment banker with a passion for fine cocktails and city views. Seeking meaningful connections.',
      birth_date: '1987-05-12',
      gender: 'male',
      interested_in: ['female'],
      avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
      preferred_radius_km: 20
    },
    venue_preference: 'Skyline Lounge'
  },
  {
    email: 'elena.rossi@email.com',
    profile: {
      display_name: 'Elena',
      full_name: 'Elena Rossi',
      bio: 'Art curator who appreciates the finer things in life. Love rooftop bars and deep conversations.',
      birth_date: '1990-09-18',
      gender: 'female',
      interested_in: ['male', 'female'],
      avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face',
      preferred_radius_km: 18
    },
    venue_preference: 'Skyline Lounge'
  },
  {
    email: 'david.kim@email.com',
    profile: {
      display_name: 'David',
      full_name: 'David Kim',
      bio: 'Tech entrepreneur and cocktail connoisseur. Looking for someone who shares my ambition.',
      birth_date: '1985-12-03',
      gender: 'male',
      interested_in: ['female'],
      avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face',
      preferred_radius_km: 25
    },
    venue_preference: 'Skyline Lounge'
  },

  // Vineyard Wine Bar crowd (wine lovers/sophisticated)
  {
    email: 'sophia.anderson@email.com',
    profile: {
      display_name: 'Sophia',
      full_name: 'Sophia Anderson',
      bio: 'Wine sommelier and food blogger. Always exploring new vintages and cuisines.',
      birth_date: '1988-04-25',
      gender: 'female',
      interested_in: ['male'],
      avatar_url: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=400&fit=crop&crop=face',
      preferred_radius_km: 15
    },
    venue_preference: 'Vineyard Wine Bar'
  },
  {
    email: 'lucas.brown@email.com',
    profile: {
      display_name: 'Lucas',
      full_name: 'Lucas Brown',
      bio: 'Chef and wine enthusiast. Love pairing great food with perfect wines and good company.',
      birth_date: '1991-08-14',
      gender: 'male',
      interested_in: ['female', 'non-binary'],
      avatar_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop&crop=face',
      preferred_radius_km: 12
    },
    venue_preference: 'Vineyard Wine Bar'
  },

  // The Brew House crowd (craft beer enthusiasts)
  {
    email: 'maya.patel@email.com',
    profile: {
      display_name: 'Maya',
      full_name: 'Maya Patel',
      bio: 'Craft beer brewer and outdoor enthusiast. Love trying new IPAs and hiking on weekends.',
      birth_date: '1993-06-30',
      gender: 'female',
      interested_in: ['male', 'female'],
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=face',
      preferred_radius_km: 20
    },
    venue_preference: 'The Brew House'
  },
  {
    email: 'ryan.johnson@email.com',
    profile: {
      display_name: 'Ryan',
      full_name: 'Ryan Johnson',
      bio: 'Brewery tour guide and beer geek. Always down to share a flight and talk hops.',
      birth_date: '1986-10-07',
      gender: 'male',
      interested_in: ['female'],
      avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop&crop=face',
      preferred_radius_km: 18
    },
    venue_preference: 'The Brew House'
  },

  // Neon Nights crowd (nightclub/party scene)
  {
    email: 'zoe.garcia@email.com',
    profile: {
      display_name: 'Zoe',
      full_name: 'Zoe Garcia',
      bio: 'DJ and music producer. Love dancing until sunrise and connecting through music.',
      birth_date: '1995-01-20',
      gender: 'female',
      interested_in: ['male', 'female', 'non-binary'],
      avatar_url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=400&fit=crop&crop=face',
      preferred_radius_km: 25
    },
    venue_preference: 'Neon Nights'
  },
  {
    email: 'carlos.rivera@email.com',
    profile: {
      display_name: 'Carlos',
      full_name: 'Carlos Rivera',
      bio: 'Dance instructor and nightlife enthusiast. Looking for someone who loves to move to the beat.',
      birth_date: '1990-02-14',
      gender: 'male',
      interested_in: ['female'],
      avatar_url: 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=400&h=400&fit=crop&crop=face',
      preferred_radius_km: 22
    },
    venue_preference: 'Neon Nights'
  },
  {
    email: 'taylor.lee@email.com',
    profile: {
      display_name: 'Taylor',
      full_name: 'Taylor Lee',
      bio: 'Fashion designer who loves the nightlife scene. Always dressed to impress and ready to dance.',
      birth_date: '1992-12-05',
      gender: 'non-binary',
      interested_in: ['male', 'female', 'non-binary'],
      avatar_url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=400&fit=crop&crop=face',
      preferred_radius_km: 20
    },
    venue_preference: 'Neon Nights'
  },

  // Additional diverse users for variety
  {
    email: 'priya.sharma@email.com',
    profile: {
      display_name: 'Priya',
      full_name: 'Priya Sharma',
      bio: 'Data scientist and yoga instructor. Love balancing work and wellness with good company.',
      birth_date: '1991-03-28',
      gender: 'female',
      interested_in: ['male'],
      avatar_url: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=400&h=400&fit=crop&crop=face',
      preferred_radius_km: 15
    },
    venue_preference: 'Vineyard Wine Bar'
  },
  {
    email: 'jordan.smith@email.com',
    profile: {
      display_name: 'Jordan',
      full_name: 'Jordan Smith',
      bio: 'Photographer and craft cocktail enthusiast. Always looking for the perfect shot and perfect drink.',
      birth_date: '1988-07-11',
      gender: 'male',
      interested_in: ['female', 'non-binary'],
      avatar_url: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=400&h=400&fit=crop&crop=face',
      preferred_radius_km: 18
    },
    venue_preference: 'Skyline Lounge'
  }
];

async function seedPeopleAtVenues() {
  try {
    console.log('🌱 Starting to seed people at venues...');
    
    // First, get all venue IDs
    console.log('\n1. Fetching venue information...');
    const { data: venues, error: venuesError } = await supabase
      .from('venues')
      .select('id, name');
    
    if (venuesError) {
      console.error('❌ Error fetching venues:', venuesError);
      return;
    }
    
    console.log(`✅ Found ${venues.length} venues:`, venues.map(v => v.name));
    
    // Create a venue name to ID mapping
    const venueMap = {};
    venues.forEach(venue => {
      venueMap[venue.name] = venue.id;
    });
    
    // Check for existing users to avoid duplicates
    console.log('\n2. Checking for existing users...');
    const existingUsers = new Map(); // email -> user_id
    
    for (const userData of seedUsers) {
      try {
        const { data: existingUser } = await supabase.auth.admin.getUserByEmail(userData.email);
        if (existingUser?.user) {
          existingUsers.set(userData.email, existingUser.user.id);
          console.log(`   ⚠️  User already exists: ${userData.email} (${existingUser.user.id})`);
        }
      } catch (error) {
        // User doesn't exist, which is fine
      }
    }
    
    console.log(`   Found ${existingUsers.size} existing users`);
    
    // Also check for existing profiles
    const { data: existingProfiles } = await supabase
      .from('profiles')
      .select('id, display_name');
    
    const existingProfileIds = new Set(existingProfiles?.map(p => p.id) || []);
    console.log(`   Found ${existingProfileIds.size} existing profiles`);
    
    // Set San Francisco coordinates for all users
    const sfLat = 37.7749;
    const sfLng = -122.4194;
    
    console.log('\n3. Creating new users and profiles...');
    
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    
    for (const userData of seedUsers) {
      try {
        console.log(`\n   Processing user: ${userData.profile.display_name} (${userData.email})`);
        
        let userId;
        
        // Check if user already exists
        if (existingUsers.has(userData.email)) {
          userId = existingUsers.get(userData.email);
          console.log(`   📋 Using existing auth user: ${userId}`);
          
          // Check if profile already exists
          if (existingProfileIds.has(userId)) {
            console.log(`   ⏭️  Profile already exists for ${userData.email}`);
            skippedCount++;
            continue;
          }
        } else {
          // Create new auth user
          const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
            email: userData.email,
            password: 'TempPassword123!', // Temporary password
            email_confirm: true
          });
          
          if (authError) {
            // If user already exists but wasn't caught by our check, try to get the user
            if (authError.message.includes('already been registered')) {
              try {
                const { data: existingUser } = await supabase.auth.admin.getUserByEmail(userData.email);
                if (existingUser?.user) {
                  userId = existingUser.user.id;
                  console.log(`   📋 Found existing user after error: ${userId}`);
                  
                  // Check if profile exists
                  if (existingProfileIds.has(userId)) {
                    console.log(`   ⏭️  Profile already exists for ${userData.email}`);
                    skippedCount++;
                    continue;
                  }
                } else {
                  console.error(`   ❌ Auth error for ${userData.email}:`, authError.message);
                  errorCount++;
                  continue;
                }
              } catch (getError) {
                console.error(`   ❌ Failed to get existing user ${userData.email}:`, getError.message);
                errorCount++;
                continue;
              }
            } else {
              console.error(`   ❌ Auth error for ${userData.email}:`, authError.message);
              errorCount++;
              continue;
            }
          } else {
            userId = authUser.user.id;
            console.log(`   ✅ Created auth user: ${userId}`);
          }
        }
        
        // Create profile with venue-specific location
        const venueId = venueMap[userData.venue_preference];
        if (!venueId) {
          console.error(`   ❌ Venue not found: ${userData.venue_preference}`);
          errorCount++;
          continue;
        }
        
        // Add some location variance around SF
        const locationVariance = 0.01; // ~1km variance
        const userLat = sfLat + (Math.random() - 0.5) * locationVariance;
        const userLng = sfLng + (Math.random() - 0.5) * locationVariance;
        
        // Use upsert to handle any potential conflicts
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: userId,
            ...userData.profile,
            location_lat: userLat,
            location_lng: userLng,
            last_active: new Date().toISOString(),
            is_verified: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'id'
          });
        
        if (profileError) {
          console.error(`   ❌ Profile error for ${userData.email}:`, profileError.message);
          errorCount++;
          continue;
        }
        
        console.log(`   ✅ Created profile for ${userData.profile.display_name} at ${userData.venue_preference}`);
        successCount++;
        
      } catch (error) {
        console.error(`   ❌ Unexpected error for ${userData.email}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`\n🎉 Seeding complete!`);
    console.log(`✅ Successfully created: ${successCount} users`);
    console.log(`⏭️  Skipped existing: ${skippedCount} users`);
    console.log(`❌ Errors: ${errorCount} users`);
    
    // Show summary by venue
    console.log('\n📊 Users by venue preference:');
    const venueStats = {};
    seedUsers.forEach(user => {
      venueStats[user.venue_preference] = (venueStats[user.venue_preference] || 0) + 1;
    });
    
    Object.entries(venueStats).forEach(([venue, count]) => {
      console.log(`   ${venue}: ${count} people`);
    });
    
    console.log('\n🔄 Now updating venue people counts...');
    await updateVenuePeopleCounts();
    
  } catch (error) {
    console.error('❌ Fatal error in seeding:', error);
  }
}

async function updateVenuePeopleCounts() {
  try {
    // This would typically be done with a real-time system
    // For now, we'll add some realistic people counts to venues
    const venueCounts = {
      'The Tipsy Tavern': 8,
      'Skyline Lounge': 12,
      'Vineyard Wine Bar': 6,
      'The Brew House': 10,
      'Neon Nights': 15
    };
    
    console.log('📊 Venue people counts updated (simulated):');
    Object.entries(venueCounts).forEach(([venue, count]) => {
      console.log(`   ${venue}: ${count} people currently here`);
    });
    
  } catch (error) {
    console.error('❌ Error updating venue counts:', error);
  }
}

// Run the seeding
seedPeopleAtVenues();
