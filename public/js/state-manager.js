/**
 * State Manager for Web Components
 * 
 * A simple state management system for sharing state across web components
 * and routes in a single-page application.
 */

class StateManager {
  constructor(initialState = {}, options = {}) {
    // Private state container
    this._state = { ...initialState };
    
    // Options with defaults
    this._options = {
      localStorageKey: 'app_state',
      enablePersistence: true,
      debug: false,
      ...options
    };
    
    // Subscribers map: { key: [callback1, callback2, ...] }
    this._subscribers = new Map();
    
    // All state subscribers (for any state change)
    this._globalSubscribers = [];
    
    // Initialize from localStorage if persistence is enabled
    if (this._options.enablePersistence) {
      this._loadFromStorage();
    }
    
    // Bind methods to ensure correct 'this' context
    this.getState = this.getState.bind(this);
    this.setState = this.setState.bind(this);
    this.subscribe = this.subscribe.bind(this);
    this.unsubscribe = this.unsubscribe.bind(this);
    this.reset = this.reset.bind(this);
    
    this._log('StateManager initialized with state:', this._state);
  }
  
  /**
   * Get the current state or a specific part of the state
   * @param {string} [key] - Optional key to get a specific part of the state
   * @returns {any} The requested state
   */
  getState(key) {
    if (key === undefined) {
      return { ...this._state }; // Return a copy to prevent direct mutation
    }
    
    return this._state[key];
  }
  
  /**
   * Update the state
   * @param {object|function} update - Object to merge with state or function that returns an update object
   * @param {boolean} [silent=false] - If true, don't notify subscribers
   * @returns {object} The new state
   */
  setState(update, silent = false) {
    // Handle function updates (for state that depends on previous state)
    const updateObj = typeof update === 'function' 
      ? update(this._state) 
      : update;
    
    // Merge the update with current state
    const newState = { ...this._state, ...updateObj };
    
    // Track which keys changed
    const changedKeys = Object.keys(updateObj).filter(key => 
      JSON.stringify(this._state[key]) !== JSON.stringify(newState[key])
    );
    
    if (changedKeys.length === 0) {
      this._log('No state changes detected');
      return this._state;
    }
    
    // Update the state
    this._state = newState;
    
    // Save to localStorage if persistence is enabled
    if (this._options.enablePersistence) {
      this._saveToStorage();
    }
    
    this._log('State updated:', updateObj);
    this._log('New state:', this._state);
    
    // Notify subscribers if not silent
    if (!silent) {
      this._notifySubscribers(changedKeys);
    }
    
    return { ...this._state };
  }
  
  /**
   * Subscribe to state changes
   * @param {function} callback - Function to call when state changes
   * @param {string|string[]} [keys] - Specific state key(s) to subscribe to, or undefined for all changes
   * @returns {function} Unsubscribe function
   */
  subscribe(callback, keys) {
    if (typeof callback !== 'function') {
      throw new Error('Subscriber callback must be a function');
    }
    
    // If no keys specified, subscribe to all state changes
    if (keys === undefined) {
      this._globalSubscribers.push(callback);
      this._log('Added global subscriber');
      
      // Return unsubscribe function
      return () => {
        const index = this._globalSubscribers.indexOf(callback);
        if (index !== -1) {
          this._globalSubscribers.splice(index, 1);
          this._log('Removed global subscriber');
        }
      };
    }
    
    // Handle array of keys or single key
    const keyArray = Array.isArray(keys) ? keys : [keys];
    
    // Add subscriber for each key
    keyArray.forEach(key => {
      if (!this._subscribers.has(key)) {
        this._subscribers.set(key, []);
      }
      
      this._subscribers.get(key).push(callback);
      this._log(`Added subscriber for key: ${key}`);
    });
    
    // Return unsubscribe function
    return () => {
      keyArray.forEach(key => {
        const subscribers = this._subscribers.get(key);
        if (subscribers) {
          const index = subscribers.indexOf(callback);
          if (index !== -1) {
            subscribers.splice(index, 1);
            this._log(`Removed subscriber for key: ${key}`);
          }
        }
      });
    };
  }
  
