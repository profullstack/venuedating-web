# PDF Converter Native Apps

This repository contains native iOS and Android applications that wrap the PDF Converter PWA (Progressive Web App) in a WebView. These apps provide a native experience for users while leveraging the existing web application.

## Project Structure

The repository is organized into two main directories:

- `/ios`: Contains the iOS application written in Swift
- `/android`: Contains the Android application written in Kotlin

Each directory has its own README with specific instructions for building and running the respective applications.

## iOS App

The iOS app uses WKWebView to load the PWA from the production website. It provides a native iOS experience with the following features:

- Full support for PWA features through WKWebView
- Progress indicator for page loading
- Navigation controls
- Error handling

See the [iOS README](./ios/README.md) for detailed instructions on building and running the iOS app.

## Android App

The Android app uses WebView to load the PWA from the production website. It provides a native Android experience with the following features:

- Full support for PWA features through WebView
- Pull-to-refresh functionality
- Back navigation handling
- Error handling

See the [Android README](./android/README.md) for detailed instructions on building and running the Android app.

## Customization

Both apps can be easily customized to point to different environments (development, staging, production) by modifying the URL in the respective WebView implementation.

### iOS URL Configuration

In `ios/PDFConverter/PDFConverter/ViewController.swift`:

```swift
private func loadWebsite() {
    if let url = URL(string: "https://profullstack.com/pdf") {
        let request = URLRequest(url: url)
        webView.load(request)
    }
}
```

### Android URL Configuration

In `android/PDFConverter/app/src/main/java/com/profullstack/pdfconverter/MainActivity.kt`:

```kotlin
// URL of the PWA
private val pwaUrl = "https://profullstack.com/pdf"
```

## Benefits of Native WebView Apps

1. **App Store Presence**: Makes the application discoverable in app stores
2. **Native Features**: Access to device capabilities not available to web apps
3. **Offline Support**: Better offline capabilities through native caching
4. **User Experience**: Provides a more integrated experience on mobile devices
5. **Push Notifications**: Native push notification support
6. **Icon on Home Screen**: Automatic placement on the user's home screen

## Future Enhancements

Potential future enhancements for these apps include:

1. Adding offline support with local caching
2. Implementing push notifications
3. Adding deep linking support
4. Integrating native file pickers for better file handling
5. Adding biometric authentication options