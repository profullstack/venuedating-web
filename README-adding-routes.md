# Adding a New Route/Page/Component

This guide explains how to add a new route, page, or component to the application using our router setup.

## Overview

Our application uses a Single Page Application (SPA) router with helper utilities that simplify adding and managing routes. The router handles page transitions, authentication checks, and subscription requirements with minimal code.

## Step-by-Step Guide

### 1. Create the HTML View File

First, create an HTML file for your new page in the `/views` directory:

```html
<!-- /views/my-new-feature.html -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My New Feature</title>
  <link rel="stylesheet" href="/css/main.css">
</head>
<body>
  <div class="my-feature-container">
    <h1 data-i18n="my_feature.title">My New Feature</h1>
    <p data-i18n="my_feature.description">This is my new feature page.</p>
    
    <!-- Your page content here -->
    <div class="feature-content">
      <form id="my-feature-form">
        <!-- Form fields -->
        <button type="submit" data-i18n="my_feature.submit">Submit</button>
      </form>
    </div>
  </div>
</body>
</html>
```

### 2. Create an Initializer Function (Optional)

If your page needs JavaScript initialization (event listeners, data loading, etc.), create an initializer function in `page-initializers.js`:

```javascript
/**
 * Initialize the new feature page
 */
export function initMyNewFeaturePage() {
  console.log('Initializing my new feature page');
  
  // Get elements
  const form = document.getElementById('my-feature-form');
  if (!form) {
    console.error('My feature form not found');
    return;
  }
  
  // Add event listeners
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Form submission logic
    console.log('Form submitted');
    
    // Get form data
    const formData = new FormData(form);
    const formDataObj = Object.fromEntries(formData.entries());
    
    // Process the form data
    console.log('Form data:', formDataObj);
    
    // Additional logic...
  });
  
  // Other initialization code...
}
```

Don't forget to export the initializer function at the top of the file:

```javascript
export {
  // ... existing exports
  initMyNewFeaturePage
} from './page-initializers.js';
```

### 3. Add the Route to the Router

#### Approach 1: Add Directly to router.js

Open `router.js` and add your new route to the `createRoutes` call in the `defineRoutes` function:

```javascript
// In router.js
export function defineRoutes(router) {
  console.log('Defining routes...');
  
  // Define routes using the createRoutes helper
  const routes = createRoutes({
    // Existing routes...
    '/': '/views/home.html',
    
    // Add your new route
    '/my-new-feature': {
      viewPath: '/views/my-new-feature.html',
      afterRender: initMyNewFeaturePage, // Optional
      requireAuth: true  // If the route requires authentication
    }
  });
  
  // Rest of the function...
}
```

#### Approach 2: Create a Separate Routes File

For better organization in larger applications, you can create a separate file for related routes:

```javascript
// feature-routes.js
import { createRoutes } from './route-helpers.js';
import { initMyNewFeaturePage } from './page-initializers.js';

export const featureRoutes = createRoutes({
  '/my-new-feature': {
    viewPath: '/views/my-new-feature.html',
    afterRender: initMyNewFeaturePage,
    requireAuth: true
  },
  '/my-new-feature/settings': {
    viewPath: '/views/my-new-feature-settings.html',
    requireAuth: true
  }
});
```

Then import and merge these routes in `router.js`:

```javascript
// In router.js
import { featureRoutes } from './feature-routes.js';

export function defineRoutes(router) {
  console.log('Defining routes...');
  
  // Define core routes
  const coreRoutes = createRoutes({
    // Existing routes...
  });
  
  // Merge all routes
  const routes = {
    ...coreRoutes,
    ...featureRoutes
    // Add more route collections as needed
  };
  
  // Register routes with the router
  router.registerRoutes(routes);
  
  // Rest of the function...
}
```

## Route Configuration Options

When adding a route, you can use these options:

| Option | Type | Description |
|--------|------|-------------|
| `viewPath` | String | Path to the HTML view file |
| `afterRender` | Function | Function to run after the page is rendered |
| `beforeEnter` | Function | Function to run before entering the route |
| `requireAuth` | Boolean | Whether the route requires authentication |
| `requireSubscription` | Boolean | Whether the route requires an active subscription |

## Examples

### Basic Route

```javascript
'/about': '/views/about.html'
```

### Route with Initialization

```javascript
'/profile': {
  viewPath: '/views/profile.html',
  afterRender: initProfilePage
}
```

### Protected Route (Requires Authentication)

```javascript
'/dashboard': {
  viewPath: '/views/dashboard.html',
  requireAuth: true
}
```

### Premium Route (Requires Subscription)

```javascript
'/premium-feature': {
  viewPath: '/views/premium-feature.html',
  requireSubscription: true
}
```

### Route with Custom Guard

```javascript
'/admin': {
  viewPath: '/views/admin.html',
  beforeEnter: (to, from, next) => {
    const userRole = localStorage.getItem('user_role');
    if (userRole === 'admin') {
      next();
    } else {
      next('/access-denied');
    }
  }
}
```

## Testing Your New Route

After adding the route, you can test it by navigating to the URL in your browser:

```
http://localhost:3000/my-new-feature
```

The router will handle loading the HTML, running the initializer function, and checking authentication if required.

## Best Practices

1. **Organize Related Routes**: Keep related routes together, either in the same section of `router.js` or in a separate routes file.

2. **Use Descriptive Route Names**: Choose route paths that clearly describe the feature or page.

3. **Follow Naming Conventions**: Use consistent naming for HTML files, initializer functions, and route paths.

4. **Handle Authentication Properly**: Use the `requireAuth` option for protected routes instead of implementing custom checks.

5. **Add Internationalization**: Use `data-i18n` attributes for text that needs to be translated.

6. **Clean Up Event Listeners**: If your initializer adds event listeners, make sure to remove them when the page is unloaded to prevent memory leaks.

7. **Test Thoroughly**: Test your new route with different scenarios (logged in, logged out, with/without subscription) to ensure it behaves correctly.