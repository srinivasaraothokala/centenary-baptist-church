import './LeadershipSection.css';
import { t } from '../i18n.js';
import { churchData } from '../data/churchData.js';

export class LeadershipSection {
  constructor(containerSelector, options = {}) {
    this.containerSelector = containerSelector;
    this.container = document.querySelector(containerSelector);
    this.options = Object.assign({
      isSubSection: false,
      showTitle: true,
      showExploreLink: true
    }, options);

    if (this.container) {
      this.render();
      // Re-render on language change
      window.addEventListener('langChange', () => this.render());
    }
  }

  _getRoleKey(role) {
    // Map English role strings to i18n keys
    const roleMap = {
      'Senior Pastor': 'roleSeniorPastor',
      'Associate Pastor': 'roleAssociatePastor',
      'Church Pastor': 'roleChurchPastor',
      'President': 'rolePresident',
      'Secretary': 'roleSecretary',
      'Treasurer': 'roleTreasurer',
      'Deacons': 'roleDeacons',
      'Vice-President / Asst. Secretary / Asst. Treasurer': 'roleVicePresident'
    };
    return roleMap[role] || null;
  }

  _getNameKey(name) {
    // Map known English values to i18n keys
    const nameMap = {
      '12 members, incl. 2 women': 'deaconsValue',
      'To be confirmed by church office': 'tbc'
    };
    return nameMap[name] || null;
  }

  render() {
    this.container = document.querySelector(this.containerSelector);
    if (!this.container) return;

    const { pastoralTeam, executiveCommittee } = churchData;

    let pastoralHTML = '';
    pastoralTeam.forEach(p => {
      const roleKey = this._getRoleKey(p.role);
      const translatedRole = roleKey ? t(roleKey) : p.role;
      pastoralHTML += `
        <div class="pastor-card">
          ${p.image ? `<div class="pastor-card-img-wrap"><div class="pastor-card-img" style="background-image: url('${p.image}')"></div></div>` : ''}
          <div class="pastor-card-content">
            <div class="pastor-card-role">${translatedRole}</div>
            <h4 class="pastor-card-name">${p.name}</h4>
          </div>
        </div>
      `;
    });

    const midIndex = Math.ceil(executiveCommittee.length / 2);
    const col1 = executiveCommittee.slice(0, midIndex);
    const col2 = executiveCommittee.slice(midIndex);

    const renderCol = (items) => {
      let html = '';
      items.forEach(item => {
        const roleKey = this._getRoleKey(item.role);
        const translatedRole = roleKey ? t(roleKey) : item.role;
        const nameKey = this._getNameKey(item.name);
        const translatedName = nameKey ? t(nameKey) : item.name;
        html += `
          <div class="exec-list-item">
            <div class="exec-role">${translatedRole}</div>
            <div class="exec-name">${translatedName}</div>
          </div>
        `;
      });
      return html;
    };

    const wrapperClass = this.options.isSubSection ? 'leadership-section subsection' : 'leadership-section full-section';

    let headerHTML = '';
    if (this.options.showTitle) {
      headerHTML = `
        <div class="leadership-header text-center fade-in-up">
          <h2 class="leadership-main-title">${t('leadershipTitle')}</h2>
        </div>
      `;
    }

    let footerHTML = '';
    if (this.options.showExploreLink) {
      footerHTML = `
        <div class="leadership-footer text-center fade-in-up" style="animation-delay: 0.3s">
          <a href="#/leadership" class="btn-explore-leadership">${t('meetLeadership')}</a>
        </div>
      `;
    }

    this.container.innerHTML = `
      <section class="${wrapperClass}">
        <div class="wrap">
          ${headerHTML}
          
          <div class="pastoral-team-section fade-in-up" style="animation-delay: 0.1s">
            <h3 class="leadership-subheading text-center">${t('pastoralTeamTitle')}</h3>
            <div class="pastoral-grid">
              ${pastoralHTML}
            </div>
          </div>
          
          <div class="executive-committee-section fade-in-up" style="animation-delay: 0.2s">
            <h3 class="leadership-subheading text-center">${t('executiveCommitteeTitle')}</h3>
            <div class="exec-grid">
              <div class="exec-col">${renderCol(col1)}</div>
              <div class="exec-col">${renderCol(col2)}</div>
            </div>
          </div>

          ${footerHTML}
        </div>
      </section>
    `;

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
