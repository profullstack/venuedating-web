/**
 * Script to create a test user with a Nigerian phone number
 * This script creates a user with the phone number +234(904)2401681
 * to test phone number normalization and lookup
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// API base URL
const API_BASE_URL = 'http://localhost:8097/api';

// Test user data with formatted phone number
const testUser = {
  firstName: 'Test',
  lastName: 'Nigerian',
  phoneNumber: '9042401681',
  countryCode: '+234',
  phoneVerified: false
};

async function createTestUser() {
  try {
    console.log('Creating test user with phone number:', testUser.countryCode + testUser.phoneNumber);
    
    // Create the user via API endpoint
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testUser)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error creating user:', errorData);
      return;
    }
    
    const result = await response.json();
    
    if (!result.success) {
      console.error('API returned error:', result.error);
      return;
    }
    
    console.log('User created successfully:', result.user);
    console.log('Phone number in database:', result.user.phone_number);
    
    // Return the user ID for further testing
    return result.user.id;
  } catch (error) {
    console.error('Unexpected error:', error);
    return null;
  }
}

// Run the function
createTestUser();
