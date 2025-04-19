# Document Generation API

A service that generates PDFs, Word documents, Excel spreadsheets, and PowerPoint presentations from HTML content using Hono.js, Puppeteer, XLSX, and PptxGenJS, with additional support for Markdown conversion.

## Features

- Converts HTML to PDF using Puppeteer
- Converts HTML to Word documents (.doc)
- Converts HTML tables to Excel spreadsheets (.xlsx)
- Converts HTML with headings to PowerPoint presentations (.pptx)
- Converts Markdown to HTML
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
  "html": "<html>Your HTML content here</html>"
}
```

**Response:**

The raw PDF file with the following headers:
- `Content-Type: application/pdf`
- `Content-Disposition: attachment; filename="document.pdf"`

#### HTML to Word Document

```
POST /api/1/html-to-doc
```

Generates a Microsoft Word document (.doc) from the provided HTML content.

**Request Body:**

```json
{
  "html": "<html>Your HTML content here</html>",
  "filename": "optional-custom-filename.doc"
}
```

**Response:**

The raw Word document file with the following headers:
- `Content-Type: application/msword`
- `Content-Disposition: attachment; filename="document.doc"` (or your custom filename)

#### HTML to Excel Spreadsheet

```
POST /api/1/html-to-excel
```

Generates a Microsoft Excel spreadsheet (.xlsx) from HTML tables in the provided HTML content. Each table in the HTML becomes a separate worksheet in the Excel file.

**Request Body:**

```json
{
  "html": "<html><body><table>...</table></body></html>",
  "filename": "optional-custom-filename.xlsx",
  "sheetName": "optional-sheet-name"
}
```

**Response:**

The raw Excel file with the following headers:
- `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- `Content-Disposition: attachment; filename="document.xlsx"` (or your custom filename)

#### HTML to PowerPoint Presentation

```
POST /api/1/html-to-ppt
```

Generates a Microsoft PowerPoint presentation (.pptx) from HTML content. The API creates slides based on headings (h1, h2, etc.) in the HTML.

**Request Body:**

```json
{
  "html": "<html><body><h1>Slide 1</h1><p>Content</p><h1>Slide 2</h1><p>More content</p></body></html>",
  "filename": "optional-custom-filename.pptx",
  "title": "optional-presentation-title"
}
```

**Response:**

The raw PowerPoint file with the following headers:
- `Content-Type: application/vnd.openxmlformats-officedocument.presentationml.presentation`
- `Content-Disposition: attachment; filename="presentation.pptx"` (or your custom filename)

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

### Example: HTML to PDF

```javascript
// Using fetch API
const response = await fetch('https://pdf.profullstack.com/api/1/html-to-pdf', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    html: '<html><body><h1>Hello, World!</h1></body></html>'
  }),
});

// Get the PDF as a blob
const pdfBlob = await response.blob();

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

### Example: HTML to Word Document

```javascript
// Using fetch API
const response = await fetch('https://pdf.profullstack.com/api/1/html-to-doc', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    html: '<html><body><h1>Hello, World!</h1></body></html>',
    filename: 'my-document.doc'
  }),
});

// Get the Word document as a blob
const docBlob = await response.blob();

// Create a download link
const url = URL.createObjectURL(docBlob);
const a = document.createElement('a');
a.href = url;
a.download = 'my-document.doc';
document.body.appendChild(a);
a.click();
document.body.removeChild(a);
URL.revokeObjectURL(url);
```

### Example: HTML to Excel Spreadsheet

```javascript
// Using fetch API
const response = await fetch('https://pdf.profullstack.com/api/1/html-to-excel', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    html: `
      <html>
        <body>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1</td>
                <td>John Doe</td>
                <td>john@example.com</td>
              </tr>
              <tr>
                <td>2</td>
                <td>Jane Smith</td>
                <td>jane@example.com</td>
              </tr>
            </tbody>
          </table>
        </body>
      </html>
    `,
    filename: 'data.xlsx',
    sheetName: 'Contacts'
  }),
});

// Get the Excel file as a blob
const excelBlob = await response.blob();

