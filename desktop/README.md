# PDF Converter Desktop App

A cross-platform desktop application that wraps the PDF Converter PWA in an Electron shell. This app provides a native desktop experience for Windows, macOS, and Linux users.

## Features

- Loads the PWA from the URL specified in the project's root .env file
- Native desktop integration
- Cross-platform support (Windows, macOS, Linux)
- Custom application menu
- External link handling
- Offline capabilities (when the PWA supports it)

## Development Requirements

- Node.js 16.x or later
- npm or yarn
- dotenv (for .env file parsing)

## Getting Started

1. Install dependencies:
   ```
   cd desktop
   npm install
   ```

2. Run the app in development mode:
   ```
   npm start
   ```

## Building for Production

### All Platforms

To build for all platforms (that your current OS supports):

```
npm run build
```

### Platform-Specific Builds

#### Windows

```
npm run build:win
```

This will generate:
- NSIS installer (.exe)
- Portable executable (.exe)

#### macOS

```
npm run build:mac
```

This will generate:
- DMG installer (.dmg)
- ZIP archive (.zip)

#### Linux

```
npm run build:linux
```

This will generate:
- AppImage (.AppImage)
- Debian package (.deb)
- RPM package (.rpm)

## Configuration

The app reads the PWA URL from the `API_BASE_URL` variable in the project's root `.env` file. This allows you to easily switch between different environments (development, staging, production) by modifying a single configuration file.

### .env Configuration

In the project root's `.env` file:

```
API_BASE_URL=https://profullstack.com/pdf
```

### How It Works

The `config.js` file reads the API_BASE_URL from the .env file:

```javascript
// In src/config.js
function getApiBaseUrl() {
  try {
    // Try to find the .env file in the project root
    const rootPath = path.resolve(__dirname, '../../');
    const envPath = path.join(rootPath, '.env');
    
    if (fs.existsSync(envPath)) {
      // Parse .env file
      const envConfig = dotenv.parse(fs.readFileSync(envPath));
      
      // Return API_BASE_URL if found
      if (envConfig.API_BASE_URL) {
        return envConfig.API_BASE_URL;
      }
    }
    
    // Check environment variables as fallback
    // ...
    
    // Return default URL if not found
    return DEFAULT_API_BASE_URL;
  } catch (error) {
    // Handle errors
  }
}
```

And the main.js uses this configuration:

```javascript
// In src/main.js
const { getApiBaseUrl } = require('./config');

// URL of the PWA - loaded from .env file
const pwaUrl = getApiBaseUrl();
```

### Application Icons

Replace the placeholder icon files in the `assets` directory with your own icons:
- `icon.png` (512x512 PNG for Linux)
- `icon.ico` (Windows icon)
- `icon.icns` (macOS icon)

## Project Structure

- `src/main.js`: Main process script
- `src/config.js`: Configuration module that reads from the .env file
- `src/preload.js`: Preload script for secure renderer process
- `assets/`: Application icons and resources
- `package.json`: Project configuration and dependencies

## Packaging and Distribution

The app is configured to be packaged using electron-builder. The configuration in `package.json` specifies the build targets for each platform.

## License

MIT