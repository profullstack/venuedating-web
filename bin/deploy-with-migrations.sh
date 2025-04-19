#!/usr/bin/env zsh
set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting deployment with migrations...${NC}"

# Deploy the code first
echo -e "${YELLOW}Running deployment script...${NC}"
./bin/deploy.sh

echo -e "${GREEN}Deployment successful!${NC}"

# Run migrations using Supabase CLI
echo -e "${YELLOW}Running database migrations with Supabase CLI...${NC}"
./bin/supabase-db.sh migrate

echo -e "${GREEN}Migrations successful!${NC}"

# Restart the service
echo -e "${YELLOW}Restarting service...${NC}"
ssh -p 2048 ubuntu@104.36.23.197 "sudo systemctl restart profullstack-pdf.service"

echo -e "${GREEN}Service restarted successfully!${NC}"
echo -e "${GREEN}Deployment with migrations completed successfully!${NC}"

exit 0