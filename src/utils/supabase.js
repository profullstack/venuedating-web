import { createClient } from '@supabase/supabase-js';
import dotenvFlow from 'dotenv-flow';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env files
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../../');
dotenvFlow.config({ path: rootDir });

/**
 * Supabase configuration
 */
const supabaseUrl = process.env.SUPABASE_URL || 'https://arokhsfbkdnfuklmqajh.supabase.co';
// Use service role key for server-side operations to bypass RLS
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

// Log environment variables for debugging
console.log('Supabase configuration:');
console.log('SUPABASE_URL:', supabaseUrl);
console.log('SUPABASE_KEY exists:', !!supabaseKey);
console.log('SUPABASE_KEY from process.env:', !!process.env.SUPABASE_KEY);
console.log('SUPABASE_SERVICE_ROLE_KEY from process.env:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
console.log('SUPABASE_KEY length:', supabaseKey ? supabaseKey.length : 0);
console.log('Using service role key:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
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
    // Create client with explicit auth configuration to ensure proper role usage
    supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      },
      db: {
        schema: 'public'
      },
      global: {
        headers: {
          Authorization: `Bearer ${supabaseKey}`
        }
      }
    });
    
    console.log('Supabase client created successfully with service role key');
    
    // Verify connection works properly
    supabaseClient.supabaseUrl = supabaseUrl;
    supabaseClient.supabaseKey = !!supabaseKey;
    
    // Test the connection to verify permissions work
    supabaseClient.from('users').select('count').limit(1)
      .then(result => {
        if (result.error) {
          console.error('⚠️ TEST QUERY FAILED - Supabase permissions issue:', result.error);
          console.log('This likely means your service role key does not have proper permissions.');
        } else {
          console.log('✅ Supabase test query successful - permissions are working properly');
        }
      })
      .catch(err => {
        console.error('⚠️ TEST QUERY ERROR - Supabase permissions issue:', err);
      });
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
   * Verify a JWT token
   * @param {string} token - JWT token to verify
   * @returns {Promise<Object|null>} - User data if valid, null otherwise
   */
  async verifyJwtToken(token) {
    try {
      console.log('Verifying JWT token...');
      
      if (!token) {
        console.error('JWT verification error: No token provided');
        return null;
      }
      
      // Check if token is malformed
      if (token.length < 100) {
        console.error(`JWT verification error: Token appears to be malformed (length: ${token.length})`);
        console.error(`Token content: ${token}`);
        return null;
      }
      
      // Log token length and first/last few characters for debugging
      console.log(`Token length: ${token.length}`);
      console.log(`Token preview: ${token.substring(0, 10)}...${token.substring(token.length - 10)}`);
      
      // Ensure token is properly trimmed
      const trimmedToken = token.trim();
      
      // Use the Supabase getUser method to verify the token
      const { data, error } = await supabase.auth.getUser(trimmedToken);
      
      if (error) {
        console.error('JWT verification error:', error);
        // Try logging more details about the token
        try {
          const parts = token.split('.');
          console.error(`Token parts: ${parts.length}`);
          if (parts.length !== 3) {
            console.error('Invalid JWT format: expected 3 parts (header.payload.signature)');
          }
        } catch (e) {
          console.error('Error analyzing token:', e);
        }
        return null;
      }
      
      if (!data || !data.user) {
        console.error('JWT verification error: No user data returned');
        return null;
      }
      
      console.log('JWT token verified successfully for user:', data.user.email);
      return data.user;
    } catch (error) {
      console.error('Error verifying JWT token:', error);
      console.error('Error stack:', error.stack);
      return null;
    }
  },

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