import { churchData } from '../data/churchData.js';

export class AnnouncementBanner {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;
    
    // In a real application, you might use localStorage to remember if the user dismissed it
    this.isDismissed = sessionStorage.getItem('cbc_announcement_dismissed') === 'true';
    
    this.render();
  }

  render() {
    if (!this.container) return;
    if (this.isDismissed || !churchData.announcement) {
      this.container.innerHTML = '';
      return;
    }
    
    const html = `
      <div class="announcement-banner fade-in-up">
        <div class="wrap ab-content">
          <div class="ab-badge">UPDATE</div>
          <p class="ab-text">${churchData.announcement}</p>
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
