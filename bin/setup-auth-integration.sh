#!/bin/bash

# Script to set up auth integration between auth.users and public.users

echo "This script will set up proper integration between auth.users and public.users tables."
echo "It will create a trigger to automatically create a public user when an auth user is created."
echo ""
echo "Press Ctrl+C to cancel or Enter to continue..."
read

# Get the directory of the script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# Change to the project root directory
cd "$SCRIPT_DIR/.."

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "Error: Supabase CLI is not installed. Please install it first."
    echo "See: https://supabase.com/docs/guides/cli"
    exit 1
fi

# Apply the migration using the existing supabase-db.sh script
./bin/supabase-db.sh

echo "Migration applied successfully!"
echo "Auth integration has been set up."
echo ""
echo "Next steps:"
echo "1. Register a new user through the application"
echo "2. The user will be created in both auth.users and public.users tables"
echo "3. JWT authentication should now work correctly"

exit 0