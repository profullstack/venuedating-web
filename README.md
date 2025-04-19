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

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/document-generation-api.git
cd document-generation-api

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
| DEPLOY_REMOTE_HOST | Hostname for deployment | profulltack |
| DEPLOY_REMOTE_DIR | Remote directory path for deployment | www/profullstack/pdf |
| INSTALL_SERVICE | Whether to install the systemd service during deployment | false |
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

### Supabase Setup

To use the document storage, subscription, and payment features, you need to set up a Supabase project:

1. Create a new project at [Supabase](https://supabase.com)
2. Create a storage bucket named `documents` with public access
3. Run the SQL script in `db/schema.sql` to create the necessary tables and policies

### Mailgun Setup

To enable email notifications for subscriptions and payments:

1. Create an account at [Mailgun](https://mailgun.com)
2. Add and verify your domain
3. Get your API key and add it to the `.env` file

### CryptAPI Setup

To enable cryptocurrency payments:

1. No account is needed for CryptAPI
2. Add your cryptocurrency wallet addresses to the `.env` file

## Project Structure

The project follows a modular architecture for better maintainability:

```
/
├── src/                    # Server-side code
│   ├── routes/             # API route handlers
│   ├── services/           # Business logic services
│   ├── middleware/         # Express middleware
│   ├── utils/              # Utility functions
│   └── index.js            # Main server entry point
├── public/                 # Client-side code
│   ├── js/                 # JavaScript files
│   │   ├── components/     # Web components
│   │   ├── api-client.js   # API client
│   │   └── main.js         # Main client entry point
│   ├── css/                # CSS files
│   │   └── theme.css       # Theme system with light/dark mode
│   ├── index.html          # Main HTML file
│   └── subscription.html   # Subscription page
├── bin/                    # Scripts
│   ├── deploy.sh           # Deployment script
│   ├── start.sh            # Start script
│   ├── install-service.sh  # Service installation script
│   └── subscription-tasks.js # Subscription maintenance tasks
├── db/                     # Database scripts
│   └── schema.sql          # Supabase schema setup
├── etc/                    # Configuration files
│   └── profullstack-pdf.service  # Systemd service file
└── test.js                 # Test script
```

### Server-Side Architecture

The server-side code is organized into modules:

- **Routes**: Handle HTTP requests and responses
- **Services**: Implement business logic for document generation, payments, and emails
- **Middleware**: Handle cross-cutting concerns like error handling and subscription checks
- **Utils**: Provide utility functions for Supabase and other services

### Client-Side Architecture

The client-side code uses Web Components for a modular UI:

- **Base Components**: Provide common functionality
- **Specialized Editors**: HTML, Markdown, Table, and Slides editors
- **Document History**: Displays document generation history
- **Subscription Form**: Handles subscription creation and payment
- **API Client**: Communicates with the server API
- **Theme System**: Provides light and dark mode support

## Usage

### Starting the server

```bash
# Start the server
pnpm start

# Start the server in development mode (with auto-restart)
pnpm dev
```

The server will start on the port specified in your `.env` file (default: 3000).

### API Endpoints

#### Health Check

```
GET /
```

Returns a simple JSON response to confirm the service is running.

#### HTML to PDF

```
POST /api/1/html-to-pdf
```

Generates a PDF from the provided HTML content.

**Request Body:**

```json
{
  "html": "<html>Your HTML content here</html>",
  "options": {
    "format": "A4",
    "printBackground": true,
    "margin": {
      "top": "1cm",
      "right": "1cm",
      "bottom": "1cm",
      "left": "1cm"
    }
  },
  "filename": "document.pdf",
  "store": false
}
```

The `options`, `filename`, and `store` fields are optional. If `store` is set to `true`, the document will be stored in Supabase.

**Response:**

The raw PDF file with the following headers:
- `Content-Type: application/pdf`
- `Content-Disposition: attachment; filename="document.pdf"`
- `X-Storage-Path: documents/...` (if stored in Supabase)

#### HTML to Word Document

```
POST /api/1/html-to-doc
```

Generates a Microsoft Word document (.doc) from the provided HTML content.

**Request Body:**

```json
{
  "html": "<html>Your HTML content here</html>",
  "filename": "document.doc",
  "store": false
}
```

The `filename` and `store` fields are optional. If `store` is set to `true`, the document will be stored in Supabase.

**Response:**

The raw Word document file with the following headers:
- `Content-Type: application/msword`
- `Content-Disposition: attachment; filename="document.doc"` (or your custom filename)
- `X-Storage-Path: documents/...` (if stored in Supabase)

#### HTML to Excel Spreadsheet

```
POST /api/1/html-to-excel
```

Generates a Microsoft Excel spreadsheet (.xlsx) from HTML tables in the provided HTML content. Each table in the HTML becomes a separate worksheet in the Excel file.

**Request Body:**

```json
{
  "html": "<html><body><table>...</table></body></html>",
  "filename": "document.xlsx",
  "sheetName": "Sheet1",
  "store": false
}
```

The `filename`, `sheetName`, and `store` fields are optional. If `store` is set to `true`, the document will be stored in Supabase.

**Response:**

The raw Excel file with the following headers:
- `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- `Content-Disposition: attachment; filename="document.xlsx"` (or your custom filename)
- `X-Storage-Path: documents/...` (if stored in Supabase)

#### HTML to PowerPoint Presentation

```
POST /api/1/html-to-ppt
```

Generates a Microsoft PowerPoint presentation (.pptx) from HTML content. The API creates slides based on headings (h1, h2, etc.) in the HTML.

**Request Body:**

```json
{
  "html": "<html><body><h1>Slide 1</h1><p>Content</p><h1>Slide 2</h1><p>More content</p></body></html>",
  "filename": "presentation.pptx",
  "title": "Presentation Title",
  "store": false
}
```

The `filename`, `title`, and `store` fields are optional. If `store` is set to `true`, the document will be stored in Supabase.

**Response:**

The raw PowerPoint file with the following headers:
- `Content-Type: application/vnd.openxmlformats-officedocument.presentationml.presentation`
- `Content-Disposition: attachment; filename="presentation.pptx"` (or your custom filename)
- `X-Storage-Path: documents/...` (if stored in Supabase)

#### HTML to EPUB

```
POST /api/1/html-to-epub
```

Generates an EPUB e-book from HTML content using Pandoc.

**Request Body:**

```json
{
  "html": "<html>Your HTML content here</html>",
  "filename": "document.epub",
  "title": "Book Title",
  "author": "Author Name",
  "cover": "path/to/cover.jpg",
  "store": false
}
```

The `filename`, `title`, `author`, `cover`, and `store` fields are optional. If `store` is set to `true`, the document will be stored in Supabase.

**Response:**

The raw EPUB file with the following headers:
- `Content-Type: application/epub+zip`
- `Content-Disposition: attachment; filename="document.epub"` (or your custom filename)
- `X-Storage-Path: documents/...` (if stored in Supabase)

#### HTML to Markdown

```
POST /api/1/html-to-markdown
```

Converts HTML content to Markdown format.

**Request Body:**

```json
{
  "html": "<html>Your HTML content here</html>",
  "options": {
    "headingStyle": "atx",
    "bulletListMarker": "-"
  }
}
```

The `options` field is optional and can include any valid options for the turndown library.

**Response:**

```json
{
  "markdown": "# Your Markdown content here"
}
```

#### Markdown to HTML

```
POST /api/1/markdown-to-html
```

Converts Markdown content to HTML.

**Request Body:**

```json
{
  "markdown": "# Your Markdown content here",
  "options": {
    "gfm": true,
    "breaks": true,
    "headerIds": true
  }
}
```

The `options` field is optional and can include any valid options for the marked library.

**Response:**

```json
{
  "html": "<h1>Your Markdown content here</h1>"
}
```

#### Document History

```
GET /api/1/document-history
```

Retrieves the document generation history from Supabase.

**Query Parameters:**

- `limit` (optional): Maximum number of records to return (default: 10)
- `offset` (optional): Offset for pagination (default: 0)

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "document_type": "pdf",
      "storage_path": "documents/2023-04-18T12-34-56-789Z_document.pdf",
      "generated_at": "2023-04-18T12:34:56.789Z",
      "metadata": {
        "contentType": "application/pdf",
        "userAgent": "Mozilla/5.0 ...",
        "timestamp": "2023-04-18T12:34:56.789Z"
      }
    },
    // More records...
  ],
  "pagination": {
    "limit": 10,
    "offset": 0,
    "total": 1
  }
}
```

#### Create Subscription

```
POST /api/1/subscription
```

Creates a new subscription for the document generation service.

**Request Body:**

```json
{
  "email": "user@example.com",
  "plan": "monthly",
  "coin": "btc"
}
```

- `email` (required): User's email address
- `plan` (required): Subscription plan (`monthly` or `yearly`)
- `coin` (required): Cryptocurrency for payment (`btc`, `eth`, or `sol`)

**Response:**

```json
{
  "subscription": {
    "id": "uuid",
    "email": "user@example.com",
    "plan": "monthly",
    "amount": 5,
    "interval": "month",
    "status": "pending",
    "start_date": "2023-04-18T12:34:56.789Z",
    "expiration_date": "2023-05-18T12:34:56.789Z",
    "payment_method": "btc",
    "payment_address": "bc1q..."
  },
  "payment_info": {
    "address": "bc1q...",
    "coin": "btc",
    "amount_fiat": 5,
    "currency": "USD"
  }
}
```

#### Check Subscription Status

```
POST /api/1/subscription-status
```

Checks the status of a user's subscription.

**Request Body:**

```json
{
  "email": "user@example.com"
}
```

**Response:**

```json
{
  "has_subscription": true,
  "subscription": {
    "id": "uuid",
    "email": "user@example.com",
    "plan": "monthly",
    "amount": 5,
    "interval": "month",
    "status": "active",
    "start_date": "2023-04-18T12:34:56.789Z",
    "expiration_date": "2023-05-18T12:34:56.789Z",
    "payment_method": "btc",
    "is_active": true
  }
}
```

#### Payment Callback

```
POST /api/1/payment-callback
```

Callback endpoint for CryptAPI to notify of payment status changes.

This endpoint is used internally by CryptAPI and should not be called directly.

### Authentication

All document generation endpoints require an API key, which is the user's email address associated with an active subscription. Include the API key in the `X-API-Key` header:

```
X-API-Key: user@example.com
```

### Example: HTML to PDF with API Key

```javascript
// Using fetch API
const response = await fetch('https://pdf.profullstack.com/api/1/html-to-pdf', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'user@example.com'
  },
  body: JSON.stringify({
    html: '<html><body><h1>Hello, World!</h1></body></html>',
    store: true
  }),
});

// Get the PDF as a blob
const pdfBlob = await response.blob();

// Get the storage path from the response headers
const storagePath = response.headers.get('X-Storage-Path');
console.log('Document stored at:', storagePath);

// Create a download link
const url = URL.createObjectURL(pdfBlob);
const a = document.createElement('a');
a.href = url;
a.download = 'document.pdf';
document.body.appendChild(a);
a.click();
document.body.removeChild(a);
URL.revokeObjectURL(url);
```

### Subscription Management

The service includes a subscription management system with the following features:

1. **Subscription Creation**: Users can subscribe to the service with monthly or yearly plans
2. **Cryptocurrency Payments**: Payments are accepted in Bitcoin, Ethereum, and Solana
3. **Payment Tracking**: All payments are recorded and linked to subscriptions
4. **Expiration Handling**: Subscriptions expire automatically after their period
5. **Email Notifications**: Users receive emails for subscription events
6. **Subscription Renewal**: Users can renew their subscriptions before expiration

### Scheduled Tasks

The service includes a script for scheduled tasks related to subscription management:

```bash
# Run subscription tasks manually
node bin/subscription-tasks.js

# Set up a cron job to run daily
0 0 * * * /path/to/project/bin/subscription-tasks.js
```

This script performs the following tasks:

1. Sends payment reminders for subscriptions expiring in 7 days
2. Expires subscriptions that have passed their expiration date

To set up a cron job for automatic subscription maintenance:

```bash
# Edit crontab
crontab -e

# Add this line to run the script daily at midnight
0 0 * * * cd /path/to/project && node bin/subscription-tasks.js >> /var/log/subscription-tasks.log 2>&1
```

## Testing

A test script is included to verify the API functionality:

```bash
# Start the server in one terminal
pnpm start

# Run the test script in another terminal
pnpm test
```

This will generate test files named `test-output.pdf`, `test-output.doc`, `test-output.xlsx`, `test-output.pptx`, `test-output.epub`, `test-output.md`, and `test-output.html` in the project directory.

## Web Interface

A simple web interface is available at the root URL (e.g., http://localhost:3000) for testing the document generation functionality directly in your browser. The interface uses Web Components for a modular architecture and allows you to:

1. Edit HTML content and preview it
2. Edit Markdown content and preview it
3. Create and edit HTML tables for Excel generation
4. Create and edit HTML with headings for PowerPoint generation
5. Generate PDFs from HTML or Markdown
6. Generate Word documents from HTML or Markdown
7. Generate Excel spreadsheets from HTML tables
8. Generate PowerPoint presentations from HTML with headings
9. Generate EPUB e-books from HTML
10. Convert HTML to Markdown
11. Convert Markdown to HTML
12. View document generation history

### Subscription Page

A subscription page is available at `/subscription.html` (e.g., http://localhost:3000/subscription.html) for users to subscribe to the service. The page allows users to:

1. Choose between monthly and yearly plans
2. Select a cryptocurrency for payment
3. Enter their email address
4. Complete the payment process
5. Check payment status

## Deployment

This service is designed to be deployed to https://pdf.profullstack.com.

### Automatic Deployment

A deployment script is included to easily deploy the application to a remote server:

```bash
# Deploy using the script
pnpm deploy
```

Or directly:

```bash
./bin/deploy.sh
```

The deployment script:
1. Loads configuration from the `.env` file
2. Checks if the target directory exists on the remote server
3. Uses rsync to transfer files if the directory exists
4. Optionally installs the systemd service on the remote server
5. Makes all scripts executable
6. Provides colored output for better visibility

Configure the deployment by setting these variables in your `.env` file:
```
DEPLOY_REMOTE_HOST=your-server-hostname
DEPLOY_REMOTE_DIR=path/to/remote/directory
INSTALL_SERVICE=false  # Set to true to automatically install the systemd service
```

To automatically install the systemd service during deployment, set `INSTALL_SERVICE=true` in your `.env` file. This requires that your user has sudo privileges on the remote server without password prompt. If sudo requires a password, the script will provide instructions for manual installation.

### Running as a Systemd Service

A systemd service file is included to run the application as a service with file-based logging to /var/log.

#### Automatic Installation

The easiest way to install the service is to use the provided installation script:

```bash
# Run the installation script with sudo
sudo ./bin/install-service.sh
```

This script will:
1. Install Pandoc if not already installed (required for EPUB generation)
2. Create log files in /var/log with appropriate permissions
3. Create a symbolic link to the service file in /etc/systemd/system/
4. Make the start script executable
5. Reload systemd
6. Enable and start the service
7. Show the service status

#### Manual Installation

If you prefer to install the service manually:

```bash
# Install Pandoc (required for EPUB generation)
sudo apt-get update
sudo apt-get install -y pandoc

# Create log files
sudo touch /var/log/profullstack-pdf.log /var/log/profullstack-pdf.error.log
sudo chown www-data:www-data /var/log/profullstack-pdf.log /var/log/profullstack-pdf.error.log
sudo chmod 644 /var/log/profullstack-pdf.log /var/log/profullstack-pdf.error.log

# Create a symbolic link to the service file
sudo ln -s /path/to/project/etc/profullstack-pdf.service /etc/systemd/system/

# Reload systemd to recognize the new service
sudo systemctl daemon-reload

# Enable the service to start on boot
sudo systemctl enable profullstack-pdf

# Start the service
sudo systemctl start profullstack-pdf

# Check the status
sudo systemctl status profullstack-pdf
```

#### Viewing Logs

The service is configured to log to files in /var/log:

```bash
# View the main log
tail -f /var/log/profullstack-pdf.log

# View the error log
tail -f /var/log/profullstack-pdf.error.log
```

The service is configured to:
- Run as the www-data user and group
- Automatically restart on failure
- Log to /var/log/profullstack-pdf.log and /var/log/profullstack-pdf.error.log
- Include basic security hardening

You may need to adjust the `WorkingDirectory` in the service file to match your deployment path.

## License

ISC