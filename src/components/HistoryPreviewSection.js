import { t } from '../i18n.js';

export class HistoryPreviewSection {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;
    
    this.render = this.render.bind(this);
    window.addEventListener('langChange', this.render);
    
    this.render();
  }

  render() {
    if (!this.container) return;
    
    const html = `
      <div class="history-preview-wrapper fade-in-up" style="background-image: url('/assets/faith_history_bg.jpg')">
        <div class="history-preview-overlay">
          <div class="history-preview-content">
            <div class="hp-eyebrow">${t('fhEyebrow')}</div>
            <h2 class="hp-title">${t('fhMainTitle')}</h2>
            <p class="hp-desc">${t('previewFhDesc')}</p>
            <a href="#/about/history" class="btn btn-outline-round hp-btn">${t('discoverHeritageBtn')}</a>
          </div>
        </div>
      </div>
    `;

    this.container.innerHTML = html;
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1 });
    
    const animatedElements = this.container.querySelectorAll('.fade-in-up');
    animatedElements.forEach(el => observer.observe(el));
  }
}
