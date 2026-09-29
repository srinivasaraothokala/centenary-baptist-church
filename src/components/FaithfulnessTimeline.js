import './FaithfulnessTimeline.css';
import { t } from '../i18n.js';
import { churchData } from '../data/churchData.js';
import { CampusSection } from './CampusSection.js';

export class FaithfulnessTimeline {
  constructor(containerSelector) {
    this.containerSelector = containerSelector;
    this.container = document.querySelector(containerSelector);
    this._campusInstance = null;
    if (!this.container) return;
    this.render();
    // Re-render on language change
    window.addEventListener('langChange', () => this.render());
  }

  render() {
    this.container = document.querySelector(this.containerSelector);
    if (!this.container) return;

    const { historyContent, milestones } = churchData;

    let milestonesHTML = '';
    milestones.forEach(m => {
      milestonesHTML += `
        <div class="fh-milestone">
          <div class="fh-m-year">${m.year}</div>
          <div class="fh-m-dot"></div>
          <div class="fh-m-desc">${m.desc}</div>
        </div>
      `;
    });

    this.container.innerHTML = `
      <section class="faith-history-section">
        <div class="fh-overlay"></div>
        <div class="wrap fh-wrap">
          
          <div class="fh-desktop-grid">
            <!-- LEFT COLUMN: HISTORY -->
            <div class="fh-history-col fade-in-up">
              <div class="fh-eyebrow">${t('fhEyebrow')}</div>
              <h2 class="fh-main-title">${t('fhMainTitle')}</h2>
              <div class="fh-accent-line"></div>
              
              <p class="fh-intro">${historyContent.intro}</p>
              
              <div class="fh-emunah-quote">
                <p>${historyContent.quote}</p>
              </div>
              
              <p class="fh-story">${historyContent.story1}</p>
              <p class="fh-story">${historyContent.story2}</p>
              
              <div class="fh-visual-moment">
                <div class="fh-vm-years">${t('fhVisualYears')}</div>
                <div class="fh-vm-150">${t('fhVisual150')}</div>
              </div>
            </div>
            
            <!-- RIGHT COLUMN: MILESTONES -->
            <div class="fh-milestones-col fade-in-up" style="animation-delay: 0.2s">
              <h3 class="fh-subheading">${t('fhMilestones')}</h3>
              <div class="fh-timeline-container">
                <div class="fh-timeline-line"></div>
                ${milestonesHTML}
              </div>
            </div>
          </div>
          
          <!-- BOTTOM SECTION: OUR CAMPUS -->
          <div id="fh-campus-container"></div>

        </div>
      </section>
    `;

    // Destroy old campus instance reference and create a new one
    // (CampusSection listens for langChange itself, no need to manage it here)
    new CampusSection('#fh-campus-container', {
      isSubSection: true,
      showTitle: true,
      showExploreLink: false
    });

    this._setupAnimations();
  }

  _setupAnimations() {
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
