#!/bin/bash

# Set colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Please run as root (use sudo)${NC}"
  exit 1
fi

# Set the working directory to the script's directory parent
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_DIR="$( dirname "$SCRIPT_DIR" )"
cd "$PROJECT_DIR"

echo -e "${YELLOW}Installing PDF Generation Service...${NC}"

# Copy the service file to systemd directory
echo -e "Copying service file to /etc/systemd/system/..."
cp etc/profullstack-pdf.service /etc/systemd/system/

# Make the start script executable
echo -e "Making start script executable..."
chmod +x bin/start.sh

# Reload systemd
echo -e "Reloading systemd..."
systemctl daemon-reload

# Enable the service
echo -e "Enabling service to start on boot..."
systemctl enable profullstack-pdf

# Start the service
echo -e "Starting service..."
systemctl start profullstack-pdf

# Check status
echo -e "${YELLOW}Service status:${NC}"
systemctl status profullstack-pdf

echo -e "\n${GREEN}Installation complete!${NC}"
echo -e "You can view the logs at: ${YELLOW}/var/log/profullstack-pdf.log${NC} and ${YELLOW}/var/log/profullstack-pdf.error.log${NC}"