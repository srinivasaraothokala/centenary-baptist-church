import { getAnalyticsConsent, setAnalyticsConsent, fetchCookieSettings } from './cookieConsent.js';
import { CookieSettingsModal } from './CookieSettings.js';
import './cookie.css';

export class CookieBanner {
  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'cbc-cookie-banner';
    this.container.className = 'cookie-banner hidden';
    document.body.appendChild(this.container);
  }

  async init() {
    // Admin / Member routes bypass the cookie banner
    if (window.location.hash.startsWith('#/admin') || window.location.hash.startsWith('#/member')) {
      return;
    }

    // Check if the user has already made a choice
    if (getAnalyticsConsent() !== null) {
      return;
    }

    // Fetch site settings to see if the banner is enabled and to get the text
    const settings = await fetchCookieSettings();
    const isEnabled = settings.cookieNoticeEnabled !== false; // Default to true if undefined
    const text = settings.cookieNoticeText || "We use essential cookies to keep this website working. With your permission, we may also use analytics cookies to understand how visitors use our website and improve the experience.";

    if (!isEnabled) {
      return;
    }

    this.render(text);
  }

  render(text) {
    this.container.innerHTML = `
      <div class="cookie-banner-content wrap">
        <div class="cookie-banner-text">
          <h3 class="cookie-banner-title">Cookie Notice</h3>
          <p>${text}</p>
        </div>
        <div class="cookie-banner-actions">
          <button class="cookie-btn cookie-btn-settings" id="cookie-btn-settings">Cookie Settings</button>
          <button class="cookie-btn cookie-btn-reject" id="cookie-btn-reject">Reject Analytics</button>
          <button class="cookie-btn cookie-btn-accept" id="cookie-btn-accept">Accept Analytics</button>
        </div>
      </div>
    `;

    this.container.classList.remove('hidden');
    this.bindEvents();
  }

  bindEvents() {
    const acceptBtn = this.container.querySelector('#cookie-btn-accept');
    const rejectBtn = this.container.querySelector('#cookie-btn-reject');
    const settingsBtn = this.container.querySelector('#cookie-btn-settings');

    if (acceptBtn) {
      acceptBtn.addEventListener('click', () => {
        setAnalyticsConsent(true);
        this.close();
      });
    }

    if (rejectBtn) {
      rejectBtn.addEventListener('click', () => {
        setAnalyticsConsent(false);
        this.close();
      });
    }

    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        CookieSettingsModal.open();
      });
    }
  }

  close() {
    this.container.classList.add('hidden');
    setTimeout(() => {
      this.container.remove();
    }, 400); // match transition
  }
}
