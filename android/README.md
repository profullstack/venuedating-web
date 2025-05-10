# PDF Converter Android App

A simple Android app that uses WebView to load the PDF Converter PWA from the production website.

## Features

- Loads the PWA from the URL specified in the project's root .env file
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
- `Config.kt`: Configuration class that reads from the .env file
- `activity_main.xml`: Main layout with WebView and SwipeRefreshLayout
- `AndroidManifest.xml`: App configuration and permissions
- `build.gradle`: Project and app-level build configurations

## Configuration

The app reads the PWA URL from the `API_BASE_URL` variable in the project's root `.env` file. This allows you to easily switch between different environments (development, staging, production) by modifying a single configuration file.

### How It Works

The `Config.kt` file reads the API_BASE_URL from the .env file:

```kotlin
// In Config.kt
object Config {
    // Default fallback URL
    private const val DEFAULT_API_BASE_URL = "https://profullstack.com/pdf"
    
    // Get API base URL from .env file
    fun getApiBaseUrl(context: Context): String {
        // Try to find and parse the .env file
        // ...parsing logic...
        
        // Return default URL if .env file not found or error occurs
        return DEFAULT_API_BASE_URL
    }
}
```

And the MainActivity uses this configuration:

```kotlin
// In MainActivity.kt
private lateinit var pwaUrl: String

override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    setContentView(R.layout.activity_main)
    
    // Get API base URL from .env file
    pwaUrl = Config.getApiBaseUrl(this)
    
    // ...rest of the code...
}
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