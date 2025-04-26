# Internationalization (i18n) and Localization (l10n) Implementation

This document explains how we implemented internationalization and localization in the PDF project.

## Overview

We've implemented a complete i18n/l10n solution that allows the application to be translated into multiple languages. The implementation consists of:

1. A standalone localizer library (`@profullstack/localizer`) that provides the core functionality
2. Translation files for each supported language
3. Integration with the application's UI components
4. A language switcher component

## Localizer Library

The `@profullstack/localizer` library is a lightweight, dependency-free library that provides:

- Simple API for translating text
- Support for multiple languages
- Fallback to default language when a translation is missing
- Interpolation of variables in translations
- Support for pluralization
- Works in both browser and Node.js environments

The library is published as an npm package and can be used in any JavaScript project.

## Translation Files

Translation files are stored in the `public/i18n` directory as JSON files, with one file per language:

- `en.json`: English (default)
- `fr.json`: French
- `de.json`: German

Each file contains translations for all the text in the application, organized in a nested structure:

```json
{
  "navigation": {
    "dashboard": "Dashboard",
    "api_docs": "API Docs",
    "api_keys": "API Keys",
    ...
  },
  "errors": {
    "page_not_found": "404 - Page Not Found",
    ...
  },
  ...
}
```

## Integration with the Application

The integration is handled by the `public/js/i18n.js` file, which:

1. Imports the localizer library
2. Loads the translation files
3. Sets the initial language based on browser preference or localStorage
4. Provides functions to translate text and change the language
5. Observes DOM changes to translate dynamically added content

Since the localizer library expects flat key-value pairs, we implemented a `flattenObject` function that converts the nested translation structure to a flat one:

```javascript
function flattenObject(obj, prefix = '') {
  return Object.keys(obj).reduce((acc, key) => {
    const prefixedKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      Object.assign(acc, flattenObject(obj[key], prefixedKey));
    } else {
      acc[prefixedKey] = obj[key];
    }
    
    return acc;
  }, {});
}
```

## Language Switcher Component

We created a `language-switcher` web component (`public/js/components/language-switcher.js`) that allows users to switch between languages. The component:

1. Displays a dropdown with available languages
2. Shows the current language
3. Allows users to select a new language
4. Updates the UI when the language changes

## Usage in HTML

To translate text in HTML, we use the `data-i18n` attribute:

```html
<span data-i18n="navigation.dashboard">Dashboard</span>
```

For interpolation, we use the `data-i18n-params` attribute:

```html
<span data-i18n="errors.page_not_found_message" data-i18n-params='{"path":"/example"}'>
  The page "/example" could not be found.
</span>
```

## Usage in JavaScript

To translate text in JavaScript, we use the `_t` function:

```javascript
import { _t } from '/js/i18n.js';

const message = _t('common.loading');
const welcomeMessage = _t('auth.welcome', { name: 'John' });
```

## Demo Page

We created a demo page (`public/views/i18n-demo.html`) that showcases the localization features:

1. Language selection
2. Basic translations
3. Interpolation
4. JavaScript API

## Adding a New Language

To add a new language:

1. Create a new translation file in the `public/i18n` directory (e.g., `es.json` for Spanish)
2. Add the language code to the `AVAILABLE_LANGUAGES` array in `public/js/i18n.js`
3. Add the language name to the `getLanguageName` function in both `public/js/i18n.js` and `public/js/components/language-switcher.js`

## Adding New Translations

To add new translations:

1. Add the new keys and values to each language file
2. Use the `data-i18n` attribute or `_t` function to translate the text

## Future Improvements

Possible future improvements include:

1. Adding more languages
2. Supporting region-specific languages (e.g., `en-US`, `en-GB`)
3. Adding a translation management system
4. Implementing automatic translation detection
5. Adding support for RTL languages