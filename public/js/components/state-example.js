/**
 * Example component demonstrating state manager integration
 */
console.log('Loading state-example.js');
import { createStore, StoreConnector } from '../deps.js';
console.log('Imported createStore and StoreConnector from deps.js');

// Create a store for this component
const store = createStore('stateExample', {
  counter: 0,
  theme: document.documentElement.getAttribute('data-theme') || 'light',
  user: { loggedIn: false }
});

// Define a base component class
class StateExampleBase extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    // Connect to state keys
    this.connectToState(['counter', 'theme', 'user']);
    console.log('Connected to state keys: counter, theme, user');
    
    this.render();
    this.addEventListeners();
  }

  render() {
    // Get current counter value from state
    const counter = this.getState('counter') || 0;
    const theme = this.getState('theme') || 'light';
    const user = this.getState('user') || { loggedIn: false };

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: var(--font-primary, 'SpaceMono', monospace);
          padding: 20px;
          border-radius: 8px;
          background-color: var(--surface-color, #f5f5f5);
          margin-bottom: 20px;
        }
        
        .container {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }
        
        .counter-display {
          font-size: 24px;
          font-weight: bold;
          color: var(--primary-color, #e02337);
        }
        
        .controls {
          display: flex;
          gap: 10px;
        }
        
        button {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          background-color: var(--primary-color, #e02337);
          color: white;
          cursor: pointer;
          font-family: inherit;
          transition: background-color 0.2s;
        }
        
        button:hover {
          background-color: var(--primary-color-dark, #c01d2f);
        }
        
        .state-display {
          margin-top: 20px;
          padding: 15px;
          background-color: var(--surface-variant, #e0e0e0);
          border-radius: 4px;
          font-family: monospace;
          white-space: pre-wrap;
        }
        
        .theme-toggle {
          margin-top: 10px;
        }
        
        .user-controls {
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px solid var(--border-color, #ddd);
        }
      </style>
      
      <div class="container">
        <h2>State Manager Example</h2>
        
        <div class="counter-section">
          <div class="counter-display">Counter: ${counter}</div>
          <div class="controls">
            <button id="increment">Increment</button>
            <button id="decrement">Decrement</button>
            <button id="reset">Reset</button>
          </div>
        </div>
        
        <div class="theme-toggle">
          <button id="toggle-theme">
            Toggle Theme (Current: ${theme})
          </button>
        </div>
        
        <div class="user-controls">
          <button id="toggle-login">
            ${user.loggedIn ? 'Logout' : 'Login'}
          </button>
          ${user.loggedIn ? `<p>Welcome, ${user.username || 'User'}!</p>` : ''}
        </div>
        
        <div class="state-display">
          <h3>Current State:</h3>
          <pre>${JSON.stringify({ counter, theme, user }, null, 2)}</pre>
        </div>
      </div>
    `;
  }

  addEventListeners() {
    // Counter buttons
    const incrementButton = this.shadowRoot.getElementById('increment');
    if (incrementButton) {
      console.log('Adding click event listener to increment button');
      incrementButton.addEventListener('click', () => {
        console.log('Increment button clicked');
        const currentCounter = this.getState('counter') || 0;
        console.log('Current counter value:', currentCounter);
        this.setState({ counter: currentCounter + 1 });
        console.log('Counter incremented to:', currentCounter + 1);
      });
    } else {
      console.warn('Increment button not found in the shadow DOM');
    }

    this.shadowRoot.getElementById('decrement')?.addEventListener('click', () => {
      const currentCounter = this.getState('counter') || 0;
      this.setState({ counter: Math.max(0, currentCounter - 1) });
    });

    this.shadowRoot.getElementById('reset')?.addEventListener('click', () => {
      this.setState({ counter: 0 });
    });

    // Theme toggle
    this.shadowRoot.getElementById('toggle-theme')?.addEventListener('click', () => {
      const currentTheme = this.getState('theme') || 'light';
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      
      this.setState({ theme: newTheme });
      
      // Also update document theme for the whole application
      document.documentElement.setAttribute('data-theme', newTheme);
      
      // Dispatch theme change event for other components
      const event = new CustomEvent('themechange', { 
        detail: { theme: newTheme } 
      });
      document.dispatchEvent(event);
    });

    // User login/logout
    this.shadowRoot.getElementById('toggle-login')?.addEventListener('click', () => {
      const user = this.getState('user') || { loggedIn: false };
      
      if (user.loggedIn) {
        // Logout
        this.setState({ 
          user: { loggedIn: false } 
        });
      } else {
        // Login (simulate)
        this.setState({ 
          user: { 
            loggedIn: true, 
            username: 'DemoUser', 
            email: 'demo@example.com',
            lastLogin: new Date().toISOString()
          } 
        });
      }
    });
  }

  // This method will be called when state changes
  stateChanged(state, changedKeys) {
    console.log('State changed in component:', changedKeys);
    console.log('New state:', state);
    
    // Check if the counter key changed
    if (changedKeys.includes('counter')) {
      console.log('Counter changed, updating display directly');
      
      // Get the counter display element
      const counterDisplay = this.shadowRoot.querySelector('.counter-display');
      if (counterDisplay) {
        // Update the counter display directly
        // Handle both cases: when state is the full state object or just the counter value
        let counterValue;
        if (typeof state === 'object' && state !== null) {
          // If state is an object, it's the full state object
          counterValue = state.counter;
          console.log('State is an object, counter value:', counterValue);
        } else {
          // If state is not an object, it's the counter value itself
          counterValue = state;
          console.log('State is the counter value itself:', counterValue);
        }
        
        counterDisplay.textContent = `Counter: ${counterValue}`;
        console.log('Counter display updated directly to:', counterValue);
        console.log('Counter display element text after update:', counterDisplay.textContent);
      } else {
        console.error('Counter display element not found');
        // If the element doesn't exist, do a full render
        this.render();
      }
      
      // Also update the state display
      const stateDisplayPre = this.shadowRoot.querySelector('.state-display pre');
      if (stateDisplayPre) {
        // Get the full state from the state manager
        const fullState = this.getState();
        stateDisplayPre.textContent = JSON.stringify(fullState, null, 2);
      }
    } else {
      // For other state changes, do a full render
      console.log('Other state changed, doing full render');
      this.render();
      
      // Re-attach event listeners after render
      console.log('Re-attaching event listeners after render');
      this.addEventListeners();
    }
  }
}

// Create the connected component using the StoreConnector
const StateExample = StoreConnector(store)(StateExampleBase);

// Register the custom element
customElements.define('state-example', StateExample);

// Initialize default state if not already set
// No need for DOMContentLoaded event handler as we're using a local store
// that's already initialized with default values

export default StateExample;