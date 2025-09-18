# SvelteKit Migration Plan

## Overview
Convert the current Hono.js backend + Web Components frontend to SvelteKit with Svelte 5, preserving all design aesthetics and functionality.

## Current Architecture
- **Backend**: Hono.js with Node.js server
- **Frontend**: Custom Web Components with Shadow DOM
- **Database**: Supabase
- **Styling**: CSS custom properties with comprehensive theme system
- **Router**: Custom SPA router

## Target Architecture
- **Framework**: SvelteKit with Svelte 5
- **Backend**: SvelteKit API routes (replacing Hono.js)
- **Frontend**: Svelte 5 components (replacing Web Components)
- **Database**: Supabase (unchanged)
- **Styling**: CSS custom properties preserved + Svelte scoped styles
- **Router**: SvelteKit's built-in routing

## Migration Strategy

### Phase 1: Project Setup
1. Create new SvelteKit project structure
2. Install dependencies and configure build tools
3. Set up Supabase integration
4. Configure environment variables

### Phase 2: Design System Migration
1. Convert CSS custom properties to SvelteKit
2. Create Svelte theme store for light/dark mode
3. Set up global styles and CSS architecture
4. Create design system components

### Phase 3: Backend API Migration
1. Convert Hono.js routes to SvelteKit API routes
2. Migrate authentication middleware
3. Convert payment processing endpoints
4. Migrate user management and matching APIs
5. Set up WebSocket support in SvelteKit

### Phase 4: Component Migration
1. Convert BaseComponent to Svelte base component
2. Migrate individual web components to Svelte 5 components
3. Implement component state management with Svelte stores
4. Convert custom events to Svelte event dispatching

### Phase 5: Routing and Navigation
1. Map existing routes to SvelteKit file-based routing
2. Implement route transitions and animations
3. Set up navigation guards and authentication checks
4. Configure SEO and meta tags

### Phase 6: Testing and Optimization
1. Test all functionality
2. Optimize bundle size and performance
3. Ensure responsive design works correctly
4. Test payment flows and authentication

## Detailed Implementation Plan

### 1. SvelteKit Project Structure
```
src/
├── app.html                 # Main HTML template
├── app.css                  # Global styles
├── lib/
│   ├── components/          # Svelte components
│   ├── stores/              # Svelte stores
│   ├── utils/               # Utility functions
│   ├── styles/              # CSS modules
│   └── types/               # Type definitions (if needed)
├── routes/
│   ├── +layout.svelte       # Root layout
│   ├── +page.svelte         # Home page
│   ├── api/                 # API routes
│   └── [other routes]/
└── hooks.server.js          # Server hooks for auth

static/
├── css/                     # Existing CSS files
├── js/                      # Legacy JS (if needed)
└── [other static assets]
```

### 2. Key Dependencies
```json
{
  "dependencies": {
    "@sveltejs/kit": "^2.0.0",
    "svelte": "^5.0.0",
    "@supabase/supabase-js": "^2.49.4",
    "stripe": "^14.22.0",
    "square": "^39.0.0",
    "twilio": "^5.7.1",
    "ws": "^8.18.1"
  },
  "devDependencies": {
    "@sveltejs/adapter-node": "^2.0.0",
    "vite": "^5.0.0",
    "vitest": "^1.0.0"
  }
}
```

### 3. Design System Conversion

#### Theme Store (Svelte 5)
```javascript
// src/lib/stores/theme.js
import { writable } from 'svelte/store';
import { browser } from '$app/environment';

function createThemeStore() {
  const { subscribe, set, update } = writable('light');

  return {
    subscribe,
    toggle: () => update(theme => {
      const newTheme = theme === 'light' ? 'dark' : 'light';
      if (browser) {
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
      }
      return newTheme;
    }),
    init: () => {
      if (browser) {
        const stored = localStorage.getItem('theme');
        const theme = stored || 'light';
        document.documentElement.setAttribute('data-theme', theme);
        set(theme);
      }
    }
  };
}

export const theme = createThemeStore();
```

