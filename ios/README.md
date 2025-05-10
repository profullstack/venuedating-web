# PDF Converter iOS App

A simple iOS app that uses WKWebView to load the PDF Converter PWA from the production website.

## Features

- Loads the PWA from https://profullstack.com/pdf
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
- `Info.plist`: App configuration
- `LaunchScreen.storyboard`: Launch screen

## Customization

To change the URL of the PWA, modify the `loadWebsite()` method in `ViewController.swift`:

```swift
private func loadWebsite() {
    if let url = URL(string: "https://profullstack.com/pdf") {
        let request = URLRequest(url: url)
        webView.load(request)
    }
}