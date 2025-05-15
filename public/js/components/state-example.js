/**
 * Example component demonstrating state manager integration
 */
console.log('Loading state-example.js');
import { createStateManager, createConnectedComponent } from '../modules/state-manager/dist/index.js';
console.log('Imported createStateManager from state-manager module');

// Create a state manager with initial state
const stateManager = createStateManager({
  counter: 0,
  theme: document.documentElement.getAttribute('data-theme') || 'light',
  user: { loggedIn: false }
}, {
  enablePersistence: true,
  persistenceKey: 'state_example',
  debug: true
});

// Define the component class
class StateExampleElement extends HTMLElement {
  constructor() {
    super();
    console.log('StateExampleElement constructor called');
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    console.log('StateExampleElement connected to DOM');
    this.render();
  }

  /**
   * This method will be called when state changes
   * @param {object} state - The current state
   * @param {string} path - The path that changed
   * @param {object} fullState - The full state object
   */
  stateChanged(state, path, fullState) {
    console.log('State changed in component:', path);
    console.log('New state:', fullState);
    console.log('State value:', state);
    
    // Re-render the component
    this.render();
    
    // If the theme changed, update the document theme
    if (path === 'theme') {
      document.documentElement.setAttribute('data-theme', state);
    }
  }

  render() {
    // Get current values from state
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

    // Add event listeners after rendering
    this.addEventListeners();
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
        
        try {
          this.setState({ counter: currentCounter + 1 });
          console.log('Counter incremented to:', currentCounter + 1);
        } catch (error) {
          console.error('Error setting state:', error);
        }
      });
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
    });

    // User login/logout
    this.shadowRoot.getElementById('toggle-login')?.addEventListener('click', () => {
      const user = this.getState('user') || { loggedIn: false };
      
      if (user.loggedIn) {
        // Logout
        this.setState({ user: { loggedIn: false } });
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
}

// Register the component with the state manager
createConnectedComponent('state-example', StateExampleElement, {
  statePaths: ['counter', 'theme', 'user']
}, stateManager);

export default StateExampleElement;