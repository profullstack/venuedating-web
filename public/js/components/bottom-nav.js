// bottom-nav.js: Pill-shaped bottom navigation web component for BarCrush

const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host {
      display: block;
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 100;
      width: 100%;
      max-width: 360px;
      pointer-events: none;
    }
    .bottom-nav {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #fff;
      border-radius: 40px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      padding: 10px 24px;
      width: 100%;
      pointer-events: all;
    }
    .nav-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      flex: 1;
      color: #F44B74;
      background: none;
      border: none;
      outline: none;
      cursor: pointer;
      transition: color 0.2s;
      font-size: 13px;
      position: relative;
      min-width: 60px;
      z-index: 1;
    }
    .nav-item.active .icon-circle {
      background: #F44B74;
      color: #fff;
      box-shadow: 0 2px 8px rgba(244,75,116,0.12);
    }
    .icon-circle {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #fff;
      color: #F44B74;
      font-size: 22px;
      margin-bottom: 3px;
      transition: background 0.2s, color 0.2s;
      border: 2px solid #fff;
    }
    .nav-item.active .icon-circle {
      background: #F44B74;
      color: #fff;
      border: 2px solid #F44B74;
    }
    .nav-label {
      font-size: 12px;
      font-weight: 500;
    }
  </style>
  <nav class="bottom-nav">
    <button class="nav-item home" data-page="home" aria-label="Home">
      <span class="icon-circle">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7"/><path d="M9 22V12H15V22"/></svg>
      </span>
      <span class="nav-label">Home</span>
    </button>
    <button class="nav-item discover" data-page="discover" aria-label="Discover">
      <span class="icon-circle">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
      </span>
      <span class="nav-label">Discover</span>
    </button>
    <button class="nav-item chat" data-page="chat" aria-label="Chat">
      <span class="icon-circle">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2z"/></svg>
      </span>
      <span class="nav-label">Chat</span>
    </button>
  </nav>
";

class BottomNavigation extends HTMLElement {
  static get observedAttributes() {
    return ['current-page'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }

  connectedCallback() {
    this.setActive();
    // Remove any previous listeners if reconnected
    this.shadowRoot.querySelectorAll('.nav-item').forEach(btn => {
      btn.replaceWith(btn.cloneNode(true));
    });
    this.shadowRoot.querySelectorAll('.nav-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const page = btn.getAttribute('data-page');
        this.navigate(page);
      });
    });
  }

  attributeChangedCallback() {
    this.setActive();
  }

  setActive() {
    const currentPage = this.getAttribute('current-page') || 'home';
    this.shadowRoot.querySelectorAll('.nav-item').forEach(btn => {
      const page = btn.getAttribute('data-page');
      btn.classList.toggle('active', page === currentPage);
    });
  }

  navigate(page) {
    let href = '/';
    if (page === 'discover') href = '/discover';
    else if (page === 'chat') href = '/chat';
    else if (page === 'home') href = '/';
    window.location.href = href;
  }
}

customElements.define('bottom-navigation', BottomNavigation);`