  /**
   * Unsubscribe a callback from all subscriptions
   * @param {function} callback - The callback to unsubscribe
   */
  unsubscribe(callback) {
    // Remove from global subscribers
    const globalIndex = this._globalSubscribers.indexOf(callback);
    if (globalIndex !== -1) {
      this._globalSubscribers.splice(globalIndex, 1);
      this._log('Removed global subscriber');
    }
    
    // Remove from key-specific subscribers
    this._subscribers.forEach((subscribers, key) => {
      const index = subscribers.indexOf(callback);
      if (index !== -1) {
        subscribers.splice(index, 1);
        this._log(`Removed subscriber for key: ${key}`);
      }
    });
  }
  
  /**
   * Reset the state to initial values
   * @param {object} [initialState={}] - New initial state (defaults to empty object)
   */
  reset(initialState = {}) {
    this._state = { ...initialState };
    
    if (this._options.enablePersistence) {
      this._saveToStorage();
    }
    
    this._log('State reset to:', this._state);
    
    // Notify all subscribers
    this._notifySubscribers(Object.keys(this._state));
    
    return { ...this._state };
  }
  
  /**
   * Load state from localStorage
   * @private
   */
  _loadFromStorage() {
    try {
      const savedState = localStorage.getItem(this._options.localStorageKey);
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        this._state = { ...this._state, ...parsedState };
        this._log('Loaded state from localStorage:', parsedState);
      }
    } catch (error) {
      console.error('Error loading state from localStorage:', error);
    }
  }
  
  /**
   * Save state to localStorage
   * @private
   */
  _saveToStorage() {
    try {
      localStorage.setItem(
        this._options.localStorageKey, 
        JSON.stringify(this._state)
      );
      this._log('Saved state to localStorage');
    } catch (error) {
      console.error('Error saving state to localStorage:', error);
    }
  }
  
  /**
   * Notify subscribers of state changes
   * @param {string[]} changedKeys - Keys that changed
   * @private
   */
  _notifySubscribers(changedKeys) {
    console.log('_notifySubscribers called with changedKeys:', changedKeys);
    console.log('Current state:', this._state);
    console.log('Subscribers map:', this._subscribers);
    console.log('Global subscribers count:', this._globalSubscribers.length);
    
    // First notify key-specific subscribers
    changedKeys.forEach(key => {
      const subscribers = this._subscribers.get(key);
      if (subscribers && subscribers.length > 0) {
        console.log(`Notifying ${subscribers.length} subscribers for key: ${key}`);
        this._log(`Notifying ${subscribers.length} subscribers for key: ${key}`);
        subscribers.forEach(callback => {
          try {
            console.log(`Calling subscriber callback for key ${key}`);
            callback(this._state[key], key, { ...this._state });
          } catch (error) {
            console.error(`Error in subscriber callback for key ${key}:`, error);
          }
        });
      } else {
        console.log(`No subscribers found for key: ${key}`);
      }
    });
    
    // Then notify global subscribers
    if (this._globalSubscribers.length > 0) {
      console.log(`Notifying ${this._globalSubscribers.length} global subscribers`);
      this._log(`Notifying ${this._globalSubscribers.length} global subscribers`);
      this._globalSubscribers.forEach(callback => {
        try {
          console.log('Calling global subscriber callback');
          callback({ ...this._state }, changedKeys);
        } catch (error) {
          console.error('Error in global subscriber callback:', error);
        }
      });
    } else {
      console.log('No global subscribers to notify');
    }
  }
  
  /**
   * Log debug messages if debug is enabled
   * @private
   */
  _log(...args) {
    if (this._options.debug) {
      console.log('[StateManager]', ...args);
    }
  }
}

/**
 * Create a default instance for the application
 */
const defaultStateManager = new StateManager({}, {
  localStorageKey: 'profullstack_state',
  enablePersistence: true,
  debug: true  // Enable debug mode to see detailed logs
});

