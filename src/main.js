import { API_BASE } from './apiConfig.js';
import './style.css';
import { initI18n, t, getCurrentLang } from './i18n.js';
import { FirstTimeVisitorModal } from './components/VisitorModal.js';
import { AnnouncementBanner } from './components/AnnouncementBanner.js';
import { UpcomingEvents } from './components/UpcomingEvents.js';
import { MinistriesSection } from './components/MinistriesSection.js';
import { SermonsSection } from './components/SermonsSection.js';
import { GetInvolvedSection } from './components/GetInvolvedSection.js';
import { FinalCTASection } from './components/FinalCTASection.js';
import { ContactForm } from './components/ContactForm.js';
import { CampusSection } from './components/CampusSection.js';
import { LeadershipSection } from './components/LeadershipSection.js';
import { WelcomeSection } from './components/WelcomeSection.js';
import { HistoryPreviewSection } from './components/HistoryPreviewSection.js';
import { churchData } from './data/churchData.js';
import { Router } from './router.js';

const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => Array.from(parent.querySelectorAll(selector));

// ── Initializers ───────────────────────────────────────────
function initScrollEffects() {
  const header = document.querySelector('header');
  if (header) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 20) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    });
  }
}

// ── Build navigation labels from i18n ────────────────────────
function getNavData() {
  return [
    { label: t('navHome'), href: '#/' },
    {
      label: t('navAbout'), href: '#/about', dropdown: true,
      columns: [
        {
          title: t('navDiscoverGroup'),
          items: [
            { label: t('navOurStory'),      href: '#/about/our-story' },
            { label: t('navOurBeliefs'),    href: '#/about/our-beliefs' },
            { label: t('navMissionVision'), href: '#/about/mission-vision' },
            { label: t('navLeadership'),    href: '#/about/leadership' },
            { label: t('navContact'),       href: '#/visit/contact' }
          ]
        },
        {
          title: t('navHistoryGroup'),
          items: [
            { label: t('navFaithHistory'), href: '#/about/faith-history' },
            { label: t('nav150Years'),     href: '#/about/150-years' },
            { label: t('navMilestones'),   href: '#/about/milestones' },
            { label: t('navOurCampus'),    href: '#/about/our-campus' }
          ]
        }
      ]
    },
    {
      label: t('navWorship'), href: '#/worship', dropdown: true,
      columns: [
        {
          title: t('navWorshipGroup'),
          items: [
            { label: t('navSundayWorship'),  href: '#/worship/sunday-worship-info' },
            { label: t('navWorshipTimings'), href: '#/worship/timings' },
            { label: t('navSermons'),        href: '#/worship/sermons' },
            { label: t('navPrayer'),         href: '#/worship/prayer' },
            { label: t('navWatchLive'),      href: '#/worship/watch-live' }
          ]
        }
      ]
    },
    {
      label: t('navMinistries'), href: '#/ministries', dropdown: true,
      columns: [
        {
          title: t('navMinistriesGroup'),
          items: [
            { label: t('navChildren'),        href: '#/ministries/children' },
            { label: t('navYouth'),           href: '#/ministries/youth' },
            { label: t('navWomen'),           href: '#/ministries/women' },
            { label: t('navMen'),             href: '#/ministries/men' },
            { label: t('navMusicChoir'),      href: '#/ministries/music' },
            { label: t('navMissions'),        href: '#/ministries/missions' },
            { label: t('navMedicalMinistry'), href: '#/ministries/medical' },
            { label: t('navChurchSchool'),    href: '#/ministries/church-school' },
            { label: t('navOutreach'),        href: '#/ministries/outreach' }
          ]
        }
      ]
    },
    { label: t('navEvents'), href: '#/events' },
    { label: 'Gallery', href: '#/gallery' },
    {
      label: t('navVisit'), href: '#/visit', dropdown: true,
      columns: [
        {
          title: t('navVisitGroup'),
          items: [
            { label: t('navPlanVisit'), href: '#/visit/plan' },
            { label: t('navLocation'),  href: '#/visit/location' },
            { label: t('navNewHere'),   href: '#/visit/new-here', isAction: true },
            { label: t('navContact'),   href: '#/visit/contact' }
          ]
        }
      ]
    },
    { label: t('navGive'), href: '#/give' }
  ];
}

