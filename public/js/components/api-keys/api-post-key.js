import { ApiEndpointBase } from './api-endpoint-base.js';

/**
 * POST /api/1/api-keys endpoint component
 * Displays the documentation for the POST /api/1/api-keys endpoint
 */
export class ApiPostKey extends ApiEndpointBase {
  /**
   * Create a new POST /api/1/api-keys endpoint component
   */
  constructor() {
    super();
    this._method = 'POST';
    this._path = '/api/1/api-keys';
    this._description = 'Creates a new API key for the authenticated user.';
    this._parameters = [
      {
        name: 'name',
        type: 'string',
        required: true,
        description: 'A name for the API key'
      }
    ];
    this._responseExample = `{
  "id": "uuid",
  "name": "Production",
  "key": "pfs_a1b2c3d4e5f6...",
  "created_at": "2023-04-18T12:34:56.789Z"
}`;
    this._codeExamples = {
      curl: `curl -X POST "https://api.example.com/api/1/api-keys" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "Production"}'`,
      fetch: `fetch('https://api.example.com/api/1/api-keys', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Production'
  })
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));`,
      nodejs: `const axios = require('axios');

axios.post('https://api.example.com/api/1/api-keys', {
  name: 'Production'
}, {
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN',
    'Content-Type': 'application/json'
  }
})
.then(response => {
  console.log(response.data);
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
    'name': 'Production'
}

response = requests.post('https://api.example.com/api/1/api-keys',
                        headers=headers,
                        data=json.dumps(data))
result = response.json()
print(result)`,
      php: `$curl = curl_init();

$data = [
  'name' => 'Production'
];

curl_setopt_array($curl, [
  CURLOPT_URL => "https://api.example.com/api/1/api-keys",
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
  $result = json_decode($response, true);
  print_r($result);
}`,
      ruby: `require 'net/http'
require 'uri'
require 'json'

uri = URI.parse('https://api.example.com/api/1/api-keys')
request = Net::HTTP::Post.new(uri)
request['Authorization'] = 'Bearer YOUR_JWT_TOKEN'
request['Content-Type'] = 'application/json'
request.body = JSON.dump({
  'name' => 'Production'
})

response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: uri.scheme == 'https') do |http|
  http.request(request)
end

result = JSON.parse(response.body)
puts result`
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
      
      ${this.renderCodeExamples(this._codeExamples)}
      
      ${this.renderResponse(this._responseExample)}
      
      <div class="section-title">Important Note</div>
      <p>The API key is only returned once when it's created. Make sure to store it securely as you won't be able to retrieve it again.</p>
    `;
  }
}

// Define the custom element
if (!customElements.get('api-post-key')) {
  customElements.define('api-post-key', ApiPostKey);
  console.log('API POST key component registered');
}