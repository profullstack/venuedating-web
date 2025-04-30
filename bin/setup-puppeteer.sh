#!/bin/bash

# Script to set up Puppeteer Chrome path in production environment
# This script should be run during deployment to ensure the correct Chrome path is used

# Determine the environment
USERNAME=$(whoami)
CHROME_VERSION="linux-135.0.7049.114"
CHROME_PATH="/home/$USERNAME/.cache/puppeteer/chrome/$CHROME_VERSION/chrome-linux64/chrome"

echo "Setting up Puppeteer Chrome path..."
echo "Current user: $USERNAME"
echo "Expected Chrome path: $CHROME_PATH"

# Check if Chrome exists at the expected path
if [ -f "$CHROME_PATH" ]; then
    echo "Chrome executable found at: $CHROME_PATH"
else
    echo "Chrome executable not found at: $CHROME_PATH"
    echo "Checking if Puppeteer is installed..."
    
    # Check if Puppeteer is installed
    if [ -d "/home/$USERNAME/.cache/puppeteer" ]; then
        echo "Puppeteer directory exists, but Chrome version may be different."
        echo "Available Chrome versions:"
        ls -la /home/$USERNAME/.cache/puppeteer/chrome/
    else
        echo "Puppeteer directory not found. You may need to install Puppeteer first."
        echo "Run: npm install puppeteer"
    fi
fi

# Create or update .env file with PUPPETEER_EXECUTABLE_PATH if Chrome exists
if [ -f "$CHROME_PATH" ]; then
    # Check if .env file exists
    if [ -f ".env" ]; then
        # Check if PUPPETEER_EXECUTABLE_PATH is already in .env
        if grep -q "PUPPETEER_EXECUTABLE_PATH" .env; then
            # Update existing PUPPETEER_EXECUTABLE_PATH
            sed -i "s|PUPPETEER_EXECUTABLE_PATH=.*|PUPPETEER_EXECUTABLE_PATH=$CHROME_PATH|g" .env
            echo "Updated PUPPETEER_EXECUTABLE_PATH in .env file"
        else
            # Add PUPPETEER_EXECUTABLE_PATH to .env
            echo "" >> .env
            echo "# Puppeteer configuration" >> .env
            echo "PUPPETEER_EXECUTABLE_PATH=$CHROME_PATH" >> .env
            echo "Added PUPPETEER_EXECUTABLE_PATH to .env file"
        fi
    else
        echo "Warning: .env file not found. Chrome path will be auto-detected at runtime."
    fi
fi

echo "Puppeteer setup completed."