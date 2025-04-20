/**
 * API client for document generation service
 */
export class ApiClient {
  /**
   * Base URL for API endpoints
   * @type {string}
   */
  static baseUrl = '/api/1';

  /**
   * Convert HTML to PDF
   * @param {string} html - HTML content
   * @param {Object} options - PDF generation options
   * @param {string} filename - Output filename
   * @param {boolean} store - Whether to store the document in Supabase
   * @returns {Promise<Blob>} - PDF blob
   */
  static async htmlToPdf(html, options = {}, filename = 'document.pdf', store = false) {
    return this.fetchBinaryResponse(`${this.baseUrl}/html-to-pdf`, { 
      html, 
      options, 
      filename, 
      store 
    });
  }

  /**
   * Convert HTML to Word document
   * @param {string} html - HTML content
   * @param {string} filename - Output filename
   * @param {boolean} store - Whether to store the document in Supabase
   * @returns {Promise<Blob>} - Word document blob
   */
  static async htmlToDoc(html, filename = 'document.doc', store = false) {
    return this.fetchBinaryResponse(`${this.baseUrl}/html-to-doc`, { 
      html, 
      filename, 
      store 
    });
  }

  /**
   * Convert HTML to Excel spreadsheet
   * @param {string} html - HTML content with tables
   * @param {string} filename - Output filename
   * @param {string} sheetName - Sheet name
   * @param {boolean} store - Whether to store the document in Supabase
   * @returns {Promise<Blob>} - Excel blob
   */
  static async htmlToExcel(html, filename = 'document.xlsx', sheetName = 'Sheet1', store = false) {
    return this.fetchBinaryResponse(`${this.baseUrl}/html-to-excel`, { 
      html, 
      filename, 
      sheetName, 
      store 
    });
  }

  /**
   * Convert HTML to PowerPoint presentation
   * @param {string} html - HTML content with headings
   * @param {string} filename - Output filename
   * @param {string} title - Presentation title
   * @param {boolean} store - Whether to store the document in Supabase
   * @returns {Promise<Blob>} - PowerPoint blob
   */
  static async htmlToPpt(html, filename = 'presentation.pptx', title = 'Presentation', store = false) {
    return this.fetchBinaryResponse(`${this.baseUrl}/html-to-ppt`, { 
      html, 
      filename, 
      title, 
      store 
    });
  }

  /**
   * Convert HTML to EPUB
   * @param {string} html - HTML content
   * @param {string} filename - Output filename
   * @param {string} title - Book title
   * @param {string} author - Book author
   * @param {string} cover - Cover image path
   * @param {boolean} store - Whether to store the document in Supabase
   * @returns {Promise<Blob>} - EPUB blob
   */
  static async htmlToEpub(html, filename = 'document.epub', title = '', author = '', cover = '', store = false) {
    return this.fetchBinaryResponse(`${this.baseUrl}/html-to-epub`, { 
      html, 
      filename, 
      title, 
      author, 
      cover,
      store
    });
  }

  /**
   * Convert HTML to Markdown
   * @param {string} html - HTML content
   * @param {Object} options - Turndown options
   * @returns {Promise<string>} - Markdown content
   */
  static async htmlToMarkdown(html, options = {}) {
    const response = await this.fetchJsonResponse(`${this.baseUrl}/html-to-markdown`, { html, options });
    return response.markdown;
  }

  /**
   * Convert Markdown to HTML
   * @param {string} markdown - Markdown content
   * @param {Object} options - Marked options
   * @returns {Promise<string>} - HTML content
   */
  static async markdownToHtml(markdown, options = {}) {
    const response = await this.fetchJsonResponse(`${this.baseUrl}/markdown-to-html`, { markdown, options });
    return response.html;
  }

  /**
   * Get document generation history
   * @param {number} limit - Maximum number of records to return
   * @param {number} offset - Offset for pagination
   * @returns {Promise<Object>} - Document history data with pagination
   */
  static async getDocumentHistory(limit = 10, offset = 0) {
    const url = new URL(`${window.location.origin}${this.baseUrl}/document-history`);
    url.searchParams.append('limit', limit.toString());
    url.searchParams.append('offset', offset.toString());
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || response.statusText);
    }

    return await response.json();
  }

  /**
   * Create a new subscription
   * @param {string} email - User email
   * @param {string} plan - Subscription plan (monthly, yearly)
   * @param {string} coin - Cryptocurrency code (btc, eth, sol, usdc)
   * @returns {Promise<Object>} - Subscription details
   */
  /**
   * Create a new subscription
   * @param {string} email - User email
   * @param {string} plan - Subscription plan (monthly, yearly)
   * @param {string} coin - Cryptocurrency code (btc, eth, sol, usdc)
   * @returns {Promise<Object>} - Subscription details with payment info
   */
  static async createSubscription(email, plan, coin) {
    try {
      const response = await fetch(`${this.baseUrl}/subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          plan,
          coin
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create subscription');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }

  /**
   * Check subscription status
   * @param {string} email - User email
   * @returns {Promise<Object>} - Subscription status
   */
  static async checkSubscriptionStatus(email) {
    return this.fetchJsonResponse(`${this.baseUrl}/subscription-status`, {
      email
    });
  }

  /**
   * Fetch a binary response from an API endpoint
   * @param {string} url - API endpoint URL
   * @param {Object} body - Request body
   * @returns {Promise<Blob>} - Binary blob
   * @private
   */
  static async fetchBinaryResponse(url, body) {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || response.statusText);
    }

    return await response.blob();
  }

  /**
   * Fetch a JSON response from an API endpoint
   * @param {string} url - API endpoint URL
   * @param {Object} body - Request body
   * @returns {Promise<Object>} - JSON response
   * @private
   */
  static async fetchJsonResponse(url, body) {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || response.statusText);
    }

    return await response.json();
  }

  /**
   * Download a blob as a file
   * @param {Blob} blob - Blob to download
   * @param {string} filename - Filename
   */
  static downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}