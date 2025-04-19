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
const supabaseKey = envVars.SUPABASE_KEY || process.env.SUPABASE_KEY;

// Log environment variables for debugging
console.log('Environment variables:');
console.log('SUPABASE_URL:', supabaseUrl);
console.log('SUPABASE_KEY exists:', !!supabaseKey);
console.log('SUPABASE_KEY from .env file:', !!envVars.SUPABASE_KEY);
console.log('NODE_ENV:', process.env.NODE_ENV);

/**
 * Create and export the Supabase client or a mock client if no key is provided
 */
export const supabase = supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : createMockSupabaseClient();

/**
 * Create a mock Supabase client for development without credentials
 */
function createMockSupabaseClient() {
  console.warn('SUPABASE_KEY not found in environment variables. Using mock Supabase client.');
  
  // Create a mock storage object
  const mockStorage = {
    from: (bucket) => ({
      upload: (path, data, options) => {
        console.log(`[MOCK] Uploading to ${bucket}/${path} with options:`, options);
        return Promise.resolve({
          data: { path, fullPath: `${bucket}/${path}` },
          error: null
        });
      }
    })
  };
  
  // Create a mock database object
  const mockFrom = (table) => ({
    insert: (data) => ({
      select: () => Promise.resolve({ data, error: null })
    }),
    select: () => ({
      order: () => ({
        range: () => Promise.resolve({ data: [], error: null })
      })
    })
  });
  
  // Return a mock client
  return {
    storage: mockStorage,
    from: mockFrom
  };
}

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
   * @returns {Promise<Object>} - Database record
   */
  async recordDocumentGeneration(documentType, storagePath, metadata = {}) {
    try {
      const { data, error } = await supabase
        .from('document_generations')
        .insert([{
          document_type: documentType,
          storage_path: storagePath,
          generated_at: new Date().toISOString(),
          metadata
        }])
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
   * @returns {Promise<Array>} - Document generation records
   */
  async getDocumentGenerationHistory(limit = 10, offset = 0) {
    try {
      const { data, error } = await supabase
        .from('document_generations')
        .select('*')
        .order('generated_at', { ascending: false })
        .range(offset, offset + limit - 1);
      
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