import { ApiEndpointBase } from './api-endpoint-base.js';

/**
 * POST /api/1/html-to-epub endpoint component
 * Displays the documentation for the POST /api/1/html-to-epub endpoint
 */
export class ApiHtmlToEpub extends ApiEndpointBase {
  /**
   * Create a new POST /api/1/html-to-epub endpoint component
   */
  constructor() {
    super();
    this._method = 'POST';
    this._path = '/api/1/html-to-epub';
    this._description = 'Converts HTML content to an EPUB e-book.';
    this._parameters = [
      {
        name: 'html',
        type: 'string',
        required: true,
        description: 'The HTML content to convert to EPUB'
      },
      {
        name: 'title',
        type: 'string',
        required: false,
        description: 'The title of the e-book (default: "Document")'
      },
      {
        name: 'author',
        type: 'string',
        required: false,
        description: 'The author of the e-book (default: "Unknown")'
      },
      {
        name: 'filename',
        type: 'string',
        required: false,
        description: 'Output filename (default: "document.epub")'
      },
      {
        name: 'store',
        type: 'boolean',
        required: false,
        description: 'Whether to store the document in Supabase (default: false)'
      }
    ];
    this._requestExample = `{
  "html": "<html><body><h1>Hello, World!</h1></body></html>",
  "title": "My E-Book",
  "author": "John Doe",
  "filename": "document.epub",
  "store": false
}`;
    this._codeExamples = {
      curl: `curl -X POST "https://api.example.com/api/1/html-to-epub" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "html": "<html><body><h1>Hello, World!</h1></body></html>",
    "title": "My E-Book",
    "author": "John Doe",
    "filename": "document.epub",
    "store": false
  }'`,
      fetch: `fetch('https://api.example.com/api/1/html-to-epub', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    html: '<html><body><h1>Hello, World!</h1></body></html>',
    title: 'My E-Book',
    author: 'John Doe',
    filename: 'document.epub',
    store: false
  })
})
.then(response => response.blob())
.then(blob => {
  // Create a link to download the EPUB
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'document.epub';
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
})
.catch(error => console.error('Error:', error));`,
      nodejs: `const axios = require('axios');
const fs = require('fs');

axios.post('https://api.example.com/api/1/html-to-epub', {
  html: '<html><body><h1>Hello, World!</h1></body></html>',
  title: 'My E-Book',
  author: 'John Doe',
  filename: 'document.epub',
  store: false
}, {
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN',
    'Content-Type': 'application/json'
  },
  responseType: 'arraybuffer'
})
.then(response => {
  fs.writeFileSync('document.epub', response.data);
  console.log('EPUB saved to document.epub');
})
.catch(error => {
  console.error('Error:', error);
});`,
      python: `import requests
import json

headers = {
    'Authorization': 'Bearer YOUR_JWT_TOKEN',
    'Content-Type': 'application/json'
}

data = {
    'html': '<html><body><h1>Hello, World!</h1></body></html>',
    'title': 'My E-Book',
    'author': 'John Doe',
    'filename': 'document.epub',
    'store': False
}

response = requests.post('https://api.example.com/api/1/html-to-epub',
                        headers=headers,
                        data=json.dumps(data))

# Save the EPUB to a file
with open('document.epub', 'wb') as f:
    f.write(response.content)
print('EPUB saved to document.epub')`,
      php: `<?php
$curl = curl_init();

$data = [
  'html' => '<html><body><h1>Hello, World!</h1></body></html>',
  'title' => 'My E-Book',
  'author' => 'John Doe',
  'filename' => 'document.epub',
  'store' => false
];

curl_setopt_array($curl, [
  CURLOPT_URL => "https://api.example.com/api/1/html-to-epub",
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_CUSTOMREQUEST => "POST",
  CURLOPT_POSTFIELDS => json_encode($data),
  CURLOPT_HTTPHEADER => [
    "Authorization: Bearer YOUR_JWT_TOKEN",
    "Content-Type: application/json"
  ],
]);

$response = curl_exec($curl);
$err = curl_error($curl);

curl_close($curl);

if ($err) {
  echo "Error: " . $err;
} else {
  // Save the EPUB to a file
  file_put_contents('document.epub', $response);
  echo "EPUB saved to document.epub";
}`,
      ruby: `require 'net/http'
require 'uri'
require 'json'

uri = URI.parse('https://api.example.com/api/1/html-to-epub')
request = Net::HTTP::Post.new(uri)
request['Authorization'] = 'Bearer YOUR_JWT_TOKEN'
request['Content-Type'] = 'application/json'
request.body = JSON.dump({
  'html' => '<html><body><h1>Hello, World!</h1></body></html>',
  'title' => 'My E-Book',
  'author' => 'John Doe',
  'filename' => 'document.epub',
  'store' => false
})

response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: uri.scheme == 'https') do |http|
  http.request(request)
end

# Save the EPUB to a file
File.open('document.epub', 'wb') do |file|
  file.write(response.body)
end
puts 'EPUB saved to document.epub'`
    };
  }

  /**
   * Get the component's template
   * @returns {string} - HTML template
   */
  getTemplate() {
    return `
      <div class="endpoint-header">
        <span class="http-method method-${this._method.toLowerCase()}">${this._method}</span>
        <span class="endpoint-path">${this._path}</span>
      </div>
      
      <div class="endpoint-description">
        <p>${this._description}</p>
      </div>
      
      ${this.renderParametersTable(this._parameters)}
      
      <div class="section-title">Example Request</div>
      <div class="code-block">
        <pre>${this.escapeHtml(this._requestExample)}</pre>
      </div>
      
      ${this.renderCodeExamples(this._codeExamples)}
      
      <div class="section-title">Response</div>
      <p>Returns the raw EPUB file with the following headers:</p>
      <ul>
        <li><code>Content-Type: application/epub+zip</code></li>
        <li><code>Content-Disposition: attachment; filename="document.epub"</code></li>
        <li><code>X-Storage-Path: documents/...</code> (if stored in Supabase)</li>
      </ul>
    `;
  }
}

// Define the custom element
if (!customElements.get('api-html-to-epub')) {
  customElements.define('api-html-to-epub', ApiHtmlToEpub);
  console.log('API HTML to EPUB component registered');
}