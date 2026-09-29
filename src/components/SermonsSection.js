import { t } from '../i18n.js';
import { churchData } from '../data/churchData.js';

export class SermonsSection {
  constructor(containerSelector) {
    this.container = document.querySelector(containerSelector);
    if (!this.container) return;
    this.render();
    window.addEventListener('langChange', () => this.render());
    window.addEventListener('sermonsUpdated', () => this.render());
  }

  render() {
    if (!this.container) return;

    let html = `
      <div class="wrap">
        <div class="section-header text-center fade-in-up" style="margin-bottom: 48px;">
          <div class="eyebrow">TEACHING</div>
          <h2 style="font-family: 'Playfair Display', serif; color: var(--primary-green); font-size: 36px; margin: 0; text-transform: uppercase;">SERMONS</h2>
        </div>
        
        <div class="sermons-list">
    `;

    churchData.sermons.forEach((sermon, i) => {
      html += `
        <div class="sermon-row fade-in-up stagger-1">
          <div class="sermon-info">
            <h3 class="sermon-title">${sermon.title}</h3>
            <p class="sermon-meta">
              <span class="sermon-speaker"><strong>${sermon.speaker}</strong></span> &middot; 
              <span class="sermon-passage">${sermon.passage}</span> &middot; 
              <span class="sermon-date">${sermon.date}</span>
            </p>
          </div>
          <div class="sermon-actions">
            <button class="btn btn-outline-round btn-sermon-watch">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:8px;"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
              WATCH
            </button>
            <button class="btn btn-outline-round btn-sermon-listen">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:8px;"><path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path></svg>
              LISTEN
            </button>
          </div>
        </div>
      `;
    });

    html += `
        </div>
        
        <div class="sermons-footer text-center" style="margin-top: 48px;">
          <a href="#/watch-live" class="btn btn-solid-maroon" style="margin-right: 16px;">WATCH LIVE &rarr;</a>
          <a href="#/sermons" class="btn btn-outline-maroon">VIEW ALL SERMONS &rarr;</a>
        </div>
      </div>
    `;

    this.container.className = 'section sermons-section';
    this.container.style.backgroundColor = 'var(--cream)';
    this.container.innerHTML = html;

    // Trigger animations
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1 });
    
    this.container.querySelectorAll('.fade-in-up').forEach(el => observer.observe(el));
  }
}
