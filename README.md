# PDF Document Generation Service

A service for generating various document formats from HTML and Markdown.

## Automatic Deployment with GitHub Actions

This repository is configured to automatically deploy to the production server when changes are pushed to the `master` or `main` branch.

### Setup Instructions

1. **Generate an SSH key pair**:
   ```bash
   ssh-keygen -t ed25519 -C "github-actions-deploy"
   ```
   This will create a private key (`id_ed25519`) and a public key (`id_ed25519.pub`).

2. **Add the public key to your server**:
   ```bash
   # Copy the public key
   cat ~/.ssh/id_ed25519.pub
   
   # Then on your server, add it to authorized_keys
   ssh ubuntu@profullstack "mkdir -p ~/.ssh && chmod 700 ~/.ssh"
   ssh ubuntu@profullstack "echo 'your-public-key-here' >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"
   ```

3. **Add the required secrets to GitHub**:
   - Go to your GitHub repository
   - Click on "Settings" > "Secrets and variables" > "Actions"
   - Add the following secrets:
   
   a. **SSH Private Key**:
   - Click "New repository secret"
   - Name: `SSH_PRIVATE_KEY`
   - Value: Copy the entire content of your private key file (`~/.ssh/id_ed25519`)
   - Click "Add secret"
   
   b. **Environment Variables**:
   - Click "New repository secret"
   - Name: `ENV_FILE_CONTENT`
   - Value: Copy the entire content of your .env file
   - Click "Add secret"

4. **Important Note About SSH Configuration**:
   - GitHub Actions doesn't have access to your local `~/.ssh/config` file
   - All scripts use the full hostname `profullstack.com` instead of any aliases
   - If you need to use a different hostname, update it in:
     - `.github/workflows/deploy.yml`
     - `bin/deploy.sh`
     - `bin/check-deployment.sh`
     - `bin/manual-deploy.sh`

4. **Verify GitHub Actions is enabled**:
   - Go to your repository on GitHub
   - Click on the "Actions" tab
   - Make sure Actions are enabled for the repository

5. **Test the workflow**:
   - Make a small change to your repository
   - Commit and push to master/main
   - Go to the "Actions" tab in your GitHub repository to monitor the workflow
   - The workflow will run the `bin/test-github-actions.sh` script on the server to verify deployment
   - Check for a new file named `github-actions-test-*.txt` on your server to confirm success

### Troubleshooting

If the deployment fails, check the following:

1. **SSH Key Issues**:
   - Make sure the public key is correctly added to the server's `~/.ssh/authorized_keys` file
   - Verify the private key is correctly added to GitHub Secrets

2. **Server Connection Issues**:
   - Check if the server hostname is correct in the workflow file
   - Make sure the server is accessible from GitHub Actions

3. **Permission Issues**:
   - Ensure the deploy script has execute permissions
   - Check if the user has permission to write to the deployment directory

4. **Environment Variables Issues**:
   - Make sure the `ENV_FILE_CONTENT` secret is properly set in GitHub Secrets
   - Verify that all required environment variables are included in the secret
   - Check if the .env file is being created correctly in the workflow logs

5. **Script Issues**:
   - Review the deploy.sh script for any errors
   - Check the GitHub Actions logs for detailed error messages

## Deployment Troubleshooting Scripts

This repository includes several scripts to help troubleshoot deployment issues:

### Check Deployment Status

Run the following script to check if GitHub Actions deployment is working correctly:

```bash
./bin/check-deployment.sh
```

This script will:
- Test SSH connection to the server
- Check if the remote directory exists
- Look for GitHub Actions test files
- Create a new test file to verify write access
- Check local Git configuration

### Manual Deployment

If GitHub Actions deployment isn't working, you can manually deploy using:

```bash
./bin/manual-deploy.sh
```

This script will:
- Deploy your code using rsync
- Make scripts executable on the remote host
- Run the test script to verify deployment
- Reload systemd daemon
- Optionally install/restart the service

### Test Script

The test script creates a timestamped file on the server to verify deployment:

```bash
./bin/test-github-actions.sh
```

This is automatically run by both GitHub Actions and the manual deployment script.

### Check GitHub Actions Status

To check the status of your GitHub Actions workflows:

```bash
./bin/check-github-actions.sh
```

This script will:
- Determine your GitHub repository from git remote
- Check workflow status using GitHub CLI (if installed)
- Fall back to using curl with a GITHUB_TOKEN
- Show recent workflow runs and their status

This is particularly useful for diagnosing issues with GitHub Actions not running or failing.

### Test File for Triggering Workflows

The repository includes a test file that can be modified to trigger a workflow run:

```
github-actions-test.txt
```

To trigger a new workflow run:
1. Edit the file
2. Increment the "Deployment test" number
3. Commit and push to master/main
4. Check the Actions tab on GitHub to see if the workflow runs

This provides a simple way to test if GitHub Actions is properly configured without making significant code changes.