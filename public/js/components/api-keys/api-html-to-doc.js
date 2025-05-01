import { ApiEndpointBase } from './api-endpoint-base.js';

/**
 * POST /api/1/html-to-doc endpoint component
 * Displays the documentation for the POST /api/1/html-to-doc endpoint
 */
export class ApiHtmlToDoc extends ApiEndpointBase {
  /**
   * Create a new POST /api/1/html-to-doc endpoint component
   */
  constructor() {
    super();
    this._method = 'POST';
    this._path = '/api/1/html-to-doc';
    this._description = 'Converts HTML content to a Microsoft Word document.';
    this._parameters = [
      {
        name: 'html',
        type: 'string',
        required: true,
        description: 'The HTML content to convert to Word'
      },
      {
        name: 'filename',
        type: 'string',
        required: false,
        description: 'Output filename (default: "document.doc")'
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
  "filename": "document.doc",
  "store": false
}`;
    this._codeExamples = {
      curl: `curl -X POST "https://api.example.com/api/1/html-to-doc" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "html": "<html><body><h1>Hello, World!</h1></body></html>",
    "filename": "document.doc",
    "store": false
  }'`,
      fetch: `fetch('https://api.example.com/api/1/html-to-doc', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    html: '<html><body><h1>Hello, World!</h1></body></html>',
    filename: 'document.doc',
    store: false
  })
})
.then(response => response.blob())
.then(blob => {
  // Create a link to download the Word document
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'document.doc';
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
})
.catch(error => console.error('Error:', error));`,
      nodejs: `const axios = require('axios');
const fs = require('fs');

axios.post('https://api.example.com/api/1/html-to-doc', {
  html: '<html><body><h1>Hello, World!</h1></body></html>',
  filename: 'document.doc',
  store: false
}, {
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN',
    'Content-Type': 'application/json'
  },
  responseType: 'arraybuffer'
})
.then(response => {
  fs.writeFileSync('document.doc', response.data);
  console.log('Word document saved to document.doc');
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
    'filename': 'document.doc',
    'store': False
}

response = requests.post('https://api.example.com/api/1/html-to-doc',
                        headers=headers,
                        data=json.dumps(data))

# Save the Word document to a file
with open('document.doc', 'wb') as f:
    f.write(response.content)
print('Word document saved to document.doc')`,
      php: `<?php
$curl = curl_init();

$data = [
  'html' => '<html><body><h1>Hello, World!</h1></body></html>',
  'filename' => 'document.doc',
  'store' => false
];

curl_setopt_array($curl, [
  CURLOPT_URL => "https://api.example.com/api/1/html-to-doc",
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
  // Save the Word document to a file
  file_put_contents('document.doc', $response);
  echo "Word document saved to document.doc";
}`,
      ruby: `require 'net/http'
require 'uri'
require 'json'

uri = URI.parse('https://api.example.com/api/1/html-to-doc')
request = Net::HTTP::Post.new(uri)
request['Authorization'] = 'Bearer YOUR_JWT_TOKEN'
request['Content-Type'] = 'application/json'
request.body = JSON.dump({
  'html' => '<html><body><h1>Hello, World!</h1></body></html>',
  'filename' => 'document.doc',
  'store' => false
})

response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: uri.scheme == 'https') do |http|
  http.request(request)
end

# Save the Word document to a file
File.open('document.doc', 'wb') do |file|
  file.write(response.body)
end
puts 'Word document saved to document.doc'`
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
      <p>Returns the raw Word document file with the following headers:</p>
      <ul>
        <li><code>Content-Type: application/msword</code></li>
        <li><code>Content-Disposition: attachment; filename="document.doc"</code></li>
        <li><code>X-Storage-Path: documents/...</code> (if stored in Supabase)</li>
      </ul>
    `;
  }
}

// Define the custom element
if (!customElements.get('api-html-to-doc')) {
  customElements.define('api-html-to-doc', ApiHtmlToDoc);
  console.log('API HTML to DOC component registered');
}