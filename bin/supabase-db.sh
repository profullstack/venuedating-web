#!/usr/bin/env zsh
set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Function to display usage
usage() {
  echo "Usage: $0 [command]"
  echo ""
  echo "Commands:"
  echo "  setup    - Install Supabase CLI and link to your cloud project"
  echo "  migrate  - Run migrations on your Supabase database"
  echo "  new NAME - Create a new migration file"
  echo ""
  echo "Example:"
  echo "  $0 setup"
  echo "  $0 migrate"
  echo "  $0 new add_user_preferences"
  exit 1
}

# Function to install Supabase CLI
install_cli() {
  echo -e "${YELLOW}Installing Supabase CLI...${NC}"
  
  # Create local bin directory if it doesn't exist
  mkdir -p "$HOME/.local/bin"
  
  # Add to PATH if not already there
  if [[ ":$PATH:" != *":$HOME/.local/bin:"* ]]; then
    export PATH="$HOME/.local/bin:$PATH"
    echo "Added ~/.local/bin to PATH"
  fi
  
  # Download and install Supabase CLI
  SUPABASE_VERSION="1.175.6"  # change to latest if needed
  BINARY_URL="https://github.com/supabase/cli/releases/download/v$SUPABASE_VERSION/supabase_linux_amd64"
  
  echo "Downloading Supabase CLI..."
  curl -L "$BINARY_URL" -o "$HOME/.local/bin/supabase"
  chmod +x "$HOME/.local/bin/supabase"
  
  # Verify installation
  if command -v supabase &>/dev/null; then
    echo -e "${GREEN}Supabase CLI installed: $(supabase --version)${NC}"
  else
    echo -e "${RED}Supabase CLI installed to $HOME/.local/bin/supabase but not in PATH${NC}"
    echo "Please run: export PATH=\"$HOME/.local/bin:\$PATH\""
  fi
}

# Function to setup Supabase project
setup_project() {
  echo -e "${YELLOW}Setting up Supabase project...${NC}"
  
  # Check if Supabase CLI is installed
  if ! command -v supabase &> /dev/null; then
    install_cli
    export PATH="$HOME/.local/bin:$PATH"
  fi
  
  # Load environment variables from .env file
  if [ -f .env ]; then
    echo -e "${YELLOW}Loading environment variables from .env file...${NC}"
    source .env
  else
    echo -e "${RED}No .env file found. Please create one with SUPABASE_URL, SUPABASE_KEY, and SUPABASE_DB_PASSWORD.${NC}"
    exit 1
  fi
  
  # Check if required environment variables are set
  if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ] || [ -z "$SUPABASE_DB_PASSWORD" ]; then
    echo -e "${RED}Error: SUPABASE_URL, SUPABASE_KEY, and SUPABASE_DB_PASSWORD must be set in .env file.${NC}"
    exit 1
  fi
  
  # Extract project reference from URL
  PROJECT_REF=$(echo $SUPABASE_URL | sed -E 's/.*\/\/([^.]+).*/\1/')
  
  if [ -z "$PROJECT_REF" ]; then
    echo -e "${RED}Error: Could not extract project reference from SUPABASE_URL.${NC}"
    echo -e "${YELLOW}SUPABASE_URL should be in the format: https://your-project-ref.supabase.co${NC}"
    exit 1
  fi
  
  echo -e "${YELLOW}Project reference: ${PROJECT_REF}${NC}"
  
  # Initialize Supabase project if not already initialized
  if [ ! -d "supabase" ]; then
    echo -e "${YELLOW}Initializing Supabase project...${NC}"
    supabase init
  else
    echo -e "${YELLOW}Supabase project already initialized.${NC}"
  fi
  
  # Link to existing Supabase project
  echo -e "${YELLOW}Linking to Supabase cloud project...${NC}"
  supabase link --project-ref "$PROJECT_REF" --password "$SUPABASE_DB_PASSWORD"
  
  echo -e "${GREEN}Supabase project setup complete!${NC}"
}

# Function to run migrations
run_migrations() {
  echo -e "${YELLOW}Running Supabase migrations...${NC}"
  
  # Check if Supabase CLI is installed
  if ! command -v supabase &> /dev/null; then
    install_cli
    export PATH="$HOME/.local/bin:$PATH"
  fi
  
  # Check if Supabase project is initialized
  if [ ! -d "supabase" ]; then
    echo -e "${YELLOW}Supabase project not initialized. Setting up...${NC}"
    setup_project
  fi
  
  # Run migrations
  echo -e "${YELLOW}Pushing migrations to database...${NC}"
  supabase db push
  
  echo -e "${GREEN}Migrations applied successfully!${NC}"
}

# Function to create a new migration
create_migration() {
  local name=$1
  
  if [ -z "$name" ]; then
    echo -e "${RED}Error: Migration name is required.${NC}"
    usage
  fi
  
  echo -e "${YELLOW}Creating new migration: $name...${NC}"
  
  # Check if Supabase CLI is installed
  if ! command -v supabase &> /dev/null; then
    install_cli
    export PATH="$HOME/.local/bin:$PATH"
  fi
  
  # Check if Supabase project is initialized
  if [ ! -d "supabase" ]; then
    echo -e "${YELLOW}Supabase project not initialized. Setting up...${NC}"
    setup_project
  fi
  
  # Create migration
  supabase migration new $name
  
  echo -e "${GREEN}Migration created successfully!${NC}"
  echo -e "${YELLOW}Edit the migration file in supabase/migrations/ and then run:${NC}"
  echo -e "${GREEN}$0 migrate${NC}"
}

# Main script
if [ $# -eq 0 ]; then
  usage
fi

case "$1" in
  setup)
    setup_project
    ;;
  migrate)
    run_migrations
    ;;
  new)
    if [ $# -lt 2 ]; then
      echo -e "${RED}Error: Migration name is required.${NC}"
      usage
    fi
    create_migration "$2"
    ;;
  *)
    echo -e "${RED}Error: Unknown command: $1${NC}"
    usage
    ;;
esac

exit 0