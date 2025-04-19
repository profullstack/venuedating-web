#!/bin/zsh

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Please run as root (use sudo)${NC}"
  exit 1
fi

# Get the directory of the script
SCRIPT_DIR="$(cd "$(dirname "${0:A}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Load environment variables from .env file if it exists
if [ -f "$PROJECT_DIR/.env" ]; then
  echo -e "${YELLOW}Loading environment variables from .env file...${NC}"
  source "$PROJECT_DIR/.env"
fi

# Set default values if not in environment
SERVICE_NAME=${SERVICE_NAME:-"profullstack-pdf"}
SERVICE_USER=${SERVICE_USER:-"ubuntu"}
SERVICE_GROUP=${SERVICE_GROUP:-"ubuntu"}
SERVICE_WORKING_DIR=${SERVICE_WORKING_DIR:-"$PROJECT_DIR"}
START_SCRIPT=${START_SCRIPT:-"$PROJECT_DIR/bin/start.sh"}
SYSTEMD_DIR="/etc/systemd/system"
SERVICE_FILE="/etc/systemd/system/$SERVICE_NAME.service"

# Print environment for debugging
echo -e "${YELLOW}Environment:${NC}"
echo -e "${YELLOW}PROJECT_DIR: $PROJECT_DIR${NC}"
echo -e "${YELLOW}SERVICE_NAME: $SERVICE_NAME${NC}"
echo -e "${YELLOW}SERVICE_USER: $SERVICE_USER${NC}"
echo -e "${YELLOW}SERVICE_GROUP: $SERVICE_GROUP${NC}"
echo -e "${YELLOW}SERVICE_WORKING_DIR: $SERVICE_WORKING_DIR${NC}"
echo -e "${YELLOW}START_SCRIPT: $START_SCRIPT${NC}"
echo -e "${YELLOW}SERVICE_FILE: $SERVICE_FILE${NC}"

# Create service file directly in the systemd directory
echo -e "${YELLOW}Creating service file directly in systemd directory...${NC}"

# Print actual values for debugging
echo -e "${YELLOW}Using actual values:${NC}"
echo -e "${YELLOW}SERVICE_USER: $SERVICE_USER${NC}"
echo -e "${YELLOW}SERVICE_GROUP: $SERVICE_GROUP${NC}"
echo -e "${YELLOW}SERVICE_WORKING_DIR: $SERVICE_WORKING_DIR${NC}"
echo -e "${YELLOW}START_SCRIPT: $START_SCRIPT${NC}"
echo -e "${YELLOW}SERVICE_NAME: $SERVICE_NAME${NC}"

# Write directly to systemd directory with explicit values
cat > "$SERVICE_FILE" << EOF
[Unit]
Description=Document Generation Service
After=network.target

[Service]
Type=simple
User=${EXPANDED_SERVICE_USER}
Group=${EXPANDED_SERVICE_GROUP}
WorkingDirectory=${EXPANDED_SERVICE_WORKING_DIR}
ExecStart=/bin/zsh ${EXPANDED_START_SCRIPT}
Restart=on-failure
RestartSec=10

# Log to files instead of journal
StandardOutput=append:/var/log/${EXPANDED_SERVICE_NAME}.log
StandardError=append:/var/log/${EXPANDED_SERVICE_NAME}.error.log

# Environment
Environment=NODE_ENV=production
Environment=PATH=/usr/local/bin:/usr/bin:/bin:/usr/local/sbin:/usr/sbin:/sbin:/home/${EXPANDED_SERVICE_USER}/.local/share/pnpm:/home/${EXPANDED_SERVICE_USER}/.npm/pnpm/bin
Environment=HOME=/home/${EXPANDED_SERVICE_USER}

# Hardening
ProtectSystem=full
PrivateTmp=true
NoNewPrivileges=true

[Install]
WantedBy=multi-user.target
EOF

echo -e "${GREEN}Service file created successfully at $SERVICE_FILE${NC}"
echo -e "${YELLOW}Service file content:${NC}"
cat "$SERVICE_FILE"

# Ensure proper permissions on the service file
echo -e "${YELLOW}Setting proper permissions on service file...${NC}"
chmod 644 "$SERVICE_FILE"

echo -e "${GREEN}Installing $SERVICE_NAME service...${NC}"

# Install dependencies
echo -e "${YELLOW}Checking and installing dependencies...${NC}"

# Install pandoc if not already installed
if ! command -v pandoc &> /dev/null; then
  echo -e "${YELLOW}Pandoc not found. Installing pandoc...${NC}"
  apt-get update
  apt-get install -y pandoc
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}Pandoc installed successfully.${NC}"
  else
    echo -e "${RED}Failed to install pandoc. Please install it manually.${NC}"
    exit 1
  fi
else
  echo -e "${GREEN}Pandoc is already installed.${NC}"
fi

# Ensure log directories exist
echo -e "${YELLOW}Setting up logging...${NC}"
mkdir -p /var/log
touch /var/log/$SERVICE_NAME.log /var/log/$SERVICE_NAME.error.log
chmod 644 /var/log/$SERVICE_NAME.log /var/log/$SERVICE_NAME.error.log

# Verify the content of the service file
echo -e "${YELLOW}Verifying service file content:${NC}"
cat "$SERVICE_FILE"

# Make the start script executable and set permissions
echo -e "${YELLOW}Setting permissions...${NC}"

# Define the start script path
START_SCRIPT="${START_SCRIPT:-$PROJECT_DIR/bin/start.sh}"
echo -e "${YELLOW}Start script path: $START_SCRIPT${NC}"

if [ -f "$START_SCRIPT" ]; then
  chmod +x "$START_SCRIPT"
  echo -e "${GREEN}Successfully set permissions on start script${NC}"
else
  echo -e "${RED}Start script not found at $START_SCRIPT${NC}"
  echo -e "${YELLOW}Checking if it exists in the project directory...${NC}"
  find "$PROJECT_DIR" -name "start.sh" -type f 2>/dev/null
  exit 1
fi

# Install project dependencies
echo -e "${YELLOW}Installing project dependencies...${NC}"

# Get the original user who ran sudo
ORIGINAL_USER=${SUDO_USER:-$USER}
echo -e "${YELLOW}Original user: $ORIGINAL_USER${NC}"

# Run pnpm install with zsh and loading .zshrc
if [ "$EUID" -eq 0 ]; then
  echo -e "${YELLOW}Running pnpm install as $ORIGINAL_USER with zsh...${NC}"
  sudo -u "$ORIGINAL_USER" zsh -c "source /home/$ORIGINAL_USER/.zshrc && cd \"$PROJECT_DIR\" && pnpm install"
else
  echo -e "${YELLOW}Running pnpm install as current user...${NC}"
  zsh -c "source $HOME/.zshrc && cd \"$PROJECT_DIR\" && pnpm install"
fi

# Reload systemd
echo -e "${YELLOW}Reloading systemd...${NC}"
systemctl daemon-reload

# Enable and start the service
echo -e "${YELLOW}Enabling and starting the service...${NC}"
systemctl enable $SERVICE_NAME
systemctl start $SERVICE_NAME

# Check the status
echo -e "${YELLOW}Service status:${NC}"
systemctl status $SERVICE_NAME

echo -e "${GREEN}Installation complete!${NC}"
echo -e "${YELLOW}You can view the logs with:${NC}"
echo -e "  tail -f /var/log/$SERVICE_NAME.log"
echo -e "  tail -f /var/log/$SERVICE_NAME.error.log"