function renderNavigation() {
  const navContainer = $('#nav-links');
  if (!navContainer) return;

  const navData = getNavData();
  let html = '';

  navData.forEach(item => {
    if (item.dropdown) {
      html += `
        <div class="nav-item has-dropdown">
          <a href="${item.href}" class="nav-link">${item.label} <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg></a>
          <div class="mega-menu">
            <div class="mega-menu-inner">
              ${item.columns.map(col => `
                <div class="mega-col">
                  <h4>${col.title}</h4>
                  <ul>
                    ${col.items.map(sub => `
                      <li><a href="${sub.href}" class="${sub.isAction ? 'is-action' : ''}">${sub.label}</a></li>
                    `).join('')}
                  </ul>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `;
    } else {
      html += `<div class="nav-item"><a href="${item.href}" class="nav-link">${item.label}</a></div>`;
    }
  });

  navContainer.innerHTML = html;
  initMobileMenu(); // Re-wire mobile menu after re-render
}

function renderFooter() {
  const footerContainer = $('#main-footer');
  if (!footerContainer) return;

  const config = churchData.footerConfig;
  const year = new Date().getFullYear();
  const copyright = t(config.bottomBar.copyrightKey).replace('{year}', year);

  // Compact Top CTA Strip
  let html = `
    <div class="footer-cta fade-in-up">
      <div class="wrap footer-cta-inner">
        <div class="footer-cta-content">
          <h3 class="footer-cta-text">${t(config.cta.textKey)}</h3>
          <p class="footer-cta-sub">${t(config.cta.subKey)}</p>
        </div>
        <a href="${config.cta.btnHref}" class="btn btn-outline-round footer-btn">${t(config.cta.btnKey)}</a>
      </div>
    </div>
  `;

  html += `<div class="footer-main">
    <div class="wrap footer-grid fade-in-up" style="animation-delay: 0.1s">
      <!-- Column 1: Church Info -->
      <div class="footer-col footer-col-brand">
        <h2 class="footer-brand">${t(config.churchInfo.name)}</h2>
        <div class="footer-est">${t(config.churchInfo.est)}<br>${t(config.churchInfo.address)}</div>
        <p class="footer-desc">${t(config.churchInfo.desc)}</p>
      </div>
  `;

  // Dynamic Sections (Quick Links, Get Involved)
  config.sections.forEach(sec => {
    html += `
      <div class="footer-col">
        <h4 class="footer-heading">${t(sec.titleKey)}</h4>
        <ul class="footer-nav">
          ${sec.links.map(link => `<li><a href="${link.href}">${t(link.label)}</a></li>`).join('')}
        </ul>
      </div>
    `;
  });

  // Contact Column
  html += `
      <div class="footer-col footer-col-contact">
        <h4 class="footer-heading">${t(config.contact.titleKey)}</h4>
        <p class="footer-contact-address">${t(config.contact.address)}</p>
        <a href="mailto:${config.contact.email}" class="footer-email-link">${t(config.contact.emailLabelKey)}</a>
        
        <div class="footer-social">
          <h4 class="footer-heading">${t('footerFollowUs')}</h4>
          <div class="social-links">
            <a href="#" class="social-icon" aria-label="Facebook">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
            </a>
            <a href="#" class="social-icon" aria-label="Instagram">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
            </a>
            <a href="#" class="social-icon" aria-label="YouTube">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg>
            </a>
          </div>
        </div>
      </div>
    </div> <!-- .footer-grid -->
  </div> <!-- .footer-main -->
  `;

  // Bottom Bar
  html += `
    <div class="footer-bottom">
      <div class="wrap footer-bottom-inner">
        <div class="copyright">${copyright}</div>
        <div class="legal-links">
          ${config.bottomBar.links.map(link => `<a href="${link.href}">${t(link.label)}</a>`).join('')}
        </div>
      </div>
    </div>
  `;

  footerContainer.innerHTML = html;
  
  // Setup fade-in animations for footer
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1 });
  
  const animatedElements = footerContainer.querySelectorAll('.fade-in-up');
  animatedElements.forEach(el => observer.observe(el));
}

function initMobileMenu() {
  const menuBtn = $('#mobile-menu-btn');
  const navLinks = $('#nav-links');
  if (!menuBtn || !navLinks) return;

  // Remove old listeners by cloning the button
  const newBtn = menuBtn.cloneNode(true);
  menuBtn.parentNode.replaceChild(newBtn, menuBtn);

  newBtn.addEventListener('click', () => {
    navLinks.classList.toggle('active');
  });

  $$('.nav-item.has-dropdown > .nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      if (window.innerWidth <= 1024) {
        e.preventDefault();
        link.parentElement.classList.toggle('open');
      }
    });
  });

  $$('.mega-menu a, .nav-item:not(.has-dropdown) > a').forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 1024) {
        navLinks.classList.remove('active');
      }
    });
  });
}

function initModals() {
  const btnPlanVisit = $('#btn-plan-visit');
  if (btnPlanVisit) {
    const visitorModal = new FirstTimeVisitorModal();
    btnPlanVisit.addEventListener('click', (e) => {
      e.preventDefault();
      visitorModal.open();
    });
  }

  const modalHistory = $('#history-modal');
  const closeBtns = $$('.close-modal');
  closeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (modalHistory) modalHistory.classList.remove('active');
    });
  });

  window.addEventListener('click', (e) => {
    if (e.target === modalHistory) modalHistory.classList.remove('active');
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  // Fetch dynamic events
  try {
    const res = await fetch(`${API_BASE}/events`);
    if (res.ok) {
      churchData.events = await res.json();
      window.dispatchEvent(new Event('eventsUpdated'));
    }
    } catch (err) {
    console.error('Failed to load events:', err);
  }

  // Fetch dynamic sermons
  try {
    const res = await fetch(`${API_BASE}/sermons`);
    if (res.ok) {
      churchData.sermons = await res.json();
      window.dispatchEvent(new Event('sermonsUpdated'));
    }
  } catch (err) {
    console.error('Failed to load sermons:', err);
  }

  // Initialize i18n FIRST (reads localStorage, wires buttons)
  initI18n();

  // Render navigation and footer in chosen language
  renderNavigation();
  renderFooter();

  initModals();
  initScrollEffects();

  // Initialize SPA Router
  new Router();

  // Initialize JS-rendered sections (they self-subscribe to langChange)
  if (document.getElementById('home-announcement-banner')) {
    new AnnouncementBanner('home-announcement-banner');
  }
  if (document.getElementById('home-welcome-section')) {
    new WelcomeSection('home-welcome-section');
  }
  if (document.getElementById('home-history-preview')) {
    new HistoryPreviewSection('home-history-preview');
  }
  new LeadershipSection('#home-leadership-section');
  new CampusSection('#home-campus-section');
  new MinistriesSection('#home-ministries-section');
  new UpcomingEvents('#upcoming-events-section');
  new SermonsSection('#home-sermons-section');
  new GetInvolvedSection('#home-get-involved-section');
  if (document.querySelector('.home-contact-form-wrapper')) {
    new ContactForm('.home-contact-form-wrapper');
  }
  new FinalCTASection('#home-final-cta-section');

  // Re-render navigation + footer whenever language changes
  window.addEventListener('langChange', () => {
    renderNavigation();
    renderFooter();
  });

  // Hide the page loader now that everything is initialized
  const loader = document.getElementById('page-loader');
  if (loader) {
    // Small delay so the first render paints before we hide
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        loader.classList.add('hidden');
      });
    });
  }
});

