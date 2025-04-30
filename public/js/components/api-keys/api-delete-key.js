import { ApiEndpointBase } from './api-endpoint-base.js';

/**
 * DELETE /api/1/api-keys/:id endpoint component
 * Displays the documentation for the DELETE /api/1/api-keys/:id endpoint
 */
export class ApiDeleteKey extends ApiEndpointBase {
  /**
   * Create a new DELETE /api/1/api-keys/:id endpoint component
   */
  constructor() {
    super();
    this._method = 'DELETE';
    this._path = '/api/1/api-keys/:id';
    this._description = 'Deletes an API key.';
    this._parameters = [];
    this._responseExample = `{
  "success": true
}`;
    this._codeExamples = {
      curl: `curl -X DELETE "https://api.example.com/api/1/api-keys/YOUR_API_KEY_ID" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`,
      fetch: `fetch('https://api.example.com/api/1/api-keys/YOUR_API_KEY_ID', {
  method: 'DELETE',
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  }
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));`,
      nodejs: `const axios = require('axios');

axios.delete('https://api.example.com/api/1/api-keys/YOUR_API_KEY_ID', {
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
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
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
}

response = requests.delete('https://api.example.com/api/1/api-keys/YOUR_API_KEY_ID',
                          headers=headers)
result = response.json()
print(result)`,
      php: `$curl = curl_init();

curl_setopt_array($curl, [
  CURLOPT_URL => "https://api.example.com/api/1/api-keys/YOUR_API_KEY_ID",
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_CUSTOMREQUEST => "DELETE",
  CURLOPT_HTTPHEADER => [
    "Authorization: Bearer YOUR_JWT_TOKEN"
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

uri = URI.parse('https://api.example.com/api/1/api-keys/YOUR_API_KEY_ID')
request = Net::HTTP::Delete.new(uri)
request['Authorization'] = 'Bearer YOUR_JWT_TOKEN'

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
    `;
  }
}

// Define the custom element
if (!customElements.get('api-delete-key')) {
  customElements.define('api-delete-key', ApiDeleteKey);
  console.log('API DELETE key component registered');
}