import { ApiEndpointBase } from './api-endpoint-base.js';

/**
 * GET /api/1/api-keys endpoint component
 * Displays the documentation for the GET /api/1/api-keys endpoint
 */
export class ApiGetKeys extends ApiEndpointBase {
  /**
   * Create a new GET /api/1/api-keys endpoint component
   */
  constructor() {
    super();
    this._method = 'GET';
    this._path = '/api/1/api-keys';
    this._description = 'Lists all API keys for the authenticated user.';
    this._parameters = [];
    this._responseExample = `{
  "api_keys": [
    {
      "id": "uuid",
      "name": "Production",
      "is_active": true,
      "last_used_at": "2023-04-18T12:34:56.789Z",
      "created_at": "2023-04-18T12:34:56.789Z"
    },
    {
      "id": "uuid",
      "name": "Development",
      "is_active": true,
      "last_used_at": null,
      "created_at": "2023-04-18T12:34:56.789Z"
    }
  ]
}`;
    this._codeExamples = {
      curl: `curl -X GET "https://api.example.com/api/1/api-keys" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Accept: application/json"`,
      fetch: `fetch('https://api.example.com/api/1/api-keys', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN',
    'Accept': 'application/json'
  }
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));`,
      nodejs: `const axios = require('axios');

axios.get('https://api.example.com/api/1/api-keys', {
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN',
    'Accept': 'application/json'
  }
})
.then(response => {
  console.log(response.data);
})
.catch(error => {
  console.error('Error:', error);
});`,
      python: `import requests

headers = {
    'Authorization': 'Bearer YOUR_JWT_TOKEN',
    'Accept': 'application/json'
}

response = requests.get('https://api.example.com/api/1/api-keys', headers=headers)
data = response.json()
print(data)`,
      php: `$curl = curl_init();

curl_setopt_array($curl, [
  CURLOPT_URL => "https://api.example.com/api/1/api-keys",
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_HTTPHEADER => [
    "Authorization: Bearer YOUR_JWT_TOKEN",
    "Accept: application/json"
  ],
]);

$response = curl_exec($curl);
$err = curl_error($curl);

curl_close($curl);

if ($err) {
  echo "Error: " . $err;
} else {
  $data = json_decode($response, true);
  print_r($data);
}`,
      ruby: `require 'net/http'
require 'uri'
require 'json'

uri = URI.parse('https://api.example.com/api/1/api-keys')
request = Net::HTTP::Get.new(uri)
request['Authorization'] = 'Bearer YOUR_JWT_TOKEN'
request['Accept'] = 'application/json'

response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: uri.scheme == 'https') do |http|
  http.request(request)
end

data = JSON.parse(response.body)
puts data`
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
    `;
  }
}

// Define the custom element
if (!customElements.get('api-get-keys')) {
  customElements.define('api-get-keys', ApiGetKeys);
  console.log('API GET keys component registered');
}