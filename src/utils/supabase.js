import { createClient } from '@supabase/supabase-js';

/**
 * Supabase configuration
 */
const supabaseUrl = 'https://arokhsfbkdnfuklmqajh.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY;

/**
 * Create and export the Supabase client
 */
export const supabase = createClient(supabaseUrl, supabaseKey);

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