#### Base Component Pattern
```svelte
<!-- src/lib/components/BaseComponent.svelte -->
<script>
  import { onMount, createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();
  
  // Props that all components can use
  export let className = '';
  export let testId = '';
  
  // Auth token helper (similar to BaseComponent.getAuthToken)
  export async function getAuthToken() {
    const token = localStorage.getItem('jwt_token');
    if (token && token !== 'null' && token.length > 50) {
      return token;
    }
    throw new Error('Authentication token not found');
  }
</script>

<div class="base-component {className}" data-testid={testId}>
  <slot />
</div>

<style>
  .base-component {
    /* Base component styles using CSS custom properties */
    font-family: var(--font-family);
    color: var(--text-primary);
  }
</style>
```

### 4. API Route Migration Example

#### Before (Hono.js)
```javascript
// src/routes/auth.js
export const loginRoute = {
  method: 'POST',
  path: '/api/auth/login',
  handler: async (c) => {
    // login logic
  }
};
```

#### After (SvelteKit)
```javascript
// src/routes/api/auth/login/+server.js
import { json } from '@sveltejs/kit';

export async function POST({ request }) {
  try {
    const body = await request.json();
    // login logic
    return json({ success: true });
  } catch (error) {
    return json({ error: error.message }, { status: 400 });
  }
}
```

### 5. Component Migration Example

#### Before (Web Component)
```javascript
// public/js/components/user-card.js
export class UserCard extends BaseComponent {
  getTemplate() {
    return `<div class="user-card">...</div>`;
  }
  
  getStyles() {
    return `:host { display: block; }`;
  }
}
```

#### After (Svelte 5)
```svelte
<!-- src/lib/components/UserCard.svelte -->
<script>
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();
  
  export let user = {};
  
  function handleClick() {
    dispatch('user-card-action', { timestamp: new Date() });
  }
</script>

<div class="user-card">
  <h2>UserCard</h2>
  <div class="user-card-content">
    <button on:click={handleClick}>Click Me</button>
  </div>
</div>

<style>
  .user-card {
    padding: 16px;
    border-radius: 8px;
    background-color: var(--surface-color);
  }
  
  button {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    background-color: var(--primary-color);
    color: white;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  button:hover {
    background-color: var(--primary-color-dark);
  }
</style>
```

## Benefits of Migration

### Performance
- **Faster Loading**: SvelteKit's optimized bundling and code splitting
- **Better SEO**: Server-side rendering capabilities
- **Smaller Bundle**: Svelte compiles to vanilla JS

### Developer Experience
- **Type Safety**: Optional TypeScript support
- **Hot Reloading**: Faster development cycles
- **Built-in Routing**: No need for custom router
- **Better Tooling**: Excellent VS Code support

### Maintainability
- **Simpler Architecture**: Less boilerplate code
- **Better State Management**: Reactive stores
- **Component Composition**: More flexible than web components
- **Modern Standards**: Latest web development practices

## Migration Timeline
- **Week 1**: Project setup and design system migration
- **Week 2**: Backend API migration
- **Week 3**: Component migration (core components)
- **Week 4**: Component migration (remaining components)
- **Week 5**: Routing and navigation
- **Week 6**: Testing, optimization, and deployment

## Risk Mitigation
1. **Gradual Migration**: Migrate in phases to minimize disruption
2. **Feature Parity**: Ensure all existing features work correctly
3. **Design Preservation**: Maintain exact visual appearance
4. **Performance Testing**: Ensure no performance regressions
5. **Rollback Plan**: Keep current system running during migration

## Success Criteria
- [ ] All existing functionality preserved
- [ ] Design aesthetics maintained exactly
- [ ] Performance improved or maintained
- [ ] SEO capabilities enhanced
- [ ] Developer experience improved
- [ ] Bundle size optimized
- [ ] All tests passing