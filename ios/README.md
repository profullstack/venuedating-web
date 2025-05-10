# PDF Converter iOS App

A simple iOS app that uses WKWebView to load the PDF Converter PWA from the production website.

## Features

- Loads the PWA from the URL specified in the project's root .env file
- Supports all PWA features through WKWebView
- Handles navigation within the app
- Provides a native iOS experience for the web application

## Requirements

- Xcode 14.0+
- iOS 13.0+
- Swift 5.0+

## Installation

1. Open the `PDFConverter.xcodeproj` file in Xcode.
2. Select your target device or simulator.
3. Click the Run button or press `Cmd+R` to build and run the app.

## Project Structure

- `AppDelegate.swift`: Main application delegate
- `SceneDelegate.swift`: Scene management for iOS 13+
- `ViewController.swift`: Main view controller with WebView implementation
- `Config.swift`: Configuration class that reads from the .env file
- `Info.plist`: App configuration
- `LaunchScreen.storyboard`: Launch screen

## Configuration

The app reads the PWA URL from the `API_BASE_URL` variable in the project's root `.env` file. This allows you to easily switch between different environments (development, staging, production) by modifying a single configuration file.

### How It Works

The `Config.swift` file reads the API_BASE_URL from the .env file:

```swift
// In Config.swift
static let apiBaseURL: String = {
    // Try to read from environment variables first (for CI/CD)
    if let envURL = ProcessInfo.processInfo.environment["API_BASE_URL"] {
        return envURL
    }
    
    // Then try to read from .env file in the project root
    // ...parsing logic...
    
    // Fallback to default URL
    return "https://profullstack.com/pdf"
}()
```

And the ViewController uses this configuration:

```swift
private func loadWebsite() {
    if let url = URL(string: Config.apiBaseURL) {
        let request = URLRequest(url: url)
        webView.load(request)
    }
}