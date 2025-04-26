# State Manager for Web Components

A lightweight, flexible state management system designed specifically for web components and single-page applications using @profullstack/spa-router.

## Features

- **Simple API**: Easy-to-use methods for getting, setting, and subscribing to state changes
- **Persistence**: Automatically saves state to localStorage (configurable)
- **Targeted Subscriptions**: Subscribe to specific state keys or all state changes
- **Web Component Integration**: Includes helpers for connecting web components to state
- **TypeScript-friendly**: Well-defined interfaces and predictable behavior
- **Router Integration**: Works seamlessly with @profullstack/spa-router

## Installation

The state manager is included directly in your project. No additional installation is required.

## Basic Usage

```javascript
// Import the state manager
import stateManager from './state-manager.js';

// Get state
const counter = stateManager.getState('counter');

// Update state
stateManager.setState({ counter: counter + 1 });

// Subscribe to state changes
const unsubscribe = stateManager.subscribe((state, changedKeys) => {
  console.log('State changed:', changedKeys);
  console.log('New state:', state);
}, 'counter');

// Later, unsubscribe when done
unsubscribe();
```

## API Reference

### StateManager Class

#### `constructor(initialState = {}, options = {})`

Creates a new state manager instance.

- **initialState**: Initial state object
- **options**: Configuration options
  - **localStorageKey**: Key for localStorage (default: 'app_state')
  - **enablePersistence**: Whether to save state to localStorage (default: true)
  - **debug**: Whether to log debug messages (default: false)

#### `getState(key)`

Get the current state or a specific part of the state.

- **key** (optional): Specific state key to retrieve
- **Returns**: The requested state

#### `setState(update, silent = false)`

Update the state.

- **update**: Object to merge with state or function that returns an update object
- **silent** (optional): If true, don't notify subscribers
- **Returns**: The new state

#### `subscribe(callback, keys)`

Subscribe to state changes.

- **callback**: Function to call when state changes
- **keys** (optional): Specific state key(s) to subscribe to
- **Returns**: Unsubscribe function

#### `unsubscribe(callback)`

Unsubscribe a callback from all subscriptions.

- **callback**: The callback to unsubscribe

#### `reset(initialState = {})`

Reset the state to initial values.

- **initialState** (optional): New initial state
- **Returns**: The new state

### Helper Functions

#### `createConnectedComponent(tagName, BaseComponent, stateKeys = [], stateManager = defaultStateManager)`

Create a web component connected to the state manager.

- **tagName**: Custom element tag name
- **BaseComponent**: Base component class (extends HTMLElement)
- **stateKeys** (optional): State keys to subscribe to
- **stateManager** (optional): State manager instance

#### `StateMixin(stateManager = defaultStateManager)`

Create a mixin for adding state management to a component.

- **stateManager** (optional): State manager instance
- **Returns**: A mixin function

## Using with Web Components

### Option 1: Using the StateMixin

```javascript
import { StateMixin } from './state-manager.js';

// Create a base component
class MyComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }
  
  connectedCallback() {
    this.render();
  }
  
  render() {
    // Get state from the state manager
    const counter = this.getState('counter');
    
    this.shadowRoot.innerHTML = `
      <div>Counter: ${counter}</div>
      <button id="increment">Increment</button>
    `;
    
    this.shadowRoot.getElementById('increment').addEventListener('click', () => {
      this.setState({ counter: counter + 1 });
    });
  }
  
  // This method is called when state changes
  stateChanged(state, changedKeys) {
    this.render();
  }
}

// Apply the StateMixin to connect to the state manager
const ConnectedComponent = StateMixin()(MyComponent);

// Register the custom element
customElements.define('my-component', ConnectedComponent);
```

### Option 2: Using createConnectedComponent

```javascript
import { createConnectedComponent } from './state-manager.js';

// Create a base component
class MyComponent extends HTMLElement {
  // Same implementation as above
}

// Create and register the connected component
createConnectedComponent('my-component', MyComponent, ['counter']);
```

## Integration with Router

The state manager works seamlessly with @profullstack/spa-router:

```javascript
// In your router configuration
const routes = {
  '/dashboard': {
    view: () => loadPage('/views/dashboard.html'),
    beforeEnter: (to, from, next) => {
      // Check authentication state from state manager
      const user = stateManager.getState('user');
      if (!user || !user.loggedIn) {
        return next('/login');
      }
      next();
    }
  }
};
```

## Example Use Cases

### Authentication State

```javascript
// Login
stateManager.setState({
  user: {
    id: 123,
    username: 'johndoe',
    email: 'john@example.com',
    loggedIn: true
  }
});

// Logout
stateManager.setState({
  user: {
    loggedIn: false
  }
});

// Check auth status
const isLoggedIn = stateManager.getState('user')?.loggedIn || false;
```

### Theme Management

```javascript
// Set theme
stateManager.setState({ theme: 'dark' });

// Apply theme
const theme = stateManager.getState('theme') || 'light';
document.documentElement.setAttribute('data-theme', theme);

// Subscribe to theme changes
stateManager.subscribe((state) => {
  document.documentElement.setAttribute('data-theme', state.theme || 'light');
}, 'theme');
```

### Form State

```javascript
// Initialize form state
stateManager.setState({
  form: {
    name: '',
    email: '',
    message: ''
  }
});

// Update form field
function updateField(field, value) {
  stateManager.setState({
    form: {
      ...stateManager.getState('form'),
      [field]: value
    }
  });
}

// Get form data
const formData = stateManager.getState('form');
```

## Best Practices

1. **Keep state flat**: Avoid deeply nested state objects
2. **Use specific subscriptions**: Subscribe to specific keys when possible
3. **Clean up subscriptions**: Always unsubscribe when components are disconnected
4. **Use functions for dependent updates**:
   ```javascript
   stateManager.setState(state => ({
     total: state.items.reduce((sum, item) => sum + item.price, 0)
   }));
   ```
5. **Separate UI state from application data**: Use different state keys for UI state vs. application data

## Demo

Check out the state demo page at `/state-demo` to see the state manager in action.