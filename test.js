import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Base URL for API endpoints
const API_BASE_URL = 'http://localhost:3000/api/1';

// Sample HTML content
const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Test Document</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
    }
    h1 {
      color: #333;
      border-bottom: 1px solid #ccc;
      padding-bottom: 10px;
    }
    p {
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <h1>Document Generation Test</h1>
  <p>This is a test document to verify that the document generation API is working correctly.</p>
  <p>The API should convert this HTML content into the requested format.</p>
  <p>Current date and time: ${new Date().toLocaleString()}</p>
</body>
</html>
`;

// Sample HTML with table for Excel test
const htmlWithTable = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Excel Test</title>
</head>
<body>
  <h1>Excel Generation Test</h1>
  <table>
    <thead>
      <tr>
        <th>ID</th>
        <th>Name</th>
        <th>Email</th>
        <th>Date</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>1</td>
        <td>John Doe</td>
        <td>john@example.com</td>
        <td>${new Date().toLocaleDateString()}</td>
      </tr>
      <tr>
        <td>2</td>
        <td>Jane Smith</td>
        <td>jane@example.com</td>
        <td>${new Date().toLocaleDateString()}</td>
      </tr>
      <tr>
        <td>3</td>
        <td>Bob Johnson</td>
        <td>bob@example.com</td>
        <td>${new Date().toLocaleDateString()}</td>
      </tr>
    </tbody>
  </table>
</body>
</html>
`;

// Sample HTML with headings for PowerPoint test
const htmlWithHeadings = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>PowerPoint Test</title>
</head>
<body>
  <h1>PowerPoint Generation Test</h1>
  <p>This is the introduction slide content.</p>
  
  <h2>Second Slide</h2>
  <p>This is the content for the second slide.</p>
  <p>It has multiple paragraphs of information.</p>
  
  <h2>Third Slide</h2>
  <p>This is the content for the third slide.</p>
  <ul>
    <li>Bullet point 1</li>
    <li>Bullet point 2</li>
    <li>Bullet point 3</li>
  </ul>
  
  <h2>Conclusion</h2>
  <p>This is the final slide with a conclusion.</p>
  <p>Thank you for your attention!</p>
</body>
</html>
`;

// Sample HTML for EPUB test
const htmlForEpub = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>EPUB Test</title>
</head>
<body>
  <h1>EPUB Generation Test</h1>
  <p>This is a test document for EPUB generation.</p>
  
  <h2>Chapter 1: Introduction</h2>
  <p>This is the first chapter of our test book.</p>
  <p>EPUB is an e-book file format that uses the ".epub" file extension.</p>
  
  <h2>Chapter 2: Features</h2>
  <p>EPUB files can be read on many devices and applications.</p>
  <p>The format is designed for reflowable content, meaning the text display can be optimized for the particular display device.</p>
  
  <h2>Chapter 3: Conclusion</h2>
  <p>This test demonstrates the conversion of HTML content to EPUB format.</p>
  <p>Generated on: ${new Date().toLocaleString()}</p>
</body>
</html>
`;

// Sample HTML for Markdown conversion test
const htmlForMarkdown = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Markdown Test</title>
</head>
<body>
  <h1>HTML to Markdown Test</h1>
  <p>This is a <strong>bold text</strong> and this is <em>italic text</em>.</p>
  
  <h2>Lists</h2>
  
  <h3>Unordered List</h3>
  <ul>
    <li>Item 1</li>
    <li>Item 2</li>
    <li>Item 3</li>
  </ul>
  
  <h3>Ordered List</h3>
  <ol>
    <li>First item</li>
    <li>Second item</li>
    <li>Third item</li>
  </ol>
  
  <h2>Code</h2>
  <p>Inline <code>code</code> example.</p>
  
  <pre><code>// Code block
function hello() {
  console.log("Hello, world!");
}
</code></pre>
  
  <h2>Table</h2>
  <table>
    <thead>
      <tr>
        <th>Header 1</th>
        <th>Header 2</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Cell 1</td>
        <td>Cell 2</td>
      </tr>
      <tr>
        <td>Cell 3</td>
        <td>Cell 4</td>
      </tr>
    </tbody>
  </table>
  
  <h2>Link and Image</h2>
  <p><a href="https://example.com">Example Link</a></p>
  
  <p>Current date and time: ${new Date().toLocaleString()}</p>
</body>
</html>
`;

// Sample Markdown content
const markdown = `
# Markdown Test

This is a **bold text** and this is *italic text*.

## Lists

### Unordered List
- Item 1
- Item 2
- Item 3

### Ordered List
1. First item
2. Second item
3. Third item

## Code

Inline \`code\` example.

\`\`\`javascript
// Code block
function hello() {
  console.log("Hello, world!");
}
\`\`\`

## Table

| Header 1 | Header 2 |
| -------- | -------- |
| Cell 1   | Cell 2   |
| Cell 3   | Cell 4   |

## Link and Image

[Example Link](https://example.com)

Current date and time: ${new Date().toLocaleString()}
`;

/**
 * Generic function to test an API endpoint
 * @param {string} endpoint - API endpoint path
 * @param {Object} requestBody - Request body
 * @param {string} outputPath - Path to save the output
 * @param {string} description - Test description
 * @param {Function} processResponse - Function to process the response
 * @returns {Promise<boolean>} - Whether the test passed
 */
async function testEndpoint(endpoint, requestBody, outputPath, description, processResponse) {
  try {
    console.log(`Sending request to ${description}...`);
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API request failed: ${errorData.error || response.statusText}`);
    }

    // Process the response based on the endpoint
    const result = await processResponse(response);
    
    // Save the result to a file
    fs.writeFileSync(outputPath, result);
    console.log(`${description} successfully generated and saved to: ${outputPath}`);
    return true;
  } catch (error) {
    console.error(`${description} test failed:`, error.message);
    return false;
  }
}

async function runTests() {
  console.log('Starting API tests...');
  
  // Test HTML to PDF
  const pdfResult = await testEndpoint(
    '/html-to-pdf',
    { html },
    path.join(__dirname, 'test-output.pdf'),
    'HTML to PDF API',
    async (response) => Buffer.from(await response.arrayBuffer())
  );
  
  // Test HTML to DOC
  const docResult = await testEndpoint(
    '/html-to-doc',
    { html, filename: 'test-document.doc' },
    path.join(__dirname, 'test-output.doc'),
    'HTML to DOC API',
    async (response) => Buffer.from(await response.arrayBuffer())
  );
  
  // Test HTML to Excel
  const excelResult = await testEndpoint(
    '/html-to-excel',
    { html: htmlWithTable, filename: 'test-data.xlsx', sheetName: 'TestData' },
    path.join(__dirname, 'test-output.xlsx'),
    'HTML to Excel API',
    async (response) => Buffer.from(await response.arrayBuffer())
  );
  
  // Test HTML to PowerPoint
  const pptResult = await testEndpoint(
    '/html-to-ppt',
    { html: htmlWithHeadings, filename: 'test-presentation.pptx', title: 'Test Presentation' },
    path.join(__dirname, 'test-output.pptx'),
    'HTML to PowerPoint API',
    async (response) => Buffer.from(await response.arrayBuffer())
  );
  
  // Test HTML to EPUB
  const epubResult = await testEndpoint(
    '/html-to-epub',
    { 
      html: htmlForEpub, 
      filename: 'test-book.epub', 
      title: 'Test Book', 
      author: 'API Test' 
    },
    path.join(__dirname, 'test-output.epub'),
    'HTML to EPUB API',
    async (response) => Buffer.from(await response.arrayBuffer())
  );
  
  // Test HTML to Markdown
  const htmlToMarkdownResult = await testEndpoint(
    '/html-to-markdown',
    { html: htmlForMarkdown },
    path.join(__dirname, 'test-output.md'),
    'HTML to Markdown API',
    async (response) => {
      const result = await response.json();
      return result.markdown;
    }
  );
  
  // Test Markdown to HTML
  const markdownToHtmlResult = await testEndpoint(
    '/markdown-to-html',
    { markdown },
    path.join(__dirname, 'test-output.html'),
    'Markdown to HTML API',
    async (response) => {
      const result = await response.json();
      return result.html;
    }
  );
  
  // Summary
  console.log('\nTest Results:');
  console.log(`HTML to PDF: ${pdfResult ? 'SUCCESS ✓' : 'FAILED ✗'}`);
  console.log(`HTML to DOC: ${docResult ? 'SUCCESS ✓' : 'FAILED ✗'}`);
  console.log(`HTML to Excel: ${excelResult ? 'SUCCESS ✓' : 'FAILED ✗'}`);
  console.log(`HTML to PowerPoint: ${pptResult ? 'SUCCESS ✓' : 'FAILED ✗'}`);
  console.log(`HTML to EPUB: ${epubResult ? 'SUCCESS ✓' : 'FAILED ✗'}`);
  console.log(`HTML to Markdown: ${htmlToMarkdownResult ? 'SUCCESS ✓' : 'FAILED ✗'}`);
  console.log(`Markdown to HTML: ${markdownToHtmlResult ? 'SUCCESS ✓' : 'FAILED ✗'}`);
  
  if (pdfResult && docResult && excelResult && pptResult && epubResult && htmlToMarkdownResult && markdownToHtmlResult) {
    console.log('\nAll tests passed successfully!');
  } else {
    console.log('\nSome tests failed. Check the error messages above.');
  }
}

// Wait for the server to start before running the tests
setTimeout(runTests, 2000);