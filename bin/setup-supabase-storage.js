#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenvFlow from 'dotenv-flow';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env files
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../');
dotenvFlow.config({ path: rootDir });

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env file');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
});

/**
 * Create the necessary storage buckets in Supabase
 */
async function setupStorage() {
  console.log('Setting up Supabase storage buckets...');

  try {
    // Check if the documents bucket exists
    const { data: buckets, error: getBucketsError } = await supabase.storage.listBuckets();
    
    if (getBucketsError) {
      console.error('Error listing buckets:', getBucketsError);
      process.exit(1);
    }

    // Check if documents bucket exists
    const documentsBucketExists = buckets.some(bucket => bucket.name === 'documents');
    
    if (!documentsBucketExists) {
      console.log('Creating documents bucket...');
      const { data, error } = await supabase.storage.createBucket('documents', {
        public: false,
        fileSizeLimit: 52428800, // 50MB limit
        allowedMimeTypes: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'application/epub+zip'
        ]
      });
      
      if (error) {
        console.error('Error creating documents bucket:', error);
        process.exit(1);
      }
      
      console.log('Documents bucket created successfully!');
    } else {
      console.log('Documents bucket already exists.');
    }

    // Set up RLS policies for the documents bucket
    console.log('Setting up RLS policies for documents bucket...');
    
    // Set up storage policies to allow service role access
    // Note: We're using the service role key for all operations, so we don't need
    // to set up RLS policies for user-specific access
    console.log('Using service role key for storage operations - no need for RLS policies');

    console.log('Storage setup completed successfully!');
    
    // Test uploading a small file to verify bucket works
    console.log('Testing document upload...');
    const testBuffer = Buffer.from('Test document content');
    const testPath = `test/test-document-${Date.now()}.txt`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(testPath, testBuffer, {
        contentType: 'text/plain',
        upsert: false
      });
    
    if (uploadError) {
      console.error('Error uploading test document:', uploadError);
      console.log('Note: This may be due to RLS policies. The bucket exists but you may need to adjust policies.');
    } else {
      console.log('Test document uploaded successfully!');
      console.log('Storage is properly configured and working.');
    }
    
  } catch (error) {
    console.error('Error setting up storage:', error);
    process.exit(1);
  }
}

// Run the setup
setupStorage();