// Create a download link
const url = URL.createObjectURL(excelBlob);
const a = document.createElement('a');
a.href = url;
a.download = 'data.xlsx';
document.body.appendChild(a);
a.click();
document.body.removeChild(a);
URL.revokeObjectURL(url);
```

### Example: HTML to PowerPoint Presentation

```javascript
// Using fetch API
const response = await fetch('https://pdf.profullstack.com/api/1/html-to-ppt', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    html: `
      <html>
        <body>
          <h1>Introduction</h1>
          <p>This is the first slide of the presentation.</p>
          
          <h1>Second Slide</h1>
          <p>This is the content for the second slide.</p>
          
          <h1>Conclusion</h1>
          <p>Thank you for your attention!</p>
        </body>
      </html>
    `,
    filename: 'presentation.pptx',
    title: 'My Presentation'
  }),
});

// Get the PowerPoint file as a blob
const pptBlob = await response.blob();

// Create a download link
const url = URL.createObjectURL(pptBlob);
const a = document.createElement('a');
a.href = url;
a.download = 'presentation.pptx';
document.body.appendChild(a);
a.click();
document.body.removeChild(a);
URL.revokeObjectURL(url);
```

### Example: Markdown to HTML

```javascript
// Using fetch API
const response = await fetch('https://pdf.profullstack.com/api/1/markdown-to-html', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    markdown: '# Hello, World!\n\nThis is **bold** text.',
    options: {
      gfm: true,
      breaks: true
    }
  }),
});

const result = await response.json();
console.log(result.html);
// Output: <h1>Hello, World!</h1><p>This is <strong>bold</strong> text.</p>
```

### Markdown to Document Workflow

You can also convert Markdown to PDF, Word documents, Excel spreadsheets, or PowerPoint presentations by first converting to HTML and then generating the document:

```javascript
// Step 1: Convert Markdown to HTML
const mdResponse = await fetch('https://pdf.profullstack.com/api/1/markdown-to-html', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    markdown: '# Hello, World!\n\nThis is **bold** text.'
  }),
});

const { html } = await mdResponse.json();

// Step 2: Generate PDF from the HTML
const pdfResponse = await fetch('https://pdf.profullstack.com/api/1/html-to-pdf', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ html }),
});

const pdfBlob = await pdfResponse.blob();
// ... handle the PDF blob
```

## Testing

A test script is included to verify the API functionality:

```bash
# Start the server in one terminal
pnpm start

# Run the test script in another terminal
node test.js
```

This will generate test files named `test-output.pdf`, `test-output.doc`, `test-output.xlsx`, `test-output.pptx`, and `test-output.html` in the project directory.

## Web Interface

A simple web interface is available at the root URL (e.g., http://localhost:3000) for testing the document generation functionality directly in your browser. The interface allows you to:

1. Edit HTML content and preview it
2. Edit Markdown content and preview it
3. Create and edit HTML tables for Excel generation
4. Create and edit HTML with headings for PowerPoint generation
5. Generate PDFs from HTML or Markdown
6. Generate Word documents from HTML or Markdown
7. Generate Excel spreadsheets from HTML tables
8. Generate PowerPoint presentations from HTML with headings
9. Convert Markdown to HTML

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
4. Provides colored output for better visibility

Configure the deployment by setting these variables in your `.env` file:
```
DEPLOY_REMOTE_HOST=your-server-hostname
DEPLOY_REMOTE_DIR=path/to/remote/directory
```

### Running as a Systemd Service

A systemd service file is included to run the application as a service with file-based logging to /var/log.

#### Automatic Installation

The easiest way to install the service is to use the provided installation script:

```bash
# Run the installation script with sudo
sudo ./bin/install-service.sh
```

This script will:
1. Create log files in /var/log with appropriate permissions
2. Copy the service file to /etc/systemd/system/
3. Make the start script executable
4. Reload systemd
5. Enable and start the service
6. Show the service status

#### Manual Installation

If you prefer to install the service manually:

```bash
# Create log files
sudo touch /var/log/profullstack-pdf.log /var/log/profullstack-pdf.error.log
sudo chown www-data:www-data /var/log/profullstack-pdf.log /var/log/profullstack-pdf.error.log
sudo chmod 644 /var/log/profullstack-pdf.log /var/log/profullstack-pdf.error.log

# Copy the service file to the systemd directory
sudo cp etc/profullstack-pdf.service /etc/systemd/system/

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