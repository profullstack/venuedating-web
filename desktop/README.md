# PDF Converter Desktop App

A cross-platform desktop application that wraps the PDF Converter PWA in an Electron shell. This app provides a native desktop experience for Windows, macOS, and Linux users.

## Features

- Loads the PWA from https://profullstack.com/pdf
- Native desktop integration
- Cross-platform support (Windows, macOS, Linux)
- Custom application menu
- External link handling
- Offline capabilities (when the PWA supports it)

## Development Requirements

- Node.js 16.x or later
- npm or yarn

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

## Customization

### PWA URL

To change the URL of the PWA, modify the `pwaUrl` variable in `src/main.js`:

```javascript
// URL of the PWA
const pwaUrl = 'https://profullstack.com/pdf';
```

### Application Icons

Replace the placeholder icon files in the `assets` directory with your own icons:
- `icon.png` (512x512 PNG for Linux)
- `icon.ico` (Windows icon)
- `icon.icns` (macOS icon)

## Project Structure

- `src/main.js`: Main process script
- `src/preload.js`: Preload script for secure renderer process
- `assets/`: Application icons and resources
- `package.json`: Project configuration and dependencies

## Packaging and Distribution

The app is configured to be packaged using electron-builder. The configuration in `package.json` specifies the build targets for each platform.

## License

MIT