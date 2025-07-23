#!/bin/bash

# Base URL for API
BASE_URL="http://localhost:8097"

# Test venues endpoint (should work without authentication)
echo "Testing venues endpoint..."
curl -s "${BASE_URL}/api/venues" | jq '.' || echo "Failed to get venues"

# Test conversations endpoint with fixed schema
echo -e "\nTesting conversations endpoint..."
curl -s "${BASE_URL}/api/conversations" | jq '.' || echo "Failed to get conversations"

# Test matches endpoint
echo -e "\nTesting matches endpoint..."
curl -s "${BASE_URL}/api/matches" | jq '.' || echo "Failed to get matches"

# Test notifications endpoint with new schema
echo -e "\nTesting notifications endpoint..."
curl -s "${BASE_URL}/api/notifications" | jq '.' || echo "Failed to get notifications"

echo -e "\nAll tests completed"
