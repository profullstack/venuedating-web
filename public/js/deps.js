/**
 * Dependencies module
 * 
 * This file centralizes all external ESM dependencies to make them easier to manage
 * and update. It also allows for potential future bundling or local hosting of these
 * dependencies if needed.
 */

// Import and re-export spa-router directly from source
import Router from './modules/spa-router/src/router.js';
import * as transitions from './modules/spa-router/src/transitions.js';
import * as renderer from './modules/spa-router/src/renderer.js';
import * as componentLoader from './modules/spa-router/src/component-loader.js';
export { Router, transitions, renderer, componentLoader };

// Create a simple store implementation to avoid circular dependencies
export function createStore(name, initialState = {}) {
  // Create a proxy to intercept property access and modification
  const state = new Proxy(initialState, {
    set(target, property, value) {
      const oldValue = target[property];
      target[property] = value;
      
      // Only notify if value actually changed
      if (oldValue !== value) {
        store.notify(property);
      }
      
      return true;
    }
  });
  
  // Subscribers for state changes
  const subscribers = new Set();
  
  // Store object
  const store = {
    name,
    state,
    
    // Subscribe to state changes
    subscribe(callback) {
      subscribers.add(callback);
      
      // Return unsubscribe function
      return () => {
        subscribers.delete(callback);
      };
    },
    
    // Notify subscribers of state changes
    notify(property) {
      subscribers.forEach(callback => {
        try {
          callback(state, property);
        } catch (error) {
          console.error(`Error in store subscriber callback:`, error);
        }
      });
    }
  };
  
  return store;
}

// Simple StoreConnector implementation
export function StoreConnector(store) {
  return (BaseComponent) => {
    try {
      // Handle case where BaseComponent might be undefined or null
      let ParentClass;
      
      if (BaseComponent && typeof BaseComponent === 'function') {
        // Check if BaseComponent is a valid constructor
        try {
          // Test if we can create an instance of BaseComponent
          new BaseComponent();
          ParentClass = BaseComponent;
        } catch (error) {
          console.warn('StoreConnector: BaseComponent is not a valid constructor, using HTMLElement instead');
          ParentClass = HTMLElement;
        }
      } else {
        console.warn('StoreConnector: No BaseComponent provided, using HTMLElement instead');
        ParentClass = HTMLElement;
      }
      
      // Create the connected component class
      return class ConnectedComponent extends ParentClass {
        constructor() {
          super();
          this._storeUnsubscribe = null;
          this._boundElements = new Map();
        }
        
        connectedCallback() {
          // Call the parent connectedCallback if it exists
          if (super.connectedCallback) {
            super.connectedCallback();
          }
          
          // Subscribe to store changes
          if (store && typeof store.subscribe === 'function') {
            this._storeUnsubscribe = store.subscribe((state, property) => {
              // Trigger render or update if needed
              if (typeof this.render === 'function') {
                this.render();
              }
            });
          }
        }
        
        disconnectedCallback() {
          // Unsubscribe from store
          if (this._storeUnsubscribe) {
            this._storeUnsubscribe();
            this._storeUnsubscribe = null;
          }
          
          // Call the parent disconnectedCallback if it exists
          if (super.disconnectedCallback) {
            super.disconnectedCallback();
          }
        }
      };
    } catch (error) {
      console.error('StoreConnector: Error creating connected component:', error);
      // Return a basic HTMLElement subclass as fallback
      return class FallbackComponent extends HTMLElement {
        constructor() {
          super();
          console.warn('Using fallback component due to StoreConnector error');
        }
      };
    }
  };
}
// Import and re-export spa-router (commented out to avoid duplicate exports)
// export { Router, transitions, renderer, componentLoader } from 'https://esm.sh/@profullstack/spa-router@1.12.13';

// Import and re-export localizer from compiled version
import localizerDefault from './modules/localizer/dist/index.mjs';
export const localizer = localizerDefault;
export function _t(key, options = {}) {
  return localizer.translate(key, options);
}
// Import and re-export localizer (commented out to avoid duplicate exports)
// export { localizer, _t } from 'https://esm.sh/@profullstack/localizer@0.6.15';

// We're not using enhanced-router anymore, just export the Router directly
// This is a compatibility layer to avoid changing all the code that uses enhancedRouter
export const enhancedRouter = {
  createEnhancedRouter: (options = {}) => {
    console.log('Using @profullstack/spa-router directly');
    return new Router({
      rootElement: options.rootElement || '#app',
      transition: options.transition,
      renderer: options.renderer,
      errorHandler: options.errorHandler
    });
  }
};

