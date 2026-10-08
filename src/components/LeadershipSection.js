import './LeadershipSection.css';
import { churchData } from '../data/churchData.js';

/**
 * LeadershipSection — Premium Heritage Pastor Team homepage preview.
 * Shows a compact 4-card grid on desktop.
 */
export class LeadershipSection {
  constructor(containerSelector, options = {}) {
    this.containerSelector = containerSelector;
    this.container = document.querySelector(containerSelector);
    this.options = Object.assign({ isSubSection: false }, options);

    if (this.container) {
      this.render();
      window.addEventListener('langChange', () => this.render());
    }
  }

  render() {
    this.container = document.querySelector(this.containerSelector);
    if (!this.container) return;

    const pastors = churchData.pastoralTeam;
    if (!pastors || pastors.length === 0) return;

    const cardsHTML = pastors.map(pastor => {
      const imagePositionStyle = pastor.imagePosition ? `style="object-position: ${pastor.imagePosition};"` : '';
      const altRole = pastor.secondaryRole ? `${pastor.role} and ${pastor.secondaryRole}` : pastor.role;
      const imageHTML = pastor.image
        ? `<img src="${pastor.image}" alt="${pastor.name}, ${altRole} of Centenary Baptist Church, Secunderabad" class="pt-card-photo" loading="lazy" ${imagePositionStyle}>`
        : `<div class="pt-card-photo-placeholder" aria-label="Profile image unavailable for ${pastor.name}"><span class="pt-cross-placeholder">†</span></div>`;

      const secondaryRoleHTML = pastor.secondaryRole 
        ? `<div class="pt-card-secondary-role">${pastor.secondaryRole}</div>` 
        : '';

      return `
      <div class="pt-card">
        <div class="pt-card-photo-wrap">
          ${imageHTML}
        </div>
        <div class="pt-card-body">
          <div class="pt-card-divider" aria-hidden="true">
            <span class="pt-cross">†</span>
          </div>
          <div class="pt-card-role">${pastor.role}</div>
          ${secondaryRoleHTML}
          <h3 class="pt-card-name">${pastor.name}</h3>
          <p class="pt-card-intro">${pastor.shortIntro || ''}</p>
          ${pastor.id ? `<a href="#/pastor-team/${pastor.id}" class="pt-card-btn" aria-label="Know more about ${pastor.name}">Know More &rarr;</a>` : ''}
        </div>
      </div>
    `}).join('');

    const wrapperClass = this.options.isSubSection
      ? 'pt-section pt-section--sub'
      : 'pt-section';

    this.container.innerHTML = `
      <section class="${wrapperClass}" aria-label="Pastor Team">
        <div class="pt-overlay"></div>
        <div class="wrap pt-content-wrap">
          <div class="pt-header fade-in-up">
            <div class="pt-eyebrow">PASTOR TEAM</div>
            <h2 class="pt-heading">Serving Christ. Shepherding His People.</h2>
            <p class="pt-subheading">Meet our pastoral team who faithfully serve, teach and lead our church family.</p>
          </div>
          <div class="pt-grid fade-in-up" style="animation-delay:0.15s;">
            ${cardsHTML}
          </div>
        </div>
      </section>
    `;

    this._setupAnimations();
  }

  _setupAnimations() {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.1 });

    this.container.querySelectorAll('.fade-in-up').forEach(el => observer.observe(el));
  }
}
