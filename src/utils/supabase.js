import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Read environment variables directly from .env file
 */
function readEnvFile() {
  try {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const envPath = path.resolve(__dirname, '../../.env');
    
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const envVars = {};
      
      envContent.split('\n').forEach(line => {
        // Skip comments and empty lines
        if (line.startsWith('#') || !line.trim()) return;
        
        // Parse key=value pairs
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          const value = match[2].trim();
          envVars[key] = value;
        }
      });
      
      return envVars;
    }
  } catch (error) {
    console.error('Error reading .env file:', error);
  }
  
  return {};
}

const envVars = readEnvFile();

/**
 * Supabase configuration
 */
const supabaseUrl = envVars.SUPABASE_URL || process.env.SUPABASE_URL || 'https://arokhsfbkdnfuklmqajh.supabase.co';
// Use service role key for server-side operations to bypass RLS
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || envVars.SUPABASE_KEY || process.env.SUPABASE_KEY;

// Log environment variables for debugging
console.log('Supabase configuration:');
console.log('SUPABASE_URL:', supabaseUrl);
console.log('SUPABASE_KEY exists:', !!supabaseKey);
console.log('SUPABASE_KEY from .env file:', !!envVars.SUPABASE_KEY);
console.log('SUPABASE_KEY from process.env:', !!process.env.SUPABASE_KEY);
console.log('SUPABASE_SERVICE_ROLE_KEY from .env file:', !!envVars.SUPABASE_SERVICE_ROLE_KEY);
console.log('SUPABASE_SERVICE_ROLE_KEY from process.env:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
console.log('SUPABASE_KEY length:', supabaseKey ? supabaseKey.length : 0);
console.log('Using service role key:', !!(envVars.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY));
console.log('NODE_ENV:', process.env.NODE_ENV);

// Log all environment variables for debugging (without showing sensitive values)
console.log('All environment variables:');
Object.keys(process.env).forEach(key => {
  if (key.includes('KEY') || key.includes('SECRET') || key.includes('PASSWORD')) {
    console.log(`${key}: [REDACTED]`);
  } else {
    console.log(`${key}: ${process.env[key]}`);
  }
});

/**
 * Create and export the Supabase client or a mock client if no key is provided
 */
// Create the Supabase client
let supabaseClient;
try {
  console.log('Creating Supabase client...');
  if (supabaseKey) {
    supabaseClient = createClient(supabaseUrl, supabaseKey);
    console.log('Supabase client created successfully with API key');
    
    // Add URL and key to the client for debugging
    supabaseClient.supabaseUrl = supabaseUrl;
    supabaseClient.supabaseKey = !!supabaseKey;
  } else {
    console.error('ERROR: No Supabase key found in environment variables.');
    console.error('Please create a .env file with SUPABASE_URL and SUPABASE_KEY or SUPABASE_SERVICE_ROLE_KEY.');
    console.error('See .env.example for reference.');
    
    // Throw an error to prevent the application from starting without proper configuration
    throw new Error('Missing Supabase credentials. Check server logs for details.');
  }
} catch (error) {
  console.error('Error creating Supabase client:', error);
  console.error('Error stack:', error.stack);
  throw error; // Re-throw the error to prevent the application from starting with invalid configuration
}

export const supabase = supabaseClient;

/**
 * Utility functions for Supabase operations
 */
export const supabaseUtils = {
  /**
   * Store a document in Supabase storage
   * @param {Buffer} buffer - Document buffer
   * @param {string} filename - Filename
   * @param {string} contentType - Content type
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<Object>} - Upload result
   */
  async storeDocument(buffer, filename, contentType, metadata = {}) {
    try {
      // Generate a unique path for the document
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const path = `documents/${timestamp}_${filename}`;
      
      // Upload the document to Supabase Storage
      const { data, error } = await supabase.storage
        .from('documents')
        .upload(path, buffer, {
          contentType,
          upsert: false,
          metadata
        });
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error storing document in Supabase:', error);
      throw error;
    }
  },
  
  /**
   * Record document generation in Supabase database
   * @param {string} documentType - Document type (pdf, doc, excel, etc.)
   * @param {string} storagePath - Path in Supabase storage
   * @param {Object} metadata - Additional metadata
   * @param {string} userEmail - User email for associating with user_id
   * @returns {Promise<Object>} - Database record
   */
  async recordDocumentGeneration(documentType, storagePath, metadata = {}, userEmail = null) {
    try {
      // Create the document generation record
      const documentRecord = {
        document_type: documentType,
        storage_path: storagePath,
        generated_at: new Date().toISOString(),
        metadata
      };
      
      // If user email is provided, look up the user_id
      if (userEmail) {
        // Get the user_id from the users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('email', userEmail)
          .single();
        
        if (userError) {
          console.warn(`User not found for email: ${userEmail}`, userError);
        } else if (userData) {
          // Add the user_id to the document record
          documentRecord.user_id = userData.id;
        }
      }
      
      // Insert the document generation record
      const { data, error } = await supabase
        .from('document_generations')
        .insert([documentRecord])
        .select();
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error recording document generation in Supabase:', error);
      throw error;
    }
  },
  
  /**
   * Get document generation history
   * @param {number} limit - Maximum number of records to return
   * @param {number} offset - Offset for pagination
   * @param {string} userEmail - User email to filter by (optional)
   * @returns {Promise<Array>} - Document generation records
   */
  async getDocumentGenerationHistory(limit = 10, offset = 0, userEmail = null) {
    try {
      let query = supabase
        .from('document_generations')
        .select('*')
        .order('generated_at', { ascending: false });
      
      // If user email is provided, filter by user_id
      if (userEmail) {
        // First get the user_id
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('email', userEmail)
          .single();
        
        if (!userError && userData) {
          // Filter by user_id
          query = query.eq('user_id', userData.id);
        }
      }
      
      // Apply pagination
      query = query.range(offset, offset + limit - 1);
      
      // Execute the query
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching document generation history from Supabase:', error);
      throw error;
    }
  }
};