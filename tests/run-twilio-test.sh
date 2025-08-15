#!/bin/bash

# Colors for console output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Twilio Verification Integration Test Runner ===${NC}\n"

# Check if server is running
if ! curl -s http://localhost:3000 > /dev/null; then
  echo -e "${YELLOW}Warning: Local server doesn't seem to be running on port 3000.${NC}"
  echo -e "Make sure your server is running before executing this test.\n"
  
  read -p "Do you want to start the server now? (y/n): " START_SERVER
  if [[ $START_SERVER == "y" || $START_SERVER == "Y" ]]; then
    echo -e "\n${BLUE}Starting server in a new terminal window...${NC}"
    # Open a new terminal and start the server
    osascript -e 'tell app "Terminal" to do script "cd '$PWD'/.. && npm start"'
    echo -e "${YELLOW}Waiting 5 seconds for server to start...${NC}"
    sleep 5
  fi
fi

# Install node-fetch if not already installed
if ! grep -q "node-fetch" ../package.json; then
  echo -e "${BLUE}Installing node-fetch dependency...${NC}"
  cd .. && npm install --save-dev node-fetch
  cd tests
fi

# Run the test script
echo -e "${BLUE}Running Twilio verification test...${NC}\n"
node --experimental-modules --es-module-specifier-resolution=node twilio-verify-test.js

echo -e "\n${GREEN}Test script execution completed.${NC}"
