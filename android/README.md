# PDF Converter Android App

A simple Android app that uses WebView to load the PDF Converter PWA from the production website.

## Features

- Loads the PWA from https://profullstack.com/pdf
- Supports all PWA features through WebView
- Pull-to-refresh functionality
- Handles back navigation within the WebView
- Provides a native Android experience for the web application

## Requirements

- Android Studio Arctic Fox (2020.3.1) or newer
- Minimum SDK: 21 (Android 5.0 Lollipop)
- Target SDK: 33 (Android 13)
- Kotlin 1.8.0+

## Installation

1. Open the `PDFConverter` folder in Android Studio.
2. Wait for Gradle sync to complete.
3. Select your target device or emulator.
4. Click the Run button or press `Shift+F10` to build and run the app.

## Project Structure

- `MainActivity.kt`: Main activity with WebView implementation
- `activity_main.xml`: Main layout with WebView and SwipeRefreshLayout
- `AndroidManifest.xml`: App configuration and permissions
- `build.gradle`: Project and app-level build configurations

## Customization

To change the URL of the PWA, modify the `pwaUrl` variable in `MainActivity.kt`:

```kotlin
// URL of the PWA
private val pwaUrl = "https://profullstack.com/pdf"
```

## Additional WebView Settings

The app is configured with optimal WebView settings for PWA support:

- JavaScript enabled
- DOM storage enabled
- Database access enabled
- Geolocation enabled
- Zoom controls enabled
- File access enabled
- Caching enabled

These settings can be modified in the `onCreate` method of `MainActivity.kt` if needed.