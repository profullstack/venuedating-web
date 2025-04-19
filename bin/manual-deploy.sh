#!/bin/zsh

# This script manually deploys to the server without using GitHub Actions

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting manual deployment...${NC}"

# Define variables with fallbacks
REMOTE_HOST="${DEPLOY_REMOTE_HOST:-profullstack.com}"
REMOTE_DIR="${DEPLOY_REMOTE_DIR:-www/profullstack.com/pdf}"
LOCAL_DIR="."

echo -e "${YELLOW}Deployment Configuration:${NC}"
echo -e "  Remote Host: ${GREEN}$REMOTE_HOST${NC}"
echo -e "  Remote Directory: ${GREEN}$REMOTE_DIR${NC}"

# Check if the remote directory exists
echo -e "${YELLOW}Checking if remote directory exists...${NC}"
if ssh $REMOTE_HOST "[ -d $REMOTE_DIR ]"; then
  echo -e "${GREEN}Remote directory exists. Starting deployment...${NC}"
  
  # Create a timestamp for this deployment
  TIMESTAMP=$(date +%Y%m%d%H%M%S)
  echo -e "${YELLOW}Deployment timestamp: ${GREEN}$TIMESTAMP${NC}"
  
  # Create a marker file to identify this deployment
  echo "Manual deployment at $(date)" > manual-deploy-$TIMESTAMP.txt
  
  # Deploy using rsync with .deployignore
  if [ -f .deployignore ]; then
    echo -e "${YELLOW}Using .deployignore file for exclusions...${NC}"
    rsync -avz --partial --progress --exclude-from=.deployignore $LOCAL_DIR $REMOTE_HOST:$REMOTE_DIR
  else
    echo -e "${YELLOW}No .deployignore file found. Excluding node_modules/ by default...${NC}"
    rsync -avz --partial --progress --exclude="node_modules/" $LOCAL_DIR $REMOTE_HOST:$REMOTE_DIR
  fi
  
  # Check if rsync was successful
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}Deployment completed successfully!${NC}"
    
    # Make sure the scripts are executable
    echo -e "${YELLOW}Making scripts executable on remote host...${NC}"
    ssh $REMOTE_HOST "chmod +x $REMOTE_DIR/bin/*.sh"
    
    # Run the test script to verify deployment
    echo -e "${YELLOW}Running test script on remote host...${NC}"
    ssh $REMOTE_HOST "cd $REMOTE_DIR && ./bin/test-github-actions.sh"
    
    # Reload systemd daemon
    echo -e "${YELLOW}Reloading systemd daemon on remote host...${NC}"
    ssh $REMOTE_HOST "sudo systemctl daemon-reload"
    
    # Check if we should install the service
    read -p "Do you want to install/restart the service? (y/n) " INSTALL_SERVICE
    if [[ $INSTALL_SERVICE =~ ^[Yy]$ ]]; then
      echo -e "${YELLOW}Installing/restarting service on remote host...${NC}"
      ssh $REMOTE_HOST "cd $REMOTE_DIR && sudo ./bin/install-service.sh"
    else
      echo -e "${YELLOW}Skipping service installation.${NC}"
    fi
    
    echo -e "${GREEN}Manual deployment process completed!${NC}"
    echo -e "${YELLOW}Deployment marker file: ${GREEN}manual-deploy-$TIMESTAMP.txt${NC}"
  else
    echo -e "${RED}Deployment failed. Please check the error messages above.${NC}"
    exit 1
  fi
else
  echo -e "${RED}Remote directory does not exist: $REMOTE_HOST:$REMOTE_DIR${NC}"
  echo -e "${YELLOW}Please create the directory first or check your configuration.${NC}"
  exit 1
fi