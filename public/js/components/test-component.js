/**
 * Simple test component to verify web components are working
 */
console.log('Loading test-component.js');

class TestComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    console.log('TestComponent constructor called');
  }

  connectedCallback() {
    console.log('TestComponent connected to DOM');
    this.render();
  }

  render() {
    console.log('TestComponent render called');
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          padding: 20px;
          background-color: #f0f0f0;
          border-radius: 8px;
          margin: 20px 0;
        }
        
        h2 {
          color: #e02337;
        }
      </style>
      
      <div>
        <h2>Test Component</h2>
        <p>This is a simple test component to verify web components are working.</p>
      </div>
    `;
  }
}

// Register the custom element
customElements.define('test-component', TestComponent);
console.log('TestComponent registered');

export default TestComponent;