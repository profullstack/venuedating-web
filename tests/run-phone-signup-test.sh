#!/bin/bash

# Colors for console output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Phone Signup Test Runner ===${NC}"

# Check if server is running
echo -e "${YELLOW}Checking if server is running...${NC}"
if ! curl -s http://localhost:3000/api/health > /dev/null; then
  echo -e "${RED}Error: Server is not running at http://localhost:3000${NC}"
  echo -e "${YELLOW}Please start the server first with 'npm run dev' or 'npm start'${NC}"
  exit 1
fi
echo -e "${GREEN}Server is running!${NC}"

# Check if node-fetch is installed
echo -e "${YELLOW}Checking dependencies...${NC}"
if ! npm list node-fetch > /dev/null 2>&1; then
  echo -e "${YELLOW}Installing node-fetch...${NC}"
  npm install node-fetch
fi
echo -e "${GREEN}Dependencies are installed!${NC}"

# Ask for confirmation
echo
echo -e "${YELLOW}This script will test the phone signup flow with Twilio direct integration by:${NC}"
echo "1. Initiating signup with test phone numbers"
echo "2. Completing signup with test verification code (123456)"
echo "3. Testing error cases and edge cases"
echo
echo -e "${YELLOW}Note: This uses test phone numbers and doesn't send actual SMS messages.${NC}"
echo

read -p "Do you want to proceed? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${RED}Test cancelled.${NC}"
  exit 1
fi

# Run the test script
echo -e "${GREEN}Running phone signup tests...${NC}"
echo
API_BASE_URL=http://localhost:3000 node tests/phone-signup-test.js
