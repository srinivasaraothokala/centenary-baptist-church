import { API_BASE } from './apiConfig.js';

let settingsRequest;

// Only accept fully-qualified http/https URLs (e.g. Supabase storage URLs).
// Relative paths and empty values are intentionally rejected so they do
// not overwrite the working default /new-logo.png and /home_page.png.
const isAbsoluteHttpUrl = (value) => {
  if (!value || typeof value !== 'string') return '';
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : '';
  } catch {
    return '';
  }
};

// Swap an image src only after confirming the new URL loads successfully.
const safeSwapSrc = (element, newSrc) => {
  if (!element || !newSrc) return;
  const probe = new Image();
  probe.onload = () => { element.src = newSrc; };
  // On error, silently keep the existing src (the bundled default).
  probe.src = newSrc;
};

const setText = (selector, value) => {
  const element = document.querySelector(selector);
  if (element && value) element.textContent = value;
};

const setMeta = (selector, value) => {
  const element = document.querySelector(selector);
  if (element && value) element.setAttribute('content', value);
};

export function getSiteSettings() {
  if (!settingsRequest) {
    settingsRequest = fetch(`${API_BASE}/settings`)
      .then(async (response) => {
        if (!response.ok) throw new Error(`Settings request failed (${response.status})`);
        const data = await response.json();
        return data.settings || {};
      })
      .catch((error) => {
        console.warn('[Site settings] Could not load public settings.', error);
        return {};
      });
  }
  return settingsRequest;
}

function setSafeLink(selector, value, { hideWhenEmpty = false } = {}) {
  const element = document.querySelector(selector);
  if (!element) return;

  const url = isHttpUrl(value);
  if (url) {
    element.href = url;
    element.hidden = false;
  } else if (hideWhenEmpty) {
    element.hidden = true;
  }
}

function maintenanceIsActive(maintenance = {}) {
  if (!maintenance.enabled) return false;
  const now = Date.now();
  const start = maintenance.startDate ? Date.parse(maintenance.startDate) : NaN;
  const end = maintenance.endDate ? Date.parse(maintenance.endDate) : NaN;
  return (Number.isNaN(start) || now >= start) && (Number.isNaN(end) || now <= end);
}

function showMaintenancePage(maintenance) {
  if (window.location.hash.startsWith('#/admin') || !maintenanceIsActive(maintenance)) return;
  if (document.getElementById('site-maintenance-page')) return;

  const page = document.createElement('section');
  page.id = 'site-maintenance-page';
  page.className = 'site-maintenance-page';
  page.setAttribute('role', 'status');

  const content = document.createElement('div');
  content.className = 'site-maintenance-content';
  const title = document.createElement('h1');
  title.textContent = 'We’ll be back soon';
  const message = document.createElement('p');
  message.textContent = maintenance.message || 'We are currently performing scheduled maintenance. Please check back shortly.';
  content.append(title, message);
  page.append(content);
  document.body.append(page);
  document.body.classList.add('site-in-maintenance');
}

export function applyPublicSettings(settings = {}) {
  const church = settings.church || {};
  const contact = settings.contact || {};
  const social = settings.social || {};
  const footer = settings.footer || {};
  const appearance = settings.appearance || {};
  const seo = settings.seo || {};
  const languages = settings.languages || {};

  if (church.name) {
    setText('.footer-brand .brand-name', church.name);
    const logo = document.querySelector('.brand-seal');
    if (logo) logo.alt = `${church.name} Logo`;
  }
  setText('.footer-brand .brand-desc', footer.description || church.description);

  const address = [contact.address, contact.city, contact.state, contact.pinCode, contact.country]
    .filter(Boolean)
    .join(', ');
  setText('.footer-contact > p:nth-of-type(1)', footer.address || address);

  const footerEmail = footer.email || contact.email;
  const emailLink = document.querySelector('.footer-contact > p:nth-of-type(2) a');
  if (emailLink && footerEmail) {
    emailLink.textContent = footerEmail;
    emailLink.href = `mailto:${encodeURIComponent(footerEmail)}`;
  }
  setText('.footer-contact > p:nth-of-type(3)', (footer.phone || contact.phone) ? `Phone: ${footer.phone || contact.phone}` : '');

  const copyright = footer.copyright?.replaceAll('{year}', String(new Date().getFullYear()));
  setText('.footer-maroon-bottom .fine', copyright || (church.name ? `© ${new Date().getFullYear()} ${church.name}. All rights reserved.` : ''));

  const socialLinks = {
    Facebook: social.facebook,
    YouTube: social.youtube,
    Instagram: social.instagram,
  };
  const hasSocialConfiguration = social.showIcons !== undefined || Object.values(socialLinks).some((value) => value !== undefined);
  Object.entries(socialLinks).forEach(([label, url]) => {
    setSafeLink(`.social-links a[aria-label="${label}"]`, url, { hideWhenEmpty: social.showIcons === false || Boolean(url) });
  });
  const socialContainer = document.querySelector('.footer-brand .social-links');
  if (socialContainer && (social.showIcons === false || (hasSocialConfiguration && !Object.values(socialLinks).some(Boolean)))) {
    socialContainer.hidden = true;
  }

  const colorMap = {
    primaryColor: '--primary-green',
    secondaryColor: '--primary-maroon',
    accentColor: '--secondary-gold',
  };
  Object.entries(colorMap).forEach(([key, variable]) => {
    if (appearance[key]) document.documentElement.style.setProperty(variable, appearance[key]);
  });

  const hero = document.querySelector('.hero-bg');
  safeSwapSrc(hero, isAbsoluteHttpUrl(appearance.defaultHeroImage));
  const logo = document.querySelector('.brand-seal');
  safeSwapSrc(logo, isAbsoluteHttpUrl(church.logo));
  const favicon = isAbsoluteHttpUrl(church.favicon);
  if (favicon) document.querySelectorAll('link[rel~="icon"], link[rel="shortcut icon"]').forEach((link) => { link.href = favicon; });

  const title = seo.title || (church.name ? `${church.name}${church.establishedYear ? ` | Est. ${church.establishedYear}` : ''}` : '');
  if (title) document.title = title;
  const description = seo.description || church.description;
  setMeta('meta[name="description"]', description);
  setMeta('meta[property="og:title"]', title);
  setMeta('meta[property="og:description"]', description);
  setMeta('meta[name="twitter:title"]', title);
  setMeta('meta[name="twitter:description"]', description);
  const shareImage = isHttpUrl(seo.image || appearance.defaultOgImage);
  setMeta('meta[property="og:image"]', shareImage);
  setMeta('meta[name="twitter:image"]', shareImage);
  setMeta('meta[name="google-site-verification"]', seo.googleVerification);

  if (languages.enabled === false) {
    const languageSwitch = document.querySelector('.lang-switch');
    if (languageSwitch) languageSwitch.hidden = true;
  } else {
    const languageVisibility = { en: languages.english, te: languages.telugu, hi: languages.hindi };
    document.querySelectorAll('.lang-btn[data-lang]').forEach((button) => {
      if (languageVisibility[button.dataset.lang] === false) button.hidden = true;
    });
  }

  showMaintenancePage(settings.maintenance || {});
}

export async function initializePublicSettings() {
  const settings = await getSiteSettings();
  applyPublicSettings(settings);
  return settings;
}
