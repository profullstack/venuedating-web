import { ApiEndpointBase } from './api-endpoint-base.js';

/**
 * POST /api/1/html-to-excel endpoint component
 * Displays the documentation for the POST /api/1/html-to-excel endpoint
 */
export class ApiHtmlToExcel extends ApiEndpointBase {
  /**
   * Create a new POST /api/1/html-to-excel endpoint component
   */
  constructor() {
    super();
    this._method = 'POST';
    this._path = '/api/1/html-to-excel';
    this._description = 'Converts HTML tables to an Excel spreadsheet.';
    this._parameters = [
      {
        name: 'html',
        type: 'string',
        required: true,
        description: 'The HTML content containing tables to convert to Excel'
      },
      {
        name: 'sheetName',
        type: 'string',
        required: false,
        description: 'The name of the Excel sheet (default: "Sheet1")'
      },
      {
        name: 'filename',
        type: 'string',
        required: false,
        description: 'Output filename (default: "document.xlsx")'
      },
      {
        name: 'store',
        type: 'boolean',
        required: false,
        description: 'Whether to store the document in Supabase (default: false)'
      }
    ];
    this._requestExample = `{
  "html": "<table><tr><th>Name</th><th>Age</th></tr><tr><td>John</td><td>30</td></tr></table>",
  "sheetName": "Users",
  "filename": "document.xlsx",
  "store": false
}`;
    this._codeExamples = {
      curl: `curl -X POST "https://api.example.com/api/1/html-to-excel" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "html": "<table><tr><th>Name</th><th>Age</th></tr><tr><td>John</td><td>30</td></tr></table>",
    "sheetName": "Users",
    "filename": "document.xlsx",
    "store": false
  }'`,
      fetch: `fetch('https://api.example.com/api/1/html-to-excel', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    html: '<table><tr><th>Name</th><th>Age</th></tr><tr><td>John</td><td>30</td></tr></table>',
    sheetName: 'Users',
    filename: 'document.xlsx',
    store: false
  })
})
.then(response => response.blob())
.then(blob => {
  // Create a link to download the Excel file
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'document.xlsx';
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
})
.catch(error => console.error('Error:', error));`,
      nodejs: `const axios = require('axios');
const fs = require('fs');

axios.post('https://api.example.com/api/1/html-to-excel', {
  html: '<table><tr><th>Name</th><th>Age</th></tr><tr><td>John</td><td>30</td></tr></table>',
  sheetName: 'Users',
  filename: 'document.xlsx',
  store: false
}, {
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN',
    'Content-Type': 'application/json'
  },
  responseType: 'arraybuffer'
})
.then(response => {
  fs.writeFileSync('document.xlsx', response.data);
  console.log('Excel file saved to document.xlsx');
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
    'html': '<table><tr><th>Name</th><th>Age</th></tr><tr><td>John</td><td>30</td></tr></table>',
    'sheetName': 'Users',
    'filename': 'document.xlsx',
    'store': False
}

response = requests.post('https://api.example.com/api/1/html-to-excel',
                        headers=headers,
                        data=json.dumps(data))

# Save the Excel file to a file
with open('document.xlsx', 'wb') as f:
    f.write(response.content)
print('Excel file saved to document.xlsx')`,
      php: `<?php
$curl = curl_init();

$data = [
  'html' => '<table><tr><th>Name</th><th>Age</th></tr><tr><td>John</td><td>30</td></tr></table>',
  'sheetName' => 'Users',
  'filename' => 'document.xlsx',
  'store' => false
];

curl_setopt_array($curl, [
  CURLOPT_URL => "https://api.example.com/api/1/html-to-excel",
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
  // Save the Excel file to a file
  file_put_contents('document.xlsx', $response);
  echo "Excel file saved to document.xlsx";
}`,
      ruby: `require 'net/http'
require 'uri'
require 'json'

uri = URI.parse('https://api.example.com/api/1/html-to-excel')
request = Net::HTTP::Post.new(uri)
request['Authorization'] = 'Bearer YOUR_JWT_TOKEN'
request['Content-Type'] = 'application/json'
request.body = JSON.dump({
  'html' => '<table><tr><th>Name</th><th>Age</th></tr><tr><td>John</td><td>30</td></tr></table>',
  'sheetName' => 'Users',
  'filename' => 'document.xlsx',
  'store' => false
})

response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: uri.scheme == 'https') do |http|
  http.request(request)
end

# Save the Excel file to a file
File.open('document.xlsx', 'wb') do |file|
  file.write(response.body)
end
puts 'Excel file saved to document.xlsx'`
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
      <p>Returns the raw Excel file with the following headers:</p>
      <ul>
        <li><code>Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet</code></li>
        <li><code>Content-Disposition: attachment; filename="document.xlsx"</code></li>
        <li><code>X-Storage-Path: documents/...</code> (if stored in Supabase)</li>
      </ul>
    `;
  }
}

// Define the custom element
if (!customElements.get('api-html-to-excel')) {
  customElements.define('api-html-to-excel', ApiHtmlToExcel);
  console.log('API HTML to Excel component registered');
}