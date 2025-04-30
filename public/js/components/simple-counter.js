/**
 * Simple Counter Component
 * 
 * This demonstrates the simplified state management approach using the simple-state.js library.
 * It provides a much cleaner API compared to the current implementation.
 */
import { createStore, StoreConnector } from '../../js/deps.js';

// Create a store for our counter component
const counterStore = createStore('counter', {
  count: 0,
  theme: 'light'
});

// Define the base component class
class SimpleCounterBase extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
    
    // Connect specific elements to state properties
    this.bindElement(
      this.shadowRoot.querySelector('.counter-value'),
      'count',
      (value) => `Counter: ${value}`
    );
    
    // Connect the theme toggle button text
    this.bindElement(
      this.shadowRoot.querySelector('#theme-toggle'),
      'theme',
      (theme) => `Toggle Theme (Current: ${theme})`
    );
    
    // Update the component's theme when the theme changes
    this.connect('theme', (state) => {
      this.shadowRoot.host.setAttribute('data-theme', state.theme);
    });
  }
  
  render() {
    const { count, theme } = counterStore.state;
    
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
        
        :host([data-theme="dark"]) {
          background-color: #1a1a2e;
          color: #e6e6e6;
        }
        
        .container {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }
        
        .counter-value {
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
        
        .theme-toggle {
          margin-top: 10px;
        }
      </style>
      
      <div class="container">
        <h2>Simple State Manager Example</h2>
        
        <div class="counter-section">
          <div class="counter-value">Counter: ${count}</div>
          <div class="controls">
            <button id="increment">Increment</button>
            <button id="decrement">Decrement</button>
            <button id="reset">Reset</button>
          </div>
        </div>
        
        <div class="theme-toggle">
          <button id="theme-toggle">
            Toggle Theme (Current: ${theme})
          </button>
        </div>
      </div>
    `;
  }
  
  setupEventListeners() {
    // Increment button
    this.shadowRoot.getElementById('increment').addEventListener('click', () => {
      // Direct state manipulation - much cleaner!
      counterStore.state.count++;
    });
    
    // Decrement button
    this.shadowRoot.getElementById('decrement').addEventListener('click', () => {
      if (counterStore.state.count > 0) {
        counterStore.state.count--;
      }
    });
    
    // Reset button
    this.shadowRoot.getElementById('reset').addEventListener('click', () => {
      counterStore.state.count = 0;
    });
    
    // Theme toggle
    this.shadowRoot.getElementById('theme-toggle').addEventListener('click', () => {
      // Toggle theme with a simple assignment
      counterStore.state.theme = counterStore.state.theme === 'light' ? 'dark' : 'light';
      
      // Update document theme
      document.documentElement.setAttribute('data-theme', counterStore.state.theme);
    });
  }
}

// Create the connected component using the StoreConnector mixin
const SimpleCounter = StoreConnector(counterStore)(SimpleCounterBase);

// Register the custom element
customElements.define('simple-counter', SimpleCounter);

export default SimpleCounter;