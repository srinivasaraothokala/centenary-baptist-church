import { getAnalyticsConsent, setAnalyticsConsent } from './cookieConsent.js';

export const CookieSettingsModal = {
  container: null,

  init() {
    if (this.container) return; // already initialized
    
    this.container = document.createElement('div');
    this.container.id = 'cbc-cookie-modal-overlay';
    this.container.className = 'cookie-modal-overlay hidden';
    document.body.appendChild(this.container);

    this.container.innerHTML = `
      <div class="cookie-modal" role="dialog" aria-labelledby="cookie-modal-title" aria-modal="true">
        <div class="cookie-modal-header">
          <h2 id="cookie-modal-title">Cookie Preferences</h2>
          <button class="cookie-modal-close" aria-label="Close modal">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div class="cookie-modal-body">
          <p class="cookie-modal-desc">
            We use cookies to improve your experience on our website. You can customize your preferences below.
          </p>

          <div class="cookie-category">
            <div class="cookie-category-header">
              <div class="cookie-category-info">
                <h3>Essential Cookies</h3>
                <span class="cookie-status always-active">Always Active</span>
              </div>
            </div>
            <p class="cookie-category-desc">
              These cookies are strictly necessary to provide you with services available through our website and to use some of its features.
            </p>
          </div>

          <div class="cookie-category">
            <div class="cookie-category-header">
              <div class="cookie-category-info">
                <h3>Analytics Cookies</h3>
                <label class="cookie-toggle">
                  <input type="checkbox" id="cookie-analytics-toggle">
                  <span class="cookie-toggle-slider"></span>
                </label>
              </div>
            </div>
            <p class="cookie-category-desc">
              These cookies collect information that is used in aggregate form to help us understand how our website is being used.
            </p>
          </div>
        </div>
        <div class="cookie-modal-footer">
          <button class="cookie-btn cookie-btn-accept" id="cookie-save-preferences">Save Preferences</button>
        </div>
      </div>
    `;

    this.bindEvents();
  },

  bindEvents() {
    const closeBtn = this.container.querySelector('.cookie-modal-close');
    const saveBtn = this.container.querySelector('#cookie-save-preferences');
    const overlay = this.container;

    closeBtn.addEventListener('click', () => this.close());
    
    // Close on clicking outside modal
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.close();
      }
    });

    saveBtn.addEventListener('click', () => {
      const toggle = this.container.querySelector('#cookie-analytics-toggle');
      setAnalyticsConsent(toggle.checked);
      this.close();
      
      // If there's a banner, we should close it as well
      const banner = document.getElementById('cbc-cookie-banner');
      if (banner) {
        banner.classList.add('hidden');
        setTimeout(() => banner.remove(), 400);
      }
    });
  },

  open() {
    this.init();
    
    const toggle = this.container.querySelector('#cookie-analytics-toggle');
    // Default to true in the UI if not set yet, so they see what they are accepting
    const currentConsent = getAnalyticsConsent();
    toggle.checked = currentConsent !== null ? currentConsent : true;

    this.container.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // Prevent scrolling
  },

  close() {
    if (this.container) {
      this.container.classList.add('hidden');
      document.body.style.overflow = '';
    }
  }
};