// Create safe wrappers for other external modules
export const apiKeyManager = (() => {
  try {
    const importPromise = import('https://esm.sh/@profullstack/api-key-manager@0.2.13');
    return new Proxy({}, {
      get(target, prop) {
        return async (...args) => {
          try {
            const module = await importPromise;
            if (typeof module[prop] === 'function') {
              return module[prop](...args);
            } else if (prop in module) {
              return module[prop];
            }
            throw new Error(`Method ${prop} not found in api-key-manager module`);
          } catch (error) {
            console.error(`Error using apiKeyManager.${prop}:`, error);
            return null;
          }
        };
      }
    });
  } catch (error) {
    console.error('Error importing api-key-manager module:', error);
    return new Proxy({}, {
      get() {
        return () => Promise.resolve(null);
      }
    });
  }
})();

// Commented out auth-system module to avoid issues with jsonwebtoken in browser
export const authSystem = (() => {
  console.warn('Auth system module is disabled');
  return new Proxy({}, {
    get() {
      return () => Promise.resolve(null);
    }
  });
})();

export const paymentGateway = (() => {
  try {
    const importPromise = import('https://esm.sh/@profullstack/payment-gateway@0.2.16');
    return new Proxy({}, {
      get(target, prop) {
        return async (...args) => {
          try {
            const module = await importPromise;
            if (typeof module[prop] === 'function') {
              return module[prop](...args);
            } else if (prop in module) {
              return module[prop];
            }
            throw new Error(`Method ${prop} not found in payment-gateway module`);
          } catch (error) {
            console.error(`Error using paymentGateway.${prop}:`, error);
            return null;
          }
        };
      }
    });
  } catch (error) {
    console.error('Error importing payment-gateway module:', error);
    return new Proxy({}, {
      get() {
        return () => Promise.resolve(null);
      }
    });
  }
})();
// Create a simple stateManager implementation to avoid circular dependencies
export const stateManager = (() => {
  try {
    console.log('[state-manager] Creating simple state manager');
    
    return {
      createStateManager: (initialState = {}, options = {}) => {
        console.log('[state-manager] Creating state manager instance');
        
        try {
          // Create a simple event emitter
          const eventEmitter = {
            events: {},
            on(event, callback) {
              if (!this.events[event]) {
                this.events[event] = [];
              }
              this.events[event].push(callback);
              return () => this.off(event, callback);
            },
            off(event, callback) {
              if (!this.events[event]) return;
              this.events[event] = this.events[event].filter(cb => cb !== callback);
            },
            emit(event, ...args) {
              if (!this.events[event]) return;
              this.events[event].forEach(callback => {
                try {
                  callback(...args);
                } catch (error) {
                  console.error(`Error in event callback for ${event}:`, error);
                }
              });
            }
          };
          
          // Create a simple state manager
          return {
            _state: { ...initialState },
            getState(path) {
              try {
                if (!path) return { ...this._state };
                return this._state[path];
              } catch (error) {
                console.error('[state-manager] Error in getState:', error);
                return {};
              }
            },
            setState(update, options = {}) {
              try {
                const newState = typeof update === 'function'
                  ? update(this._state)
                  : { ...this._state, ...update };
                this._state = newState;
                return newState;
              } catch (error) {
                console.error('[state-manager] Error in setState:', error);
                return this._state;
              }
            },
            subscribe(callback, paths) {
              console.log('[state-manager] Subscribe called');
              // Return a no-op unsubscribe function
              return () => {
                console.log('[state-manager] Unsubscribe called');
              };
            }
          };
        } catch (error) {
          console.error('[state-manager] Error creating state manager instance:', error);
          return {
            _state: {},
            getState: () => ({}),
            setState: () => ({}),
            subscribe: () => (() => {})
          };
        }
      }
    };
  } catch (error) {
    console.error('[state-manager] Error in stateManager initialization:', error);
    
    // Return a fallback implementation
    return {
      createStateManager: () => ({
        _state: {},
        getState: () => ({}),
        setState: () => ({}),
        subscribe: () => (() => {})
      })
    };
  }
})();

// Create a safe wrapper for storage-service to handle potential AWS SDK errors
export const storageService = (() => {
  try {
    // Try to import the storage-service module
    const importPromise = import('https://esm.sh/@profullstack/storage-service@0.2.15');
    
    // Return a proxy that will attempt to use the module but gracefully handle errors
    return new Proxy({}, {
      get(target, prop) {
        // Return a function that will try to use the module method
        return async (...args) => {
          try {
            const module = await importPromise;
            if (typeof module[prop] === 'function') {
              return module[prop](...args);
            } else if (prop in module) {
              return module[prop];
            }
            throw new Error(`Method ${prop} not found in storage-service module`);
          } catch (error) {
            console.error(`Error using storage-service.${prop}:`, error);
            return null;
          }
        };
      }
    });
  } catch (error) {
    console.error('Error importing storage-service module:', error);
    // Return a dummy object with methods that return null
    return new Proxy({}, {
      get() {
        return () => Promise.resolve(null);
      }
    });
  }
})();
