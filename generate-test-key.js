// Generate a test API key for testing endpoints
import crypto from 'crypto';
import { supabase } from './src/utils/supabase.js';

// Generate a random API key
const generateApiKey = () => {
  return `pfs_${crypto.randomBytes(32).toString('hex')}`;
};

// Create a test API key in the database
async function createTestApiKey() {
  try {
    console.log('Generating test API key...');
    
    // First, ensure test user exists
    const testEmail = 'test1@example.com';
    
    // Check if user exists
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', testEmail)
      .single();
    
    if (userError && userError.code !== 'PGRST116') {
      console.error('Error checking for existing user:', userError);
      return null;
    }
    
    let userId;
    
    // Create user if not exists
    if (!existingUser) {
      console.log(`Creating test user: ${testEmail}`);
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert([{
          email: testEmail,
          is_admin: true // Make the test user an admin for full access
        }])
        .select()
        .single();
      
      if (createError) {
        console.error('Error creating test user:', createError);
        return null;
      }
      
      userId = newUser.id;
      console.log(`Test user created with ID: ${userId}`);
    } else {
      userId = existingUser.id;
      console.log(`Test user already exists with ID: ${userId}`);
    }
    
    // Generate API key
    const apiKey = generateApiKey();
    
    // Insert API key into database
    const { data: keyData, error: keyError } = await supabase
      .from('api_keys')
      .insert([{
        user_id: userId,
        key: apiKey,
        name: 'Test API Key',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Expires in 24 hours
      }])
      .select()
      .single();
    
    if (keyError) {
      console.error('Error creating API key:', keyError);
      return null;
    }
    
    console.log('Test API key created successfully');
    console.log('API Key:', apiKey);
    console.log('Key ID:', keyData.id);
    
    return apiKey;
  } catch (error) {
    console.error('Unexpected error:', error);
    return null;
  }
}

// Run the function
createTestApiKey().then(apiKey => {
  if (apiKey) {
    console.log('\nUse this key for testing API endpoints:');
    console.log(`curl -H "Authorization: Bearer ${apiKey}" http://localhost:8097/api/venues`);
  } else {
    console.log('Failed to create test API key');
  }
}).catch(console.error);
