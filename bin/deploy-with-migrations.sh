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

# Debug: Print environment variables (masked for security)
echo -e "${YELLOW}Checking environment variables...${NC}"
echo "SUPABASE_URL is ${SUPABASE_URL:+set}${SUPABASE_URL:-not set}"
echo "SUPABASE_KEY is ${SUPABASE_KEY:+set}${SUPABASE_KEY:-not set}"
echo "SUPABASE_DB_PASSWORD is ${SUPABASE_DB_PASSWORD:+set}${SUPABASE_DB_PASSWORD:-not set}"
echo "SUPABASE_ACCESS_TOKEN is ${SUPABASE_ACCESS_TOKEN:+set}${SUPABASE_ACCESS_TOKEN:-not set}"

# Run migrations using Supabase CLI
echo -e "${YELLOW}Running database migrations with Supabase CLI...${NC}"

# Check if required environment variables are set
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ] || [ -z "$SUPABASE_DB_PASSWORD" ] || [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
  echo -e "${RED}Error: Required Supabase environment variables are not set.${NC}"
  echo -e "${YELLOW}Make sure SUPABASE_URL, SUPABASE_KEY, SUPABASE_DB_PASSWORD, and SUPABASE_ACCESS_TOKEN are set.${NC}"
  exit 1
fi

# Run migrations directly
echo -e "${YELLOW}Running migrations...${NC}"
./bin/supabase-db.sh migrate

echo -e "${GREEN}Migrations successful!${NC}"

# Restart the service
echo -e "${YELLOW}Restarting service...${NC}"
ssh -p 2048 ubuntu@104.36.23.197 "sudo systemctl restart profullstack-pdf.service"

echo -e "${GREEN}Service restarted successfully!${NC}"
echo -e "${GREEN}Deployment with migrations completed successfully!${NC}"

exit 0