/**
 * Component Loader Utility
 * 
 * Handles automatic detection and loading of web components from HTML content
 */

/**
 * Detects and imports module scripts from HTML content
 * @param {Document} doc - Parsed HTML document
 * @returns {Promise<string[]>} - Array of imported script paths
 */
export async function detectAndImportModules(doc) {
  // Extract script tags for automatic importing
  const scriptTags = Array.from(doc.body.querySelectorAll('script[type="module"]'));
  const scriptSources = scriptTags.map(script => script.getAttribute('src')).filter(src => src);
  
  if (scriptSources.length > 0) {
    console.log(`Found ${scriptSources.length} module scripts to import automatically:`, scriptSources);
    
    // Import all scripts in parallel
    const importPromises = scriptSources.map(src => {
      // Convert relative paths if needed
      const scriptPath = src.startsWith('/') ? src : `/${src}`;
      
      // Dynamically import the script
      return import(scriptPath)
        .catch(error => {
          console.error(`Error automatically importing script ${scriptPath}:`, error);
          return null; // Return null for failed imports
        });
    });
    
    // Wait for all imports to complete
    await Promise.all(importPromises);
    
    return scriptSources;
  }
  
  return [];
}

/**
 * Filters out script tags from HTML content
 * @param {HTMLElement} element - Element to filter scripts from
 * @returns {DocumentFragment} - Document fragment with scripts removed
 */
export function filterScriptTags(element) {
  const tempDiv = document.createElement('div');
  
  // Clone all child nodes except script tags
  Array.from(element.children).forEach(child => {
    if (child.tagName !== 'SCRIPT') {
      tempDiv.appendChild(child.cloneNode(true));
    }
  });
  
  return tempDiv;
}

export default {
  detectAndImportModules,
  filterScriptTags
};