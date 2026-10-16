import { churchData } from '../data/churchData.js';
import { getSiteSettings } from '../siteSettings.js';

const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const getSafeUrl = (value) => {
  try {
    const url = new URL(value, window.location.origin);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
  } catch {
    return '';
  }
};

export class AnnouncementBanner {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;
    
    // In a real application, you might use localStorage to remember if the user dismissed it
    this.isDismissed = sessionStorage.getItem('cbc_announcement_dismissed') === 'true';
    
    this.init();
  }

  async init() {
    const settings = await getSiteSettings();
    this.announcement = settings.announcement || {};
    this.render();
  }

  render() {
    if (!this.container) return;
    const announcement = this.announcement;
    const now = new Date();
    const startsAt = announcement.startDate ? new Date(announcement.startDate) : null;
    const endsAt = announcement.endDate ? new Date(`${announcement.endDate}T23:59:59`) : null;
    const isScheduled = (!startsAt || now >= startsAt) && (!endsAt || now <= endsAt);
    const hasConfiguredAnnouncement = Object.hasOwn(announcement, 'enabled');
    const text = announcement.enabled ? announcement.text : (hasConfiguredAnnouncement ? '' : churchData.announcement);
    const buttonUrl = getSafeUrl(announcement.buttonUrl);
    const button = announcement.enabled && announcement.buttonText && buttonUrl
      ? `<a class="ab-link" href="${escapeHtml(buttonUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(announcement.buttonText)}</a>`
      : '';

    if (this.isDismissed || !text || (announcement.enabled && !isScheduled)) {
      this.container.innerHTML = '';
      return;
    }
    
    const html = `
      <div class="announcement-banner fade-in-up">
        <div class="wrap ab-content">
          <div class="ab-badge">${escapeHtml(announcement.style || 'UPDATE')}</div>
          <p class="ab-text">${escapeHtml(text)}</p>
          ${button}
          <button class="ab-close" aria-label="Close Announcement">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
      </div>
    `;

    this.container.innerHTML = html;
    
    // Bind close event
    const closeBtn = this.container.querySelector('.ab-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        sessionStorage.setItem('cbc_announcement_dismissed', 'true');
        const banner = this.container.querySelector('.announcement-banner');
        if (banner) {
          banner.style.opacity = '0';
          banner.style.transform = 'translateY(-20px)';
          setTimeout(() => {
            this.container.innerHTML = '';
          }, 300);
        }
      });
    }

    // Trigger entrance animation
    setTimeout(() => {
      const banner = this.container.querySelector('.announcement-banner');
      if (banner) banner.classList.add('visible');
    }, 100);
  }
}
