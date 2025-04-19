import { marked } from 'marked';
import TurndownService from 'turndown';

/**
 * Service for converting between Markdown and HTML
 */
export const markdownService = {
  /**
   * Convert Markdown to HTML
   * @param {string} markdown - The Markdown content to convert
   * @param {Object} options - Options for the marked library
   * @returns {string} - The HTML content
   */
  markdownToHtml(markdown, options = {}) {
    // Configure marked options
    const markedOptions = {
      gfm: true, // GitHub Flavored Markdown
      breaks: true, // Convert line breaks to <br>
      headerIds: true, // Add IDs to headers
      ...options
    };

    // Convert markdown to HTML
    const html = marked(markdown, markedOptions);
    
    return html;
  },

  /**
   * Convert HTML to Markdown
   * @param {string} html - The HTML content to convert
   * @param {Object} options - Options for the turndown library
   * @returns {string} - The Markdown content
   */
  htmlToMarkdown(html, options = {}) {
    // Create a new TurndownService instance
    const turndownService = new TurndownService(options);
    
    // Configure turndown options
    turndownService.use([
      // Add any plugins or rules here
    ]);
    
    // Convert HTML to Markdown
    const markdown = turndownService.turndown(html);
    
    return markdown;
  }
};