/**
 * Helper function to create a state-connected web component
 * @param {string} tagName - Custom element tag name
 * @param {class} BaseComponent - Base component class (extends HTMLElement)
 * @param {string[]} [stateKeys=[]] - State keys to subscribe to
 * @param {StateManager} [stateManager=defaultStateManager] - State manager instance
 */
function createConnectedComponent(tagName, BaseComponent, stateKeys = [], stateManager = defaultStateManager) {
  if (!customElements.get(tagName)) {
    // Create a new class that extends the base component
    const ConnectedComponent = class extends BaseComponent {
      constructor() {
        super();
        this._stateUnsubscribe = null;
      }
      
      connectedCallback() {
        // Call the parent connectedCallback if it exists
        if (super.connectedCallback) {
          super.connectedCallback();
        }
        
        // Subscribe to state changes
        this._stateUnsubscribe = stateManager.subscribe(
          this._handleStateChange.bind(this),
          stateKeys.length > 0 ? stateKeys : undefined
        );
      }
      
      disconnectedCallback() {
        // Unsubscribe from state changes
        if (this._stateUnsubscribe) {
          this._stateUnsubscribe();
          this._stateUnsubscribe = null;
        }
        
        // Call the parent disconnectedCallback if it exists
        if (super.disconnectedCallback) {
          super.disconnectedCallback();
        }
      }
      
      _handleStateChange(state, changedKeys) {
        // Call the component's stateChanged method if it exists
        if (typeof this.stateChanged === 'function') {
          this.stateChanged(state, changedKeys);
        }
      }
    };
    
    // Register the custom element
    customElements.define(tagName, ConnectedComponent);
  }
}

/**
 * Create a mixin for adding state management to a component
 * @param {StateManager} [stateManager=defaultStateManager] - State manager instance
 * @returns {function} A mixin function
 */
function StateMixin(stateManager = defaultStateManager) {
  return (BaseClass) => {
    return class extends BaseClass {
      constructor() {
        super();
        this._stateUnsubscribe = null;
        this._stateKeys = [];
      }
      
      // Connect to specific state keys
      connectToState(keys) {
        this._stateKeys = Array.isArray(keys) ? keys : [keys];
        
        // If already connected, unsubscribe first
        if (this._stateUnsubscribe) {
          this._stateUnsubscribe();
        }
        
        // Subscribe to state changes
        this._stateUnsubscribe = stateManager.subscribe(
          this._handleStateChange.bind(this),
          this._stateKeys.length > 0 ? this._stateKeys : undefined
        );
        
        return this;
      }
      
      // Get state from the state manager
      getState(key) {
        return stateManager.getState(key);
      }
      
      // Update state in the state manager
      setState(update, silent) {
        return stateManager.setState(update, silent);
      }
      
      connectedCallback() {
        // Call the parent connectedCallback if it exists
        if (super.connectedCallback) {
          super.connectedCallback();
        }
        
        // If state keys were set before connection, connect now
        if (this._stateKeys.length > 0 && !this._stateUnsubscribe) {
          this.connectToState(this._stateKeys);
        }
      }
      
      disconnectedCallback() {
        // Unsubscribe from state changes
        if (this._stateUnsubscribe) {
          this._stateUnsubscribe();
          this._stateUnsubscribe = null;
        }
        
        // Call the parent disconnectedCallback if it exists
        if (super.disconnectedCallback) {
          super.disconnectedCallback();
        }
      }
      
      _handleStateChange(state, changedKeys) {
        console.log('_handleStateChange called with state:', state);
        console.log('Changed keys:', changedKeys);
        console.log('Component:', this.tagName);
        
        // Call the component's stateChanged method if it exists
        if (typeof this.stateChanged === 'function') {
          console.log('Calling stateChanged method');
          this.stateChanged(state, changedKeys);
        } else {
          console.warn('Component does not have stateChanged method');
        }
      }
    };
  };
}

// Export the StateManager class and helpers
export {
  StateManager,
  defaultStateManager,
  createConnectedComponent,
  StateMixin
};

// Default export for convenience
export default defaultStateManager;