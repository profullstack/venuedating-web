#!/usr/bin/env node

/**
 * Route Generator
 * 
 * This script generates all the necessary files and code for a new route in the application.
 * It creates:
 * 1. An HTML view file
 * 2. An initializer function
 * 3. Adds the route to the router configuration
 * 
 * Usage:
 *   node bin/generator.js --route="/my-feature" --name="My Feature" [--auth] [--subscription]
 * 
 * Options:
 *   --route          Route path (required, e.g., "/my-feature")
 *   --name           Feature name (required, e.g., "My Feature")
 *   --auth           Require authentication (optional)
 *   --subscription   Require subscription (optional)
 *   --help           Show help
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  route: null,
  name: null,
  auth: false,
  subscription: false
};

// Show help if requested or no arguments provided
if (args.includes('--help') || args.length === 0) {
  showHelp();
  process.exit(0);
}

// Parse arguments
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  
  if (arg.startsWith('--route=')) {
    options.route = arg.substring(8);
  } else if (arg === '--route' && i + 1 < args.length) {
    options.route = args[++i];
  } else if (arg.startsWith('--name=')) {
    options.name = arg.substring(7);
  } else if (arg === '--name' && i + 1 < args.length) {
    options.name = args[++i];
  } else if (arg === '--auth') {
    options.auth = true;
  } else if (arg === '--subscription') {
    options.subscription = true;
  }
}

// Validate required options
if (!options.route) {
  console.error('Error: --route option is required');
  showHelp();
  process.exit(1);
}

if (!options.name) {
  console.error('Error: --name option is required');
  showHelp();
  process.exit(1);
}

// Clean up route path
if (!options.route.startsWith('/')) {
  options.route = '/' + options.route;
}

// Remove trailing slash if present
if (options.route.endsWith('/') && options.route !== '/') {
  options.route = options.route.slice(0, -1);
}

// Generate kebab-case and camelCase versions of the route name
const routePath = options.route.substring(1); // Remove leading slash
const kebabCase = routePath;
const camelCase = kebabToCamelCase(kebabCase);
const pascalCase = kebabToPascalCase(kebabCase);

// Define file paths
const projectRoot = path.resolve(path.join(__dirname, '..'));
const viewsDir = path.join(projectRoot, 'public', 'views');
const viewFilePath = path.join(viewsDir, `${kebabCase}.html`);
const initializerName = `init${pascalCase}Page`;
const pageInitializersPath = path.join(projectRoot, 'public', 'js', 'page-initializers.js');
const routerPath = path.join(projectRoot, 'public', 'js', 'router.js');

// Create the files
try {
  // 1. Create the HTML view file
  createViewFile(viewFilePath, options.name, kebabCase);
  console.log(`✅ Created view file: ${viewFilePath}`);

  // 2. Add initializer function to page-initializers.js
  addInitializerFunction(pageInitializersPath, initializerName, kebabCase);
  console.log(`✅ Added initializer function: ${initializerName} to page-initializers.js`);

  // 3. Add route to router.js
  addRouteToRouter(routerPath, options.route, kebabCase, initializerName, options.auth, options.subscription);
  console.log(`✅ Added route: ${options.route} to router.js`);

  console.log('\n🎉 Route generation complete!');
  console.log(`\nYou can now access your new page at: ${options.route}`);
  
  // Suggest next steps
  console.log('\nNext steps:');
  console.log('1. Customize the HTML in the view file');
  console.log('2. Add event listeners and logic to the initializer function');
  console.log('3. Restart the development server if needed');
  
} catch (error) {
  console.error(`❌ Error: ${error.message}`);
  process.exit(1);
}

/**
 * Show help information
 */
function showHelp() {
  console.log(`
Route Generator

This script generates all the necessary files and code for a new route in the application.

Usage:
  node bin/generator.js --route="/my-feature" --name="My Feature" [--auth] [--subscription]

Options:
  --route          Route path (required, e.g., "/my-feature")
  --name           Feature name (required, e.g., "My Feature")
  --auth           Require authentication (optional)
  --subscription   Require subscription (optional)
  --help           Show this help information
  `);
}

/**
 * Create the HTML view file
 * @param {string} filePath - Path to the view file
 * @param {string} featureName - Name of the feature
 * @param {string} kebabCase - Kebab-case version of the route name
 */
function createViewFile(filePath, featureName, kebabCase) {
  // Check if file already exists
  if (fs.existsSync(filePath)) {
    throw new Error(`View file already exists: ${filePath}`);
  }
  
  // Create the views directory if it doesn't exist
  const viewsDir = path.dirname(filePath);
  if (!fs.existsSync(viewsDir)) {
    fs.mkdirSync(viewsDir, { recursive: true });
  }
  
  // Generate i18n keys
  const i18nPrefix = kebabCase.replace(/-/g, '_');
  
  // Create HTML content
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${featureName}</title>
  <link rel="stylesheet" href="/css/main.css">
</head>
<body>
  <div class="${kebabCase}-container">
    <h1 data-i18n="${i18nPrefix}.title">${featureName}</h1>
    <p data-i18n="${i18nPrefix}.description">This is the ${featureName} page.</p>
    
    <div class="${kebabCase}-content">
      <!-- Your content here -->
      <form id="${kebabCase}-form">
        <div class="form-group">
          <label for="name" data-i18n="${i18nPrefix}.name_label">Name:</label>
          <input type="text" id="name" name="name" required>
        </div>
        
        <div class="form-group">
          <label for="email" data-i18n="${i18nPrefix}.email_label">Email:</label>
          <input type="email" id="email" name="email" required>
        </div>
        
        <div class="form-group">
          <label for="message" data-i18n="${i18nPrefix}.message_label">Message:</label>
          <textarea id="message" name="message" rows="4" required></textarea>
        </div>
        
        <button type="submit" data-i18n="${i18nPrefix}.submit_button">Submit</button>
      </form>
      
      <div id="form-result" class="form-result" style="display: none;"></div>
    </div>
  </div>
</body>
</html>`;

  // Write the file
  fs.writeFileSync(filePath, htmlContent);
}

/**
 * Add initializer function to page-initializers.js
 * @param {string} filePath - Path to page-initializers.js
 * @param {string} initializerName - Name of the initializer function
 * @param {string} kebabCase - Kebab-case version of the route name
 */
function addInitializerFunction(filePath, initializerName, kebabCase) {
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    throw new Error(`Page initializers file not found: ${filePath}`);
  }
  
  // Read the file content
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Check if the initializer already exists
  if (content.includes(`export function ${initializerName}`)) {
    throw new Error(`Initializer function ${initializerName} already exists in ${filePath}`);
  }
  
  // Find the last export function
  const lastExportIndex = content.lastIndexOf('export function');
  if (lastExportIndex === -1) {
    throw new Error(`Could not find export functions in ${filePath}`);
  }
  
  // Find the end of the last function
  let lastFunctionEndIndex = content.indexOf('\n}\n', lastExportIndex);
  if (lastFunctionEndIndex === -1) {
    lastFunctionEndIndex = content.indexOf('\n}', lastExportIndex);
    if (lastFunctionEndIndex === -1) {
      throw new Error(`Could not find the end of the last function in ${filePath}`);
    }
    lastFunctionEndIndex += 2; // Include the closing brace and newline
  } else {
    lastFunctionEndIndex += 3; // Include the closing brace and newlines
  }
  
  // Create the initializer function
  const initializerFunction = `
/**
 * Initialize the ${kebabCase} page
 */
export function ${initializerName}() {
  console.log('Initializing ${kebabCase} page');
  
  // Get the form element
  const form = document.getElementById('${kebabCase}-form');
  if (!form) {
    console.error('${kebabCase} form not found');
    return;
  }
  
  // Get the result container
  const resultContainer = document.getElementById('form-result');
  if (!resultContainer) {
    console.error('Form result container not found');
    return;
  }
  
  // Add submit event listener to the form
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Show loading state
    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    submitButton.textContent = 'Processing...';
    submitButton.disabled = true;
    
    try {
      // Get form data
      const formData = new FormData(form);
      const formDataObj = Object.fromEntries(formData.entries());
      
      // Process the form data
      console.log('Form data:', formDataObj);
      
      // In a real application, you would send this data to a server
      // For this example, we'll just simulate a server response
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show success message
      resultContainer.style.display = 'block';
      resultContainer.style.backgroundColor = '#d1fae5'; // Light green
      resultContainer.innerHTML = \`
        <h3>Form Submitted Successfully</h3>
        <p>Thank you, \${formDataObj.name}! Your message has been received.</p>
        <p>We'll respond to \${formDataObj.email} as soon as possible.</p>
      \`;
      
      // Reset the form
      form.reset();
    } catch (error) {
      console.error('Error submitting form:', error);
      
      // Show error message
      resultContainer.style.display = 'block';
      resultContainer.style.backgroundColor = '#fee2e2'; // Light red
      resultContainer.innerHTML = \`
        <h3>Error Submitting Form</h3>
        <p>Sorry, there was an error processing your submission.</p>
        <p>Error: \${error.message || 'Unknown error'}</p>
      \`;
    } finally {
      // Reset button state
      submitButton.textContent = originalButtonText;
      submitButton.disabled = false;
    }
  });
}`;

  // Insert the initializer function after the last function
  const newContent = content.slice(0, lastFunctionEndIndex) + initializerFunction + content.slice(lastFunctionEndIndex);
  
  // Update the exports if there's an export statement at the top
  let updatedContent = newContent;
  const exportStatement = updatedContent.match(/export\s*{\s*([^}]+)\s*}\s*from/);
  if (exportStatement) {
    const exportList = exportStatement[1];
    const lastExport = exportList.trim().split(',').pop().trim();
    const newExportList = exportList.replace(lastExport, `${lastExport},\n  ${initializerName}`);
    updatedContent = updatedContent.replace(exportList, newExportList);
  }
  
  // Write the updated content back to the file
  fs.writeFileSync(filePath, updatedContent);
}

/**
 * Add route to router.js
 * @param {string} filePath - Path to router.js
 * @param {string} routePath - Route path (e.g., "/my-feature")
 * @param {string} kebabCase - Kebab-case version of the route name
 * @param {string} initializerName - Name of the initializer function
 * @param {boolean} requireAuth - Whether authentication is required
 * @param {boolean} requireSubscription - Whether subscription is required
 */
function addRouteToRouter(filePath, routePath, kebabCase, initializerName, requireAuth, requireSubscription) {
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    throw new Error(`Router file not found: ${filePath}`);
  }
  
  // Read the file content
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Find the createRoutes call
  const createRoutesIndex = content.indexOf('const routes = createRoutes({');
  if (createRoutesIndex === -1) {
    throw new Error(`Could not find createRoutes call in ${filePath}`);
  }
  
  // Find the end of the routes object
  const routesEndIndex = content.indexOf('});', createRoutesIndex);
  if (routesEndIndex === -1) {
    throw new Error(`Could not find the end of routes object in ${filePath}`);
  }
  
  // Check if the route already exists
  const routeRegex = new RegExp(`['"]${routePath}['"]\\s*:`);
  if (routeRegex.test(content.substring(createRoutesIndex, routesEndIndex))) {
    throw new Error(`Route ${routePath} already exists in ${filePath}`);
  }
  
  // Find the last route in the object
  const lastRouteIndex = content.lastIndexOf(',', routesEndIndex);
  if (lastRouteIndex === -1) {
    throw new Error(`Could not find the last route in ${filePath}`);
  }
  
  // Create the route definition
  let routeDefinition = `\n  '${routePath}': {
    viewPath: '/views/${kebabCase}.html',
    afterRender: ${initializerName}`;
  
  if (requireAuth) {
    routeDefinition += ',\n    requireAuth: true';
  }
  
  if (requireSubscription) {
    routeDefinition += ',\n    requireSubscription: true';
  }
  
  routeDefinition += '\n  }';
  
  // Insert the route definition after the last route
  const newContent = content.slice(0, lastRouteIndex + 1) + routeDefinition + content.slice(lastRouteIndex + 1);
  
  // Write the updated content back to the file
  fs.writeFileSync(filePath, newContent);
  
  // Update the import statement for the initializer
  updateImportStatement(filePath, initializerName);
}

/**
 * Update the import statement in router.js to include the new initializer
 * @param {string} filePath - Path to router.js
 * @param {string} initializerName - Name of the initializer function
 */
function updateImportStatement(filePath, initializerName) {
  // Read the file content
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Find the import statement for page-initializers.js
  const importRegex = /import\s*{([^}]+)}\s*from\s*['"]\.\/page-initializers\.js['"]/;
  const importMatch = content.match(importRegex);
  
  if (!importMatch) {
    throw new Error(`Could not find import statement for page-initializers.js in ${filePath}`);
  }
  
  // Check if the initializer is already imported
  const importList = importMatch[1];
  if (importList.includes(initializerName)) {
    return; // Already imported
  }
  
  // Add the initializer to the import list
  const newImportList = importList.trim() + `,\n  ${initializerName}`;
  const newImportStatement = `import {\n  ${newImportList}\n} from './page-initializers.js'`;
  
  // Replace the import statement
  const newContent = content.replace(importRegex, newImportStatement);
  
  // Write the updated content back to the file
  fs.writeFileSync(filePath, newContent);
}

/**
 * Convert kebab-case to camelCase
 * @param {string} str - Kebab-case string
 * @returns {string} - camelCase string
 */
function kebabToCamelCase(str) {
  return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
}

/**
 * Convert kebab-case to PascalCase
 * @param {string} str - Kebab-case string
 * @returns {string} - PascalCase string
 */
function kebabToPascalCase(str) {
  const camelCase = kebabToCamelCase(str);
  return camelCase.charAt(0).toUpperCase() + camelCase.slice(1);
}