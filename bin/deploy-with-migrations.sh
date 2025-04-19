#!/usr/bin/env zsh
set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting deployment with migrations...${NC}"

# Load environment variables from .env file
if [ -f .env ]; then
    echo "Loading environment variables from .env file..."
    export $(grep -v '^#' .env | xargs)
else
    echo "No .env file found. Using default values."
fi

# Define variables with fallbacks
REMOTE_HOST="${DEPLOY_REMOTE_HOST:-104.36.23.197}"
REMOTE_PORT="${DEPLOY_REMOTE_PORT:-2048}"
REMOTE_USER="${DEPLOY_REMOTE_USER:-ubuntu}"
REMOTE_DIR="${DEPLOY_REMOTE_DIR:-www/profullstack.com/pdf}"

# Create SSH options
SSH_OPTS="-p $REMOTE_PORT"

# Deploy the code first
echo -e "${YELLOW}Running deployment script...${NC}"
./bin/deploy.sh

echo -e "${GREEN}Deployment successful!${NC}"

# Run install-service.sh on the remote server to install dependencies and set up the service
echo -e "${YELLOW}Installing service and dependencies on remote server...${NC}"
ssh $SSH_OPTS $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_DIR && chmod +x ./bin/install-service.sh && sudo ./bin/install-service.sh"

# Run Supabase setup and migrations on the remote server
echo -e "${YELLOW}Running Supabase setup and migrations on remote server...${NC}"
ssh $SSH_OPTS $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_DIR && chmod +x ./bin/supabase-db.sh && ./bin/supabase-db.sh setup && ./bin/supabase-db.sh migrate"

if [ $? -eq 0 ]; then
  echo -e "${GREEN}Migrations successful!${NC}"
else
  echo -e "${RED}Migrations failed. Please check the error messages above.${NC}"
  echo -e "${YELLOW}You can try running migrations manually by connecting to the remote server and running:${NC}"
  echo -e "  ssh $SSH_OPTS $REMOTE_USER@$REMOTE_HOST \"cd $REMOTE_DIR && ./bin/supabase-db.sh migrate\""
  exit 1
fi

# The service is already started by install-service.sh, but we'll restart it to be sure
echo -e "${YELLOW}Restarting service...${NC}"
ssh $SSH_OPTS $REMOTE_USER@$REMOTE_HOST "sudo systemctl restart profullstack-pdf.service"

echo -e "${GREEN}Service restarted successfully!${NC}"
echo -e "${GREEN}Deployment with migrations completed successfully!${NC}"

exit 0