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
  
  # Check if supabase is already installed
  if command -v supabase &>/dev/null; then
    echo -e "${GREEN}Supabase CLI already installed: $(supabase --version 2>&1)${NC}"
    return 0
  fi
  
  SUPABASE_VERSION="2.20.12"  # Known working version
  
  # Compile from source using ZIP file
  echo "Compiling Supabase CLI from source..."
  
  # Check if Go is installed
  if ! command -v go &>/dev/null; then
    echo "Go is required to compile Supabase CLI. Installing Go..."
    
    # Install Go (this is a simplified version, might need adjustments)
    if command -v apt-get &>/dev/null; then
      sudo apt-get update
      sudo apt-get install -y golang
    elif command -v pacman &>/dev/null; then
      sudo pacman -Sy --noconfirm go
    else
      echo -e "${RED}Cannot install Go. Please install Go manually and try again.${NC}"
      exit 1
    fi
  fi
  
  # Download source code
  SOURCE_URL="https://github.com/supabase/cli/archive/refs/tags/v$SUPABASE_VERSION.zip"
  TEMP_DIR=$(mktemp -d)
  
  echo "Downloading source code from $SOURCE_URL..."
  curl -L "$SOURCE_URL" -o "$TEMP_DIR/supabase-src.zip"
  
  # Check if download was successful
  if [ ! -s "$TEMP_DIR/supabase-src.zip" ]; then
    echo -e "${RED}Error: Failed to download Supabase CLI source code${NC}"
    rm -rf "$TEMP_DIR"
    exit 1
  fi
  
  echo "Extracting source code..."
  unzip -q "$TEMP_DIR/supabase-src.zip" -d "$TEMP_DIR"
  
  # Find the extracted directory
  SRC_DIR=$(find "$TEMP_DIR" -type d -name "cli-*" | head -n 1)
  
  if [ -z "$SRC_DIR" ]; then
    echo -e "${RED}Error: Could not find source directory after extraction${NC}"
    rm -rf "$TEMP_DIR"
    exit 1
  fi
  
  echo "Building Supabase CLI..."
  cd "$SRC_DIR"
  
  # Build the CLI with version information
  go build -ldflags "-X github.com/supabase/cli/internal/utils.Version=v$SUPABASE_VERSION" -o supabase
  
  if [ ! -f "supabase" ]; then
    echo -e "${RED}Error: Failed to build Supabase CLI${NC}"
    rm -rf "$TEMP_DIR"
    exit 1
  fi
  
  echo "Installing Supabase CLI to $HOME/.local/bin..."
  cp "supabase" "$HOME/.local/bin/supabase"
  chmod +x "$HOME/.local/bin/supabase"
  
  # Clean up
  cd - > /dev/null
  rm -rf "$TEMP_DIR"
  
  # Verify installation
  echo "Verifying installation..."
  
  if command -v supabase &>/dev/null; then
    echo -e "${GREEN}Supabase CLI installed from source: $(supabase --version 2>&1)${NC}"
  else
    echo -e "${RED}Supabase CLI installation failed${NC}"
    echo "PATH is: $PATH"
    
    # Check if binary exists in local bin
    if [ -f "$HOME/.local/bin/supabase" ]; then
      echo "Binary exists at $HOME/.local/bin/supabase"
      echo "File details: $(ls -la $HOME/.local/bin/supabase)"
      echo "File type: $(file $HOME/.local/bin/supabase)"
      
      # Try to add to PATH again
      export PATH="$HOME/.local/bin:$PATH"
      echo "Added $HOME/.local/bin to PATH again"
      
      if command -v supabase &>/dev/null; then
        echo -e "${GREEN}Supabase CLI now available: $(supabase --version 2>&1)${NC}"
      else
        echo -e "${RED}Still cannot find supabase in PATH${NC}"
      fi
    else
      echo "Binary not found at $HOME/.local/bin/supabase"
    fi
    
    # If still not found, exit with error
    if ! command -v supabase &>/dev/null; then
      echo -e "${RED}Failed to install Supabase CLI${NC}"
      exit 1
    fi
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
  
  # Load environment variables from .env file if they're not already set
  if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ] || [ -z "$SUPABASE_DB_PASSWORD" ] || [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
    # Check for custom env file path
    ENV_FILE="${SUPABASE_ENV_FILE:-.env}"
    
    if [ -f "$ENV_FILE" ]; then
      echo -e "${YELLOW}Loading environment variables from $ENV_FILE file...${NC}"
      source "$ENV_FILE"
    else
      echo -e "${YELLOW}No $ENV_FILE file found. Checking for environment variables...${NC}"
    fi
  fi
  
  # Check if required environment variables are set
  if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ] || [ -z "$SUPABASE_DB_PASSWORD" ] || [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
    echo -e "${RED}Error: SUPABASE_URL, SUPABASE_KEY, SUPABASE_DB_PASSWORD, and SUPABASE_ACCESS_TOKEN must be set either in .env file or as environment variables.${NC}"
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
  
  # Test database connection
  echo -e "${YELLOW}Testing database connection...${NC}"
  
  # Create a temporary .pgpass file for the test
  PGPASS_FILE="$HOME/.pgpass"
  HOST_PATTERN="db.${PROJECT_REF}.supabase.co"
  
  # Create .pgpass file with both possible usernames
  echo "${HOST_PATTERN}:5432:postgres:postgres:${SUPABASE_DB_PASSWORD}" > "$PGPASS_FILE"
  echo "${HOST_PATTERN}:5432:postgres:postgres.${PROJECT_REF}:${SUPABASE_DB_PASSWORD}" >> "$PGPASS_FILE"
  chmod 600 "$PGPASS_FILE"
  
  # Check if psql is installed
  if command -v psql &> /dev/null; then
    # Try connection with postgres.{project_ref} user
    if psql -h "db.${PROJECT_REF}.supabase.co" -p 5432 -d postgres -U "postgres.${PROJECT_REF}" -c "SELECT 1" > /dev/null 2>&1; then
      echo -e "${GREEN}Database connection successful with postgres.${PROJECT_REF} user!${NC}"
    # Try connection with postgres user
    elif psql -h "db.${PROJECT_REF}.supabase.co" -p 5432 -d postgres -U postgres -c "SELECT 1" > /dev/null 2>&1; then
      echo -e "${GREEN}Database connection successful with postgres user!${NC}"
    else
      echo -e "${YELLOW}Could not connect to database directly with psql. Continuing with Supabase CLI...${NC}"
    fi
  else
    echo -e "${YELLOW}psql not installed, skipping direct connection test...${NC}"
  fi
  
  # Initialize Supabase project if not already initialized
  if [ ! -d "supabase" ]; then
    echo -e "${YELLOW}Initializing Supabase project...${NC}"
    supabase init
  else
    echo -e "${YELLOW}Supabase project already initialized.${NC}"
  fi
  
  # Link to existing Supabase project
  echo -e "${YELLOW}Linking to Supabase cloud project...${NC}"
  echo "Using database password: ${SUPABASE_DB_PASSWORD:0:3}*****"
  
  # Create a temporary .pgpass file to avoid password prompt
  echo "Creating temporary .pgpass file..."
  PGPASS_FILE="$HOME/.pgpass"
  
  # Extract project reference from URL for the hostname pattern
  HOST_PATTERN="db.${PROJECT_REF}.supabase.co"
  
  # Create or append to .pgpass file
  echo "${HOST_PATTERN}:5432:postgres:postgres:${SUPABASE_DB_PASSWORD}" > "$PGPASS_FILE"
  echo "${HOST_PATTERN}:5432:postgres:postgres.${PROJECT_REF}:${SUPABASE_DB_PASSWORD}" >> "$PGPASS_FILE"
  
  # Set proper permissions
  chmod 600 "$PGPASS_FILE"
  
  # Run the command with retry logic
  echo "Running supabase link with retry logic..."
  MAX_RETRIES=3
  RETRY_COUNT=0
  SUCCESS=false
  
  while [ $RETRY_COUNT -lt $MAX_RETRIES ] && [ "$SUCCESS" = "false" ]; do
    echo "Attempt $(($RETRY_COUNT + 1)) of $MAX_RETRIES..."
    
    # Add a delay between retries
    if [ $RETRY_COUNT -gt 0 ]; then
      SLEEP_TIME=$(($RETRY_COUNT * 5))
      echo "Waiting $SLEEP_TIME seconds before retry..."
      sleep $SLEEP_TIME
    fi
    
    # Run the command with timeout to prevent hanging
    timeout 60 supabase link --project-ref "$PROJECT_REF" --password "$SUPABASE_DB_PASSWORD" --debug
    
    if [ $? -eq 0 ]; then
      SUCCESS=true
      echo -e "${GREEN}Link successful!${NC}"
    else
      RETRY_COUNT=$(($RETRY_COUNT + 1))
      echo -e "${YELLOW}Link failed. Retrying...${NC}"
    fi
  done
  
  if [ "$SUCCESS" = "false" ]; then
    echo -e "${RED}Link failed after $MAX_RETRIES attempts.${NC}"
    echo -e "${RED}Please check your Supabase configuration and try again.${NC}"
    exit 1
  fi
  
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
  echo -e "${YELLOW}Applying migrations to database...${NC}"
  echo "Using database password: ${SUPABASE_DB_PASSWORD:0:3}*****"
  
  # Create a temporary .pgpass file to avoid password prompt
  echo "Creating temporary .pgpass file..."
  PGPASS_FILE="$HOME/.pgpass"
  
  # Extract project reference from URL for the hostname pattern
  HOST_PATTERN="db.${PROJECT_REF}.supabase.co"
  
  # Create or append to .pgpass file
  echo "${HOST_PATTERN}:5432:postgres:postgres:${SUPABASE_DB_PASSWORD}" > "$PGPASS_FILE"
  echo "${HOST_PATTERN}:5432:postgres:postgres.${PROJECT_REF}:${SUPABASE_DB_PASSWORD}" >> "$PGPASS_FILE"
  
  # Set proper permissions
  chmod 600 "$PGPASS_FILE"
  
  # Run the command with retry logic
  echo "Running supabase migration up with retry logic..."
  MAX_RETRIES=3
  RETRY_COUNT=0
  SUCCESS=false
  
  while [ $RETRY_COUNT -lt $MAX_RETRIES ] && [ "$SUCCESS" = "false" ]; do
    echo "Attempt $(($RETRY_COUNT + 1)) of $MAX_RETRIES..."
    
    # Add a delay between retries
    if [ $RETRY_COUNT -gt 0 ]; then
      SLEEP_TIME=$(($RETRY_COUNT * 5))
      echo "Waiting $SLEEP_TIME seconds before retry..."
      sleep $SLEEP_TIME
    fi
    
    # Run the command with timeout to prevent hanging
    timeout 60 supabase migration up --password "$SUPABASE_DB_PASSWORD" --debug
    
    if [ $? -eq 0 ]; then
      SUCCESS=true
      echo -e "${GREEN}Migration successful!${NC}"
    else
      RETRY_COUNT=$(($RETRY_COUNT + 1))
      echo -e "${YELLOW}Migration failed. Retrying...${NC}"
    fi
  done
  
  if [ "$SUCCESS" = "false" ]; then
    echo -e "${RED}Migration failed after $MAX_RETRIES attempts.${NC}"
    echo -e "${RED}Please check your Supabase configuration and try again.${NC}"
    exit 1
  fi
  
  # Remove the temporary .pgpass file
  rm -f "$PGPASS_FILE"
  
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