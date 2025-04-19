#!/bin/bash

# Load environment variables from .env file
if [ -f .env ]; then
    echo "Loading environment variables from .env file..."
    export $(grep -v '^#' .env | xargs)
else
    echo "No .env file found. Using default values."
fi

# Define variables with fallbacks
REMOTE_HOST="${DEPLOY_REMOTE_HOST:-profulltack}"
REMOTE_DIR="${DEPLOY_REMOTE_DIR:-www/profullstack/pdf}"
LOCAL_DIR="."

# Set colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Deployment Configuration:${NC}"
echo -e "  Remote Host: ${GREEN}$REMOTE_HOST${NC}"
echo -e "  Remote Directory: ${GREEN}$REMOTE_DIR${NC}"
echo -e "${YELLOW}Checking if remote directory exists...${NC}"

# Check if the remote directory exists
if ssh $REMOTE_HOST "[ -d $REMOTE_DIR ]"; then
    echo -e "${GREEN}Remote directory exists. Starting deployment...${NC}"
    
    # Deploy using rsync
    rsync -avz --partial --progress $LOCAL_DIR $REMOTE_HOST:$REMOTE_DIR
    
    # Check if rsync was successful
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Deployment completed successfully!${NC}"
    else
        echo -e "${RED}Deployment failed. Please check the error messages above.${NC}"
        exit 1
    fi
else
    echo -e "${RED}Remote directory does not exist: $REMOTE_HOST:$REMOTE_DIR${NC}"
    echo -e "${YELLOW}Please create the directory first or check your configuration in .env file.${NC}"
    exit 1
fi