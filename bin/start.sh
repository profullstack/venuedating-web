#!/bin/bash

# Define possible paths for pnpm
PNPM_PATHS=(
  "/usr/local/bin/pnpm"
  "/usr/bin/pnpm"
  "$HOME/.local/share/pnpm/pnpm"
  "$HOME/.npm/pnpm/bin/pnpm"
  "$NVM_DIR/versions/node/$(node -v)/bin/pnpm"
  "$HOME/.nvm/versions/node/$(node -v)/bin/pnpm"
)

# Find pnpm executable
PNPM_EXEC=""
for path in "${PNPM_PATHS[@]}"; do
  if [ -x "$path" ]; then
    PNPM_EXEC="$path"
    break
  fi
done

# If pnpm not found in standard locations, try to find it in PATH
if [ -z "$PNPM_EXEC" ]; then
  # Try to load NVM if available
  if [ -f "$HOME/.nvm/nvm.sh" ]; then
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
  fi
  
  # Try to find pnpm in PATH
  PNPM_EXEC=$(command -v pnpm)
fi

# Load environment variables from .env file if it exists
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Set NODE_ENV to production if not already set
export NODE_ENV=${NODE_ENV:-production}

# Log the path being used
echo "Using pnpm from: ${PNPM_EXEC:-pnpm (from PATH)}"

# Start the server
if [ -n "$PNPM_EXEC" ]; then
  "$PNPM_EXEC" start
else
  echo "pnpm not found. Trying to use node directly..."
  node src/index.js
fi