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

# Create log files
echo -e "${YELLOW}Creating log files...${NC}"
touch /var/log/$SERVICE_NAME.log /var/log/$SERVICE_NAME.error.log
chown www-data:www-data /var/log/$SERVICE_NAME.log /var/log/$SERVICE_NAME.error.log
chmod 644 /var/log/$SERVICE_NAME.log /var/log/$SERVICE_NAME.error.log

# Create symbolic link to the service file
echo -e "${YELLOW}Creating symbolic link to service file...${NC}"
if [ -f "$SYSTEMD_DIR/$SERVICE_NAME.service" ]; then
  echo -e "${YELLOW}Service file already exists. Removing...${NC}"
  rm "$SYSTEMD_DIR/$SERVICE_NAME.service"
fi
ln -s "$SERVICE_FILE" "$SYSTEMD_DIR/$SERVICE_NAME.service"

# Make the start script executable
echo -e "${YELLOW}Making start script executable...${NC}"
chmod +x "$PROJECT_DIR/bin/start.sh"

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