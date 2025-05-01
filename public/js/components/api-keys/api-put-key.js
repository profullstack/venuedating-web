import { ApiEndpointBase } from './api-endpoint-base.js';

/**
 * PUT /api/1/api-keys/:id endpoint component
 * Displays the documentation for the PUT /api/1/api-keys/:id endpoint
 */
export class ApiPutKey extends ApiEndpointBase {
  /**
   * Create a new PUT /api/1/api-keys/:id endpoint component
   */
  constructor() {
    super();
    this._method = 'PUT';
    this._path = '/api/1/api-keys/:id';
    this._description = 'Updates an existing API key.';
    this._parameters = [
      {
        name: 'name',
        type: 'string',
        required: false,
        description: 'A new name for the API key'
      },
      {
        name: 'is_active',
        type: 'boolean',
        required: false,
        description: 'Whether the API key is active'
      }
    ];
    this._responseExample = `{
  "id": "uuid",
  "name": "Production Updated",
  "is_active": false,
  "last_used_at": "2023-04-18T12:34:56.789Z",
  "created_at": "2023-04-18T12:34:56.789Z"
}`;
    this._codeExamples = {
      curl: `curl -X PUT "https://api.example.com/api/1/api-keys/YOUR_API_KEY_ID" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Production Updated",
    "is_active": false
  }'`,
      fetch: `// Using async/await with ES modules
const updateApiKey = async () => {
  try {
    const response = await fetch('https://api.example.com/api/1/api-keys/YOUR_API_KEY_ID', {
      method: 'PUT',
      headers: {
        'Authorization': 'Bearer YOUR_JWT_TOKEN',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Production Updated',
        is_active: false
      })
    });
    
    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.error('Error:', error);
  }
};

updateApiKey();`,
      nodejs: `// Using Node.js built-in fetch with ES modules
import { fetch } from 'node:fetch';

const updateApiKey = async () => {
  try {
    const response = await fetch('https://api.example.com/api/1/api-keys/YOUR_API_KEY_ID', {
      method: 'PUT',
      headers: {
        'Authorization': 'Bearer YOUR_JWT_TOKEN',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Production Updated',
        is_active: false
      })
    });
    
    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.error('Error:', error);
  }
};

updateApiKey();`,
      python: `import requests
import json

headers = {
    'Authorization': 'Bearer YOUR_JWT_TOKEN',
    'Content-Type': 'application/json'
}

data = {
    'name': 'Production Updated',
    'is_active': False
}

response = requests.put('https://api.example.com/api/1/api-keys/YOUR_API_KEY_ID',
                       headers=headers,
                       data=json.dumps(data))
result = response.json()
print(result)`,
      php: `$curl = curl_init();

$data = [
  'name' => 'Production Updated',
  'is_active' => false
];

curl_setopt_array($curl, [
  CURLOPT_URL => "https://api.example.com/api/1/api-keys/YOUR_API_KEY_ID",
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_CUSTOMREQUEST => "PUT",
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

uri = URI.parse('https://api.example.com/api/1/api-keys/YOUR_API_KEY_ID')
request = Net::HTTP::Put.new(uri)
request['Authorization'] = 'Bearer YOUR_JWT_TOKEN'
request['Content-Type'] = 'application/json'
request.body = JSON.dump({
  'name' => 'Production Updated',
  'is_active' => false
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
    `;
  }
}

// Define the custom element
if (!customElements.get('api-put-key')) {
  customElements.define('api-put-key', ApiPutKey);
  console.log('API PUT key component registered');
}