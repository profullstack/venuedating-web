import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

async function testPdfGeneration() {
  try {
    console.log('Sending request to HTML to PDF API...');
    
    const response = await fetch('http://localhost:3000/api/1/html-to-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ html }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API request failed: ${errorData.error || response.statusText}`);
    }

    const pdfBuffer = await response.arrayBuffer();
    const outputPath = path.join(__dirname, 'test-output.pdf');
    
    fs.writeFileSync(outputPath, Buffer.from(pdfBuffer));
    console.log(`PDF successfully generated and saved to: ${outputPath}`);
    return true;
  } catch (error) {
    console.error('PDF test failed:', error.message);
    return false;
  }
}

async function testDocGeneration() {
  try {
    console.log('Sending request to HTML to DOC API...');
    
    const response = await fetch('http://localhost:3000/api/1/html-to-doc', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        html,
        filename: 'test-document.doc' 
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API request failed: ${errorData.error || response.statusText}`);
    }

    const docBuffer = await response.arrayBuffer();
    const outputPath = path.join(__dirname, 'test-output.doc');
    
    fs.writeFileSync(outputPath, Buffer.from(docBuffer));
    console.log(`Word document successfully generated and saved to: ${outputPath}`);
    return true;
  } catch (error) {
    console.error('DOC test failed:', error.message);
    return false;
  }
}

async function testExcelGeneration() {
  try {
    console.log('Sending request to HTML to Excel API...');
    
    const response = await fetch('http://localhost:3000/api/1/html-to-excel', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        html: htmlWithTable,
        filename: 'test-data.xlsx',
        sheetName: 'TestData'
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API request failed: ${errorData.error || response.statusText}`);
    }

    const excelBuffer = await response.arrayBuffer();
    const outputPath = path.join(__dirname, 'test-output.xlsx');
    
    fs.writeFileSync(outputPath, Buffer.from(excelBuffer));
    console.log(`Excel file successfully generated and saved to: ${outputPath}`);
    return true;
  } catch (error) {
    console.error('Excel test failed:', error.message);
    return false;
  }
}

async function testPptGeneration() {
  try {
    console.log('Sending request to HTML to PowerPoint API...');
    
    const response = await fetch('http://localhost:3000/api/1/html-to-ppt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        html: htmlWithHeadings,
        filename: 'test-presentation.pptx',
        title: 'Test Presentation'
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API request failed: ${errorData.error || response.statusText}`);
    }

    const pptBuffer = await response.arrayBuffer();
    const outputPath = path.join(__dirname, 'test-output.pptx');
    
    fs.writeFileSync(outputPath, Buffer.from(pptBuffer));
    console.log(`PowerPoint file successfully generated and saved to: ${outputPath}`);
    return true;
  } catch (error) {
    console.error('PowerPoint test failed:', error.message);
    return false;
  }
}

async function testHtmlToMarkdown() {
  try {
    console.log('Sending request to HTML to Markdown API...');
    
    const response = await fetch('http://localhost:3000/api/1/html-to-markdown', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        html: htmlForMarkdown
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API request failed: ${errorData.error || response.statusText}`);
    }

    const result = await response.json();
    const outputPath = path.join(__dirname, 'test-output.md');
    
    fs.writeFileSync(outputPath, result.markdown);
    console.log(`HTML successfully converted to Markdown and saved to: ${outputPath}`);
    return true;
  } catch (error) {
    console.error('HTML to Markdown test failed:', error.message);
    return false;
  }
}

async function testMarkdownConversion() {
  try {
    console.log('Sending request to Markdown to HTML API...');
    
    const response = await fetch('http://localhost:3000/api/1/markdown-to-html', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ markdown }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API request failed: ${errorData.error || response.statusText}`);
    }

    const result = await response.json();
    const outputPath = path.join(__dirname, 'test-output.html');
    
    fs.writeFileSync(outputPath, result.html);
    console.log(`Markdown successfully converted to HTML and saved to: ${outputPath}`);
    return true;
  } catch (error) {
    console.error('Markdown conversion test failed:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('Starting API tests...');
  
  // Test PDF generation
  const pdfResult = await testPdfGeneration();
  
  // Test DOC generation
  const docResult = await testDocGeneration();
  
  // Test Excel generation
  const excelResult = await testExcelGeneration();
  
  // Test PowerPoint generation
  const pptResult = await testPptGeneration();
  
  // Test HTML to Markdown conversion
  const htmlToMarkdownResult = await testHtmlToMarkdown();
  
  // Test Markdown to HTML conversion
  const markdownToHtmlResult = await testMarkdownConversion();
  
  // Summary
  console.log('\nTest Results:');
  console.log(`PDF Generation: ${pdfResult ? 'SUCCESS ✓' : 'FAILED ✗'}`);
  console.log(`DOC Generation: ${docResult ? 'SUCCESS ✓' : 'FAILED ✗'}`);
  console.log(`Excel Generation: ${excelResult ? 'SUCCESS ✓' : 'FAILED ✗'}`);
  console.log(`PowerPoint Generation: ${pptResult ? 'SUCCESS ✓' : 'FAILED ✗'}`);
  console.log(`HTML to Markdown: ${htmlToMarkdownResult ? 'SUCCESS ✓' : 'FAILED ✗'}`);
  console.log(`Markdown to HTML: ${markdownToHtmlResult ? 'SUCCESS ✓' : 'FAILED ✗'}`);
  
  if (pdfResult && docResult && excelResult && pptResult && htmlToMarkdownResult && markdownToHtmlResult) {
    console.log('\nAll tests passed successfully!');
  } else {
    console.log('\nSome tests failed. Check the error messages above.');
  }
}

// Wait for the server to start before running the tests
setTimeout(runTests, 2000);