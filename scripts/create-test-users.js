/**
 * Script to create multiple test users with different phone formats
 * Includes bypass OTP flag for easy login testing
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// API base URL
const API_BASE_URL = 'http://localhost:8097/api';

// Test users with different phone formats
const testUsers = [
  {
    firstName: 'US',
    lastName: 'User',
    phoneNumber: '5551234567',
    countryCode: '+1',
    phoneVerified: true // Set to true to bypass OTP verification
  },
  {
    firstName: 'Nigerian',
    lastName: 'User',
    phoneNumber: '9042401681',
    countryCode: '+234',
    phoneVerified: true
  },
  {
    firstName: 'UK',
    lastName: 'User',
    phoneNumber: '7911123456',
    countryCode: '+44',
    phoneVerified: true
  },
  {
    firstName: 'Indian',
    lastName: 'User',
    phoneNumber: '9876543210',
    countryCode: '+91',
    phoneVerified: true
  },
  {
    firstName: 'Brazilian',
    lastName: 'User',
    phoneNumber: '21987654321',
    countryCode: '+55',
    phoneVerified: true
  }
];

/**
 * Create a test user via the API
 * @param {Object} userData - User data to create
 * @returns {Promise<Object>} Created user object or null on failure
 */
async function createTestUser(userData) {
  try {
    console.log(`Creating test user: ${userData.firstName} ${userData.lastName} with phone: ${userData.countryCode}${userData.phoneNumber}`);
    
    // Create the user via API endpoint
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error creating user:', errorData);
      return null;
    }
    
    const result = await response.json();
    
    if (!result.success) {
      console.error('API returned error:', result.error);
      return null;
    }
    
    console.log(`User created successfully: ${result.user.full_name}`);
    console.log(`Phone number in database: ${result.user.phone_number}`);
    console.log(`User ID: ${result.user.id}`);
    console.log('-----------------------------------');
    
    return result.user;
  } catch (error) {
    console.error('Unexpected error:', error);
    return null;
  }
}

/**
 * Create all test users
 */
async function createAllTestUsers() {
  console.log('Creating test users...');
  console.log('===================================');
  
  const createdUsers = [];
  
  for (const userData of testUsers) {
    const user = await createTestUser(userData);
    if (user) {
      createdUsers.push(user);
    }
  }
  
  console.log('===================================');
  console.log(`Created ${createdUsers.length} test users successfully`);
  
  // Output login information for each user
  console.log('\nLogin information for test users:');
  console.log('===================================');
  createdUsers.forEach(user => {
    console.log(`${user.full_name}: ${user.phone_number}`);
  });
}

// Run the function
createAllTestUsers();
