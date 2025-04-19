# Document Generation API

A service that generates PDFs, Word documents, Excel spreadsheets, PowerPoint presentations, and EPUB e-books from HTML content using Hono.js, Puppeteer, XLSX, PptxGenJS, and Pandoc, with additional support for Markdown conversion, Supabase storage, and cryptocurrency payments.

## Features

- Converts HTML to PDF using Puppeteer
- Converts HTML to Word documents (.doc)
- Converts HTML tables to Excel spreadsheets (.xlsx)
- Converts HTML with headings to PowerPoint presentations (.pptx)
- Converts HTML to EPUB e-books using Pandoc
- Converts HTML to Markdown
- Converts Markdown to HTML
- Stores generated documents in Supabase (optional)
- Tracks document generation history
- Subscription-based access with cryptocurrency payments
- Email notifications for subscription events
- Customizable document formats and margins
- Simple JSON API
- Web interface for testing
- Environment variable configuration with dotenv-flow
- Progressive Web App (PWA) support with offline functionality
- Dark and light theme with system preference detection
- API key management for secure authentication
- Comprehensive API documentation

## Installation

```bash
# Clone the repository
git clone https://github.com/profullstack/pdf.git
cd pdf

# Install dependencies
pnpm install

# Install Pandoc (required for EPUB generation)
# On Ubuntu/Debian:
sudo apt-get update
sudo apt-get install -y pandoc

# On macOS:
brew install pandoc

# On Windows:
# Download and install from https://pandoc.org/installing.html
```

## Configuration

This project uses dotenv-flow for environment variable management. Create a `.env` file based on the `.env.example` template:

```bash
# Copy the example environment file
cp .env.example .env

# Edit the .env file with your preferred settings
```

Available environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | The port on which the server will run | 3000 |
| PUPPETEER_EXECUTABLE_PATH | Optional path to Chrome executable | (auto-detected) |
| DEPLOY_REMOTE_HOST | Hostname for deployment | profullstack |
| DEPLOY_REMOTE_DIR | Remote directory path for deployment | www/profullstack.com/pdf |
| INSTALL_SERVICE | Whether to install the systemd service during deployment | false |
| SERVICE_NAME | Name of the systemd service | profullstack-pdf |
| SERVICE_USER | User to run the service as | ubuntu |
| SERVICE_GROUP | Group to run the service as | ubuntu |
| SERVICE_WORKING_DIR | Working directory for the service | (project directory) |
| SUPABASE_KEY | Supabase API key for storage and database | (required for storage) |
| MAILGUN_API_KEY | Mailgun API key for sending emails | (required for notifications) |
| MAILGUN_DOMAIN | Mailgun domain for sending emails | (required for notifications) |
| FROM_EMAIL | Email address to send from | hello@profullstack.com |
| TO_EMAIL | Email address for admin notifications | admin@profullstack.com |
| REPLY_TO_EMAIL | Reply-to email address | help@profullstack.com |
| MONTHLY_SUBSCRIPTION_PRICE | Price for monthly subscription | 5 |
| YEARLY_SUBSCRIPTION_PRICE | Price for yearly subscription | 30 |
| ETHEREUM_ADDRESS | Ethereum wallet address for payments | (required for ETH payments) |
| BITCOIN_ADDRESS | Bitcoin wallet address for payments | (required for BTC payments) |
| SOLANA_ADDRESS | Solana wallet address for payments | (required for SOL payments) |

### Progressive Web App (PWA)

The Document Generation API is also available as a Progressive Web App (PWA), which provides several benefits:

1. **Offline Functionality**: Basic features are available even when offline
2. **Installable**: Can be installed on desktop and mobile devices
3. **App-like Experience**: Runs in a standalone window without browser UI
4. **Automatic Updates**: Always uses the latest version
5. **Responsive Design**: Works on any device size
6. **Dark/Light Theme**: Automatically adapts to system preferences

#### Installing the PWA

To install the PWA on your device:

##### On Desktop (Chrome, Edge, etc.):
1. Visit https://pdf.profullstack.com
2. Look for the install icon (⊕) in the address bar
3. Click "Install" when prompted

##### On iOS:
1. Visit https://pdf.profullstack.com in Safari
2. Tap the Share button
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add" to confirm

##### On Android:
1. Visit https://pdf.profullstack.com in Chrome
2. Tap the menu button (⋮)
3. Tap "Add to Home Screen"
4. Tap "Add" to confirm

#### Offline Usage

When using the PWA offline, you'll still have access to:
- The user interface
- Previously viewed documents
- Basic document editing features

API requests that require server connectivity will show an offline notification when you're not connected to the internet.

## Deployment

This project includes scripts for easy deployment to a remote server and setting up as a systemd service.

### Deploying to a Remote Server

1. Configure your deployment settings in the `.env` file:
   ```
   DEPLOY_REMOTE_HOST=your-server-hostname
   DEPLOY_REMOTE_DIR=path/to/remote/directory
   INSTALL_SERVICE=true  # Set to true if you want to install as a service
   ```

2. If you want to install as a systemd service, also configure these variables:
   ```
   SERVICE_NAME=profullstack-pdf
   SERVICE_USER=ubuntu  # User that will run the service
   SERVICE_GROUP=ubuntu  # Group for the service
   SERVICE_WORKING_DIR=/path/to/installation/directory
   ```

3. Run the deployment script:
   ```bash
   ./bin/deploy.sh
   ```

### Manual Service Installation

If you need to manually install the service on your server:

1. SSH into your server
2. Navigate to the project directory
3. Run the install-service script with sudo:
   ```bash
   sudo ./bin/install-service.sh
   ```

### Service Management

Once installed, you can manage the service using standard systemd commands:

```bash
# Start the service
sudo systemctl start profullstack-pdf

# Stop the service
sudo systemctl stop profullstack-pdf

# Restart the service
sudo systemctl restart profullstack-pdf

# Check service status
sudo systemctl status profullstack-pdf

# View service logs
sudo journalctl -u profullstack-pdf

# View application logs
tail -f /var/log/profullstack-pdf.log
tail -f /var/log/profullstack-pdf.error.log
```