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

3. **Add the private key to GitHub Secrets**:
   - Go to your GitHub repository
   - Click on "Settings" > "Secrets and variables" > "Actions"
   - Click "New repository secret"
   - Name: `SSH_PRIVATE_KEY`
   - Value: Copy the entire content of your private key file (`~/.ssh/id_ed25519`)
   - Click "Add secret"

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

4. **Script Issues**:
   - Review the deploy.sh script for any errors
   - Check the GitHub Actions logs for detailed error messages