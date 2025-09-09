#!/usr/bin/env node

/**
 * Test script for phone signup flow with Twilio direct integration
 * 
 * This script tests the complete phone signup flow:
 * 1. Initiates phone signup with a test phone number
 * 2. Verifies OTP code (bypassed for test numbers)
 * 3. Creates user profile with photo
 * 4. Verifies the user exists in Supabase
 */

import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const TEST_PHONE = '+15555555555'; // Test phone number that bypasses actual SMS
const TEST_CODE = '123456'; // Test verification code
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Test profile data
const testProfile = {
  firstName: 'Test',
  lastName: 'User',
  birthday: '1990-01-01',
  location: 'Test City',
  phoneNumber: TEST_PHONE
};

// Initialize Supabase client with service key for admin operations
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Helper to read a test image file
function getTestImage() {
  try {
    const imagePath = path.join(__dirname, 'test-profile-image.jpg');
    if (fs.existsSync(imagePath)) {
      return fs.readFileSync(imagePath);
    } else {
      console.log('Test image not found at:', imagePath);
      return null;
    }
  } catch (error) {
    console.error('Error reading test image:', error);
    return null;
  }
}

// Helper to make API requests
async function apiRequest(endpoint, method = 'GET', body = null) {
  const url = `${API_BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  console.log(`Making ${method} request to ${url}`);
  const response = await fetch(url, options);
  const data = await response.json();
  return { status: response.status, data };
}

// Step 1: Check if phone exists
async function checkPhoneExists(phone) {
  console.log('\n=== STEP 1: Checking if phone exists ===');
  const { status, data } = await apiRequest('/api/1/auth/check-phone-exists', 'POST', { phone });
  console.log('Status:', status);
  console.log('Response:', data);
  return data;
}

// Step 2: Initiate phone signup
async function initiatePhoneSignup(phone) {
  console.log('\n=== STEP 2: Initiating phone signup ===');
  const { status, data } = await apiRequest('/api/1/auth/phone/initiate-signup', 'POST', { phone });
  console.log('Status:', status);
  console.log('Response:', data);
  return data;
}

// Step 3: Complete phone signup with OTP
async function completePhoneSignup(phone, code) {
  console.log('\n=== STEP 3: Completing phone signup with OTP ===');
  const { status, data } = await apiRequest('/api/1/auth/phone/complete-signup', 'POST', { 
    phone, 
    code,
    profile: testProfile
  });
  console.log('Status:', status);
  console.log('Response:', data);
  return data;
}

// Step 4: Upload profile photo
async function uploadProfilePhoto(userId, imageBuffer) {
  console.log('\n=== STEP 4: Uploading profile photo ===');
  if (!imageBuffer) {
    console.log('No test image available, skipping photo upload');
    return null;
  }
  
  // Upload to Supabase storage
  const fileName = `${userId}/profile.jpg`;
  const { data, error } = await supabase.storage
    .from('profile-photos')
    .upload(fileName, imageBuffer, { 
      contentType: 'image/jpeg',
      upsert: true 
    });
  
  if (error) {
    console.error('Error uploading photo:', error);
    return null;
  }
  
  console.log('Photo uploaded successfully:', data);
  
  // Get public URL
  const { data: urlData } = supabase.storage
    .from('profile-photos')
    .getPublicUrl(fileName);
  
  // Update profile with photo URL
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url: urlData.publicUrl })
    .eq('id', userId);
  
  if (updateError) {
    console.error('Error updating profile with photo URL:', updateError);
    return null;
  }
  
  console.log('Profile updated with photo URL:', urlData.publicUrl);
  return urlData.publicUrl;
}

// Step 5: Verify user exists in Supabase
async function verifyUserExists(phone) {
  console.log('\n=== STEP 5: Verifying user exists in Supabase ===');
  
  // Query the profiles table for the user with this phone number
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('phone_number', phone);
  
  if (error) {
    console.error('Error querying user:', error);
    return false;
  }
  
  if (data && data.length > 0) {
    console.log('User found in database:', data[0]);
    return data[0];
  } else {
    console.log('User not found in database');
    return false;
  }
}

// Main test function
async function runTest() {
  try {
    console.log('=== STARTING PHONE SIGNUP FLOW TEST ===');
    
    // Step 1: Check if phone exists
    const phoneCheck = await checkPhoneExists(TEST_PHONE);
    
    // Step 2: Initiate signup
    const initiateResult = await initiatePhoneSignup(TEST_PHONE);
    
    if (!initiateResult.success) {
      console.error('Failed to initiate signup:', initiateResult.error);
      return;
    }
    
    // Step 3: Complete signup with OTP
    const completeResult = await completePhoneSignup(TEST_PHONE, TEST_CODE);
    
    if (!completeResult.success) {
      console.error('Failed to complete signup:', completeResult.error);
      return;
    }
    
    const userId = completeResult.user?.id;
    if (!userId) {
      console.error('No user ID returned from signup completion');
      return;
    }
    
    // Step 4: Upload profile photo
    const testImage = getTestImage();
    if (testImage) {
      const photoUrl = await uploadProfilePhoto(userId, testImage);
    }
    
    // Step 5: Verify user exists
    const user = await verifyUserExists(TEST_PHONE);
    
    if (user) {
      console.log('\n=== TEST SUCCESSFUL ===');
      console.log('User created successfully with ID:', userId);
      console.log('Profile data:', user);
    } else {
      console.log('\n=== TEST FAILED ===');
      console.log('User was not found in the database after signup');
    }
    
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

// Run the test
runTest();
