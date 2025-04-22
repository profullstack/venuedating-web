import { supabaseUtils } from '../utils/supabase.js';

/**
 * Service for storing and retrieving documents using Supabase
 */
export const storageService = {
  /**
   * Store a PDF document in Supabase
   * @param {Buffer} pdfBuffer - PDF buffer
   * @param {string} filename - Filename
   * @param {Object} metadata - Additional metadata
   * @param {string} userEmail - User email for associating with user_id
   * @returns {Promise<Object>} - Storage result
   */
  async storePdf(pdfBuffer, filename = 'document.pdf', metadata = {}, userEmail = null) {
    const result = await supabaseUtils.storeDocument(
      pdfBuffer,
      filename,
      'application/pdf',
      metadata
    );
    
    // Record the document generation in the database
    await supabaseUtils.recordDocumentGeneration('pdf', result.path, metadata, userEmail);
    
    return result;
  },
  
  /**
   * Store a Word document in Supabase
   * @param {Buffer} docBuffer - Word document buffer
   * @param {string} filename - Filename
   * @param {Object} metadata - Additional metadata
   * @param {string} userEmail - User email for associating with user_id
   * @returns {Promise<Object>} - Storage result
   */
  async storeDoc(docBuffer, filename = 'document.doc', metadata = {}, userEmail = null) {
    const result = await supabaseUtils.storeDocument(
      docBuffer,
      filename,
      'application/msword',
      metadata
    );
    
    // Record the document generation in the database
    await supabaseUtils.recordDocumentGeneration('doc', result.path, metadata, userEmail);
    
    return result;
  },
  
  /**
   * Store an Excel spreadsheet in Supabase
   * @param {Buffer} excelBuffer - Excel buffer
   * @param {string} filename - Filename
   * @param {Object} metadata - Additional metadata
   * @param {string} userEmail - User email for associating with user_id
   * @returns {Promise<Object>} - Storage result
   */
  async storeExcel(excelBuffer, filename = 'document.xlsx', metadata = {}, userEmail = null) {
    const result = await supabaseUtils.storeDocument(
      excelBuffer,
      filename,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      metadata
    );
    
    // Record the document generation in the database
    await supabaseUtils.recordDocumentGeneration('excel', result.path, metadata, userEmail);
    
    return result;
  },
  
  /**
   * Store a PowerPoint presentation in Supabase
   * @param {Buffer} pptBuffer - PowerPoint buffer
   * @param {string} filename - Filename
   * @param {Object} metadata - Additional metadata
   * @param {string} userEmail - User email for associating with user_id
   * @returns {Promise<Object>} - Storage result
   */
  async storePpt(pptBuffer, filename = 'presentation.pptx', metadata = {}, userEmail = null) {
    const result = await supabaseUtils.storeDocument(
      pptBuffer,
      filename,
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      metadata
    );
    
    // Record the document generation in the database
    await supabaseUtils.recordDocumentGeneration('ppt', result.path, metadata, userEmail);
    
    return result;
  },
  
  /**
   * Store an EPUB document in Supabase
   * @param {Buffer} epubBuffer - EPUB buffer
   * @param {string} filename - Filename
   * @param {Object} metadata - Additional metadata
   * @param {string} userEmail - User email for associating with user_id
   * @returns {Promise<Object>} - Storage result
   */
  async storeEpub(epubBuffer, filename = 'document.epub', metadata = {}, userEmail = null) {
    const result = await supabaseUtils.storeDocument(
      epubBuffer,
      filename,
      'application/epub+zip',
      metadata
    );
    
    // Record the document generation in the database
    await supabaseUtils.recordDocumentGeneration('epub', result.path, metadata, userEmail);
    
    return result;
  },
  
  /**
   * Get document generation history
   * @param {number} limit - Maximum number of records to return
   * @param {number} offset - Offset for pagination
   * @param {string} userEmail - User email to filter by (optional)
   * @returns {Promise<Array>} - Document generation records
   */
  async getDocumentHistory(limit = 10, offset = 0, userEmail = null) {
    return await supabaseUtils.getDocumentGenerationHistory(limit, offset, userEmail);
  }
};