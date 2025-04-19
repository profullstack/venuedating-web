#!/bin/bash

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
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Service name
SERVICE_NAME="profullstack-pdf"
SERVICE_FILE="$PROJECT_DIR/etc/$SERVICE_NAME.service"
SYSTEMD_DIR="/etc/systemd/system"

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

# Install Node.js if not already installed
if ! command -v node &> /dev/null; then
  echo -e "${YELLOW}Node.js not found. Installing Node.js...${NC}"
  curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
  apt-get install -y nodejs
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}Node.js installed successfully.${NC}"
  else
    echo -e "${RED}Failed to install Node.js. Please install it manually.${NC}"
    exit 1
  fi
else
  echo -e "${GREEN}Node.js is already installed: $(node -v)${NC}"
fi

# Install pnpm if not already installed
if ! command -v pnpm &> /dev/null; then
  echo -e "${YELLOW}pnpm not found. Installing pnpm...${NC}"
  npm install -g pnpm
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}pnpm installed successfully: $(pnpm -v)${NC}"
  else
    echo -e "${RED}Failed to install pnpm. Please install it manually.${NC}"
    exit 1
  fi
else
  echo -e "${GREEN}pnpm is already installed: $(pnpm -v)${NC}"
fi

# Create log files
echo -e "${YELLOW}Creating log files...${NC}"
touch /var/log/$SERVICE_NAME.log /var/log/$SERVICE_NAME.error.log
chmod 644 /var/log/$SERVICE_NAME.log /var/log/$SERVICE_NAME.error.log

# Create symbolic link to the service file
echo -e "${YELLOW}Creating symbolic link to service file...${NC}"
if [ -f "$SYSTEMD_DIR/$SERVICE_NAME.service" ]; then
  echo -e "${YELLOW}Service file already exists. Removing...${NC}"
  rm "$SYSTEMD_DIR/$SERVICE_NAME.service"
fi
ln -s "$SERVICE_FILE" "$SYSTEMD_DIR/$SERVICE_NAME.service"

# Make the start script executable and set permissions
echo -e "${YELLOW}Setting permissions...${NC}"
chmod +x "$PROJECT_DIR/bin/start.sh"

# Ensure www-data has access to the project directory
echo -e "${YELLOW}Setting directory permissions for www-data...${NC}"
chown -R www-data:www-data "$PROJECT_DIR"
chmod -R 755 "$PROJECT_DIR"

# Ensure node_modules is writable
if [ -d "$PROJECT_DIR/node_modules" ]; then
  echo -e "${YELLOW}Setting node_modules permissions...${NC}"
  chmod -R 755 "$PROJECT_DIR/node_modules"
fi

# Install project dependencies
echo -e "${YELLOW}Installing project dependencies...${NC}"
cd "$PROJECT_DIR" && pnpm install

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