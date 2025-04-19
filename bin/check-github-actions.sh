#!/bin/zsh

# This script checks the status of GitHub Actions workflows for the repository

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Checking GitHub Actions workflow status...${NC}"

# Try to get the GitHub repository from the git remote
REMOTE_URL=$(git config --get remote.origin.url)
echo -e "Git remote URL: ${GREEN}$REMOTE_URL${NC}"

# Extract owner and repo from the remote URL
if [[ $REMOTE_URL =~ github\.com[:/]([^/]+)/([^/.]+) ]]; then
  OWNER=${BASH_REMATCH[1]}
  REPO=${BASH_REMATCH[2]}
  
  echo -e "Repository owner: ${GREEN}$OWNER${NC}"
  echo -e "Repository name: ${GREEN}$REPO${NC}"
  
  # Check if GitHub CLI is installed
  if command -v gh &> /dev/null; then
    echo -e "\n${YELLOW}Using GitHub CLI to check workflow status...${NC}"
    
    # Check if authenticated
    if gh auth status &> /dev/null; then
      echo -e "${GREEN}Authenticated with GitHub CLI${NC}"
      
      # List workflows
      echo -e "\n${YELLOW}Listing workflows:${NC}"
      gh workflow list -R $OWNER/$REPO
      
      # List recent workflow runs
      echo -e "\n${YELLOW}Recent workflow runs:${NC}"
      gh run list -R $OWNER/$REPO -L 5
      
      # Get the latest workflow run
      echo -e "\n${YELLOW}Latest workflow run:${NC}"
      LATEST_RUN_ID=$(gh run list -R $OWNER/$REPO -L 1 --json databaseId --jq '.[0].databaseId')
      
      if [ -n "$LATEST_RUN_ID" ]; then
        gh run view $LATEST_RUN_ID -R $OWNER/$REPO
      else
        echo -e "${RED}No workflow runs found${NC}"
      fi
    else
      echo -e "${RED}Not authenticated with GitHub CLI. Run 'gh auth login' to authenticate.${NC}"
    fi
  else
    echo -e "${RED}GitHub CLI not installed. Using curl to check workflow status...${NC}"
    
    # Check if GITHUB_TOKEN is set
    if [ -n "$GITHUB_TOKEN" ]; then
      echo -e "${GREEN}GITHUB_TOKEN is set${NC}"
      
      # List workflows
      echo -e "\n${YELLOW}Listing workflows:${NC}"
      curl -s -H "Authorization: token $GITHUB_TOKEN" "https://api.github.com/repos/$OWNER/$REPO/actions/workflows" | grep -E '"name"|"path"'
      
      # List recent workflow runs
      echo -e "\n${YELLOW}Recent workflow runs:${NC}"
      curl -s -H "Authorization: token $GITHUB_TOKEN" "https://api.github.com/repos/$OWNER/$REPO/actions/runs?per_page=5" | grep -E '"id"|"name"|"status"|"conclusion"'
    else
      echo -e "${RED}GITHUB_TOKEN not set. Please set it to access the GitHub API.${NC}"
      echo -e "You can create a token at https://github.com/settings/tokens"
      echo -e "Then set it with: export GITHUB_TOKEN=your_token"
    fi
  fi
else
  echo -e "${RED}Could not determine repository owner and name from remote URL${NC}"
  echo -e "${YELLOW}Please check your git configuration or provide the repository information manually${NC}"
fi

echo -e "\n${YELLOW}GitHub Actions check completed.${NC}"
echo -e "${YELLOW}If you're still having issues, check:${NC}"
echo -e "  1. GitHub repository Actions tab for workflow runs"
echo -e "  2. Make sure GitHub Actions is enabled for the repository"
echo -e "  3. Check if the workflow file is in the correct location (.github/workflows/deploy.yml)"
echo -e "  4. Verify that you have the necessary permissions to run workflows"