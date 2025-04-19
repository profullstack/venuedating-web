#!/bin/zsh

# This script is used to test if GitHub Actions deployment is working correctly

echo "GitHub Actions deployment test script"
echo "Running at: $(date)"
echo "Hostname: $(hostname)"
echo "Current directory: $(pwd)"
echo "User: $(whoami)"

# Create a test file to verify deployment
TEST_FILE="github-actions-test-$(date +%Y%m%d%H%M%S).txt"
echo "Creating test file: $TEST_FILE"
echo "GitHub Actions deployment test at $(date)" > $TEST_FILE
echo "If you can see this file, the deployment was successful!" >> $TEST_FILE

echo "Test completed successfully!"