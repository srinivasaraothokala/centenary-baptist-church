import './PastorTeamPage.css';
import { churchData } from '../data/churchData.js';

/**
 * PastorTeamPage — handles:
 *   #/pastor-team           → premium team listing (all pastors as cards)
 *   #/pastor-team/:id       → individual full biography
 */
export class PastorTeamPage {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
  }

  render(path) {
    if (!this.container) return;

    const isProfile = path.startsWith('/pastor-team/');
    if (isProfile) {
      const id = path.split('/')[2];
      const pastor = churchData.pastoralTeam.find(p => p.id === id);
      pastor ? this.renderProfile(pastor) : (window.location.hash = '#/pastor-team');
    } else {
      this.renderTeam();
    }

    // SEO
    document.title = 'Pastor Team | Centenary Baptist Church, Secunderabad';
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      document.head.appendChild(metaDesc);
    }
    metaDesc.content = 'Meet the pastoral team serving Centenary Baptist Church, Secunderabad — faithfully leading worship in Telugu, Hindi and English.';

    window.scrollTo(0, 0);
  }

  /* ----------------------------------------------------------------
     Team listing — all pastors as premium portrait cards
     ---------------------------------------------------------------- */
  renderTeam() {
    const pastors = churchData.pastoralTeam;

    const cardsHTML = pastors.map(pastor => {
      const intro = pastor.shortIntro || pastor.bio.split('\n\n')[0];
      
      const imagePositionStyle = pastor.imagePosition ? `style="object-position: ${pastor.imagePosition};"` : '';
      const altRole = pastor.secondaryRole ? `${pastor.role} and ${pastor.secondaryRole}` : pastor.role;
      const imageHTML = pastor.image
        ? `<img src="${pastor.image}" alt="${pastor.name}, ${altRole} of Centenary Baptist Church, Secunderabad" class="ptp-card-photo" loading="lazy" ${imagePositionStyle}>`
        : `<div class="ptp-card-photo-placeholder" aria-label="Profile image unavailable for ${pastor.name}"><span class="ptp-cross-placeholder">†</span></div>`;

      const secondaryRoleHTML = pastor.secondaryRole 
        ? `<div class="ptp-card-secondary-role">${pastor.secondaryRole}</div>` 
        : '';

      return `
        <div class="ptp-card">
          <div class="ptp-card-photo-wrap">
            ${imageHTML}
          </div>
          <div class="ptp-card-body">
            <div class="ptp-card-divider" aria-hidden="true">
              <span class="ptp-cross">†</span>
            </div>
            <div class="ptp-role">${pastor.role}</div>
            ${secondaryRoleHTML}
            <h2 class="ptp-name">${pastor.name}</h2>
            <p class="ptp-intro">${intro}</p>
            ${pastor.id ? `<a href="#/pastor-team/${pastor.id}" class="ptp-know-more" aria-label="Full profile of ${pastor.name}">Know More &rarr;</a>` : ''}
          </div>
        </div>
      `;
    }).join('');

    this.container.innerHTML = `
      <div class="ptp-page-wrapper">
        <div class="ptp-overlay"></div>
        <div class="ptp-content-wrap">
          <div class="ptp-hero fade-in-up">
            <div class="wrap">
              <div class="ptp-eyebrow">PASTOR TEAM</div>
              <h1 class="ptp-hero-title">Serving Christ. Shepherding His People.</h1>
              <p class="ptp-hero-subtitle">Meet our pastoral team who faithfully serve, teach and lead our church family.</p>
            </div>
          </div>
          <div class="wrap ptp-team-wrap fade-in-up" style="animation-delay: 0.15s;">
            <div class="ptp-grid">${cardsHTML}</div>
          </div>
        </div>
      </div>
    `;

    this._setupAnimations();
  }

  /* ----------------------------------------------------------------
     Full biography profile
     ---------------------------------------------------------------- */
  renderProfile(pastor) {
    const bioParagraphs = pastor.bio.split('\n\n').map(p => `<p>${p}</p>`).join('');

    const imagePositionStyle = pastor.imagePosition ? `style="object-position: ${pastor.imagePosition};"` : '';
    const altRole = pastor.secondaryRole ? `${pastor.role} and ${pastor.secondaryRole}` : pastor.role;
    const imageHTML = pastor.image
      ? `<img src="${pastor.image}" alt="${pastor.name}, ${altRole} of Centenary Baptist Church, Secunderabad" class="ptp-profile-img" ${imagePositionStyle}>`
      : `<div class="ptp-profile-img-placeholder" aria-label="Profile image unavailable for ${pastor.name}"><span class="ptp-cross-placeholder-large">†</span></div>`;

    const secondaryRoleHTML = pastor.secondaryRole 
      ? `<div class="ptp-profile-secondary-role">${pastor.secondaryRole}</div>` 
      : '';

    this.container.innerHTML = `
      <div class="ptp-profile-page">
        <div class="wrap">
          <nav class="ptp-breadcrumb" aria-label="Breadcrumb">
            <a href="#/" class="ptp-bc-link">Home</a>
            <span class="ptp-bc-sep" aria-hidden="true">›</span>
            <a href="#/pastor-team" class="ptp-bc-link">Pastor Team</a>
            <span class="ptp-bc-sep" aria-hidden="true">›</span>
            <span class="ptp-bc-current" aria-current="page">${pastor.name}</span>
          </nav>

          <div class="ptp-profile-layout">
            <aside class="ptp-profile-aside">
              ${imageHTML}
              <div class="ptp-profile-aside-meta">
                <div class="ptp-profile-role">${pastor.role}</div>
                ${secondaryRoleHTML}
                <div class="ptp-profile-church">Centenary Baptist Church, Secunderabad</div>
              </div>
            </aside>

            <div class="ptp-profile-content">
              <h1 class="ptp-profile-name">${pastor.name}</h1>
              <div class="ptp-profile-divider" aria-hidden="true"></div>
              <div class="ptp-profile-bio">${bioParagraphs}</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  _setupAnimations() {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.1 });

    this.container.querySelectorAll('.fade-in-up').forEach(el => observer.observe(el));
  }
}
