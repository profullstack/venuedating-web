import { ApiEndpointBase } from './api-endpoint-base.js';

/**
 * POST /api/1/markdown-to-html endpoint component
 * Displays the documentation for the POST /api/1/markdown-to-html endpoint
 */
export class ApiMarkdownToHtml extends ApiEndpointBase {
  /**
   * Create a new POST /api/1/markdown-to-html endpoint component
   */
  constructor() {
    super();
    this._method = 'POST';
    this._path = '/api/1/markdown-to-html';
    this._description = 'Converts Markdown content to HTML format.';
    this._parameters = [
      {
        name: 'markdown',
        type: 'string',
        required: true,
        description: 'The Markdown content to convert to HTML'
      },
      {
        name: 'filename',
        type: 'string',
        required: false,
        description: 'Output filename (default: "document.html")'
      },
      {
        name: 'store',
        type: 'boolean',
        required: false,
        description: 'Whether to store the document in Supabase (default: false)'
      }
    ];
    this._requestExample = `{
  "markdown": "# Hello, World!\\n\\nThis is a **test**.",
  "filename": "document.html",
  "store": false
}`;
    this._codeExamples = {
      curl: `curl -X POST "https://api.example.com/api/1/markdown-to-html" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "markdown": "# Hello, World!\\n\\nThis is a **test**.",
    "filename": "document.html",
    "store": false
  }'`,
      fetch: `fetch('https://api.example.com/api/1/markdown-to-html', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    markdown: '# Hello, World!\\n\\nThis is a **test**.',
    filename: 'document.html',
    store: false
  })
})
.then(response => response.text())
.then(html => {
  console.log(html);
  // Create a link to download the HTML file
  const blob = new Blob([html], { type: 'text/html' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'document.html';
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
})
.catch(error => console.error('Error:', error));`,
      nodejs: `const axios = require('axios');
const fs = require('fs');

axios.post('https://api.example.com/api/1/markdown-to-html', {
  markdown: '# Hello, World!\\n\\nThis is a **test**.',
  filename: 'document.html',
  store: false
}, {
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN',
    'Content-Type': 'application/json'
  }
})
.then(response => {
  fs.writeFileSync('document.html', response.data);
  console.log('HTML file saved to document.html');
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
    'markdown': '# Hello, World!\\n\\nThis is a **test**.',
    'filename': 'document.html',
    'store': False
}

response = requests.post('https://api.example.com/api/1/markdown-to-html',
                        headers=headers,
                        data=json.dumps(data))

# Save the HTML to a file
with open('document.html', 'w') as f:
    f.write(response.text)
print('HTML file saved to document.html')`,
      php: `<?php
$curl = curl_init();

$data = [
  'markdown' => '# Hello, World!\\n\\nThis is a **test**.',
  'filename' => 'document.html',
  'store' => false
];

curl_setopt_array($curl, [
  CURLOPT_URL => "https://api.example.com/api/1/markdown-to-html",
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
  // Save the HTML to a file
  file_put_contents('document.html', $response);
  echo "HTML file saved to document.html";
}`,
      ruby: `require 'net/http'
require 'uri'
require 'json'

uri = URI.parse('https://api.example.com/api/1/markdown-to-html')
request = Net::HTTP::Post.new(uri)
request['Authorization'] = 'Bearer YOUR_JWT_TOKEN'
request['Content-Type'] = 'application/json'
request.body = JSON.dump({
  'markdown' => '# Hello, World!\\n\\nThis is a **test**.',
  'filename' => 'document.html',
  'store' => false
})

response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: uri.scheme == 'https') do |http|
  http.request(request)
end

# Save the HTML to a file
File.open('document.html', 'w') do |file|
  file.write(response.body)
end
puts 'HTML file saved to document.html'`
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
        <pre>${this._requestExample}</pre>
      </div>
      
      ${this.renderCodeExamples(this._codeExamples)}
      
      <div class="section-title">Response</div>
      <p>Returns the HTML content with the following headers:</p>
      <ul>
        <li><code>Content-Type: text/html</code></li>
        <li><code>Content-Disposition: attachment; filename="document.html"</code></li>
        <li><code>X-Storage-Path: documents/...</code> (if stored in Supabase)</li>
      </ul>
      
      <div class="section-title">Example Response</div>
      <div class="code-block">
        <pre>&lt;h1&gt;Hello, World!&lt;/h1&gt;
&lt;p&gt;This is a &lt;strong&gt;test&lt;/strong&gt;.&lt;/p&gt;</pre>
      </div>
    `;
  }
}

// Define the custom element
if (!customElements.get('api-markdown-to-html')) {
  customElements.define('api-markdown-to-html', ApiMarkdownToHtml);
  console.log('API Markdown to HTML component registered');
}