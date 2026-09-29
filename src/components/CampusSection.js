import { API_BASE } from '../apiConfig.js';
import './CampusSection.css';
import { t } from '../i18n.js';
import { churchData } from '../data/churchData.js';

const API_URL = `${API_BASE}/campus`;

export class CampusSection {
  constructor(containerSelector, options = {}) {
    this.containerSelector = containerSelector;
    this.container = document.querySelector(containerSelector);
    this.options = Object.assign({
      isSubSection: false,
      showTitle: true,
      showExploreLink: true
    }, options);
    this.campuses = [];

    if (this.container) {
      this.init();
      window.addEventListener('langChange', () => this.render());
    }
  }

  async init() {
    try {
      const res = await fetch(API_URL);
      if (res.ok) {
        const data = await res.json();
        this.campuses = data.filter(c => c.is_active);
      } else {
        throw new Error('API unavailable');
      }
    } catch {
      // Fallback to static churchData
      this.campuses = churchData.campus.map((c, i) => ({
        id: i,
        title: c.title,
        short_desc: c.desc,
        icon: c.icon || '🏛',
        image_url: null,
        slug: c.id,
        is_active: true,
        sort_order: i + 1
      }));
    }
    this.render();
  }

  render() {
    this.container = document.querySelector(this.containerSelector);
    if (!this.container) return;

    let campusHTML = '';
    this.campuses.forEach(c => {
      campusHTML += `
        <a href="#/campus/${c.slug}" class="campus-card">
          ${c.image_url ? `<div class="campus-card-img" style="background-image: url('${c.image_url}')"></div>` : ''}
          <div class="campus-card-content">
            <h4 class="campus-card-title">${c.icon ? c.icon + ' ' : ''}${c.title}</h4>
            <p class="campus-card-desc">${c.short_desc || ''}</p>
            ${c.address ? `<div style="font-size:11px;color:#94a3b8;margin-top:4px;">📍 ${c.address}</div>` : ''}
            <div class="campus-card-action">${t('campusLearnMore')}</div>
          </div>
        </a>
      `;
    });

    const wrapperClass = this.options.isSubSection ? 'campus-section subsection' : 'campus-section full-section';

    let headerHTML = '';
    if (this.options.showTitle) {
      headerHTML = `
        <div class="campus-header fade-in-up">
          <h3 class="campus-subheading text-center">${t('campusTitle')}</h3>
          <p class="campus-subtitle text-center">${t('campusSubtitle')}</p>
        </div>
      `;
    }

    let footerHTML = '';
    if (this.options.showExploreLink) {
      footerHTML = `
        <div class="campus-footer fade-in-up" style="animation-delay: 0.2s">
          <a href="#/about/our-campus" class="btn-explore-campus">${t('campusExplore')}</a>
        </div>
      `;
    }

    this.container.innerHTML = `
      <div class="${wrapperClass}">
        <div class="wrap">
          ${headerHTML}
          <div class="campus-grid fade-in-up" style="animation-delay: 0.1s">
            ${campusHTML}
          </div>
          ${footerHTML}
        </div>
      </div>
    `;

    this._setupAnimations();
  }

  _setupAnimations() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('visible');
      });
    }, { threshold: 0.1 });

    this.container.querySelectorAll('.fade-in-up').forEach(el => observer.observe(el));
  }
}
