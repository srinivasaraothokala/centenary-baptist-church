import { API_BASE } from '../apiConfig.js';

/**
 * Cookie Consent Manager
 * Handles the logic for retrieving, setting, and checking analytics cookie consent.
 * Connects with the global site settings API if available.
 */

const STORAGE_KEY = 'cbc_cookie_consent_v1';

/**
 * Gets the current consent state from localStorage.
 * @returns {boolean|null} true if accepted, false if rejected, null if no choice made.
 */
export function getAnalyticsConsent() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      return parsed.analytics;
    } catch (e) {
      return null;
    }
  }
  return null;
}

/**
 * Checks if the user has explicitly accepted analytics.
 * @returns {boolean}
 */
export function hasAnalyticsConsent() {
  return getAnalyticsConsent() === true;
}

/**
 * Sets the analytics consent state.
 * @param {boolean} value 
 */
export function setAnalyticsConsent(value) {
  const state = {
    analytics: !!value,
    updatedAt: new Date().toISOString()
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  
  if (value) {
    initializeAnalytics();
  } else {
    // If revoked, we can't easily "un-initialize" without a page reload, 
    // but we can stop future tracking if the provider supports it.
    // For now, no-op since there is no provider.
  }
}

/**
 * Clears the stored consent.
 */
export function clearAnalyticsConsent() {
  localStorage.removeItem(STORAGE_KEY);
}

let analyticsInitialized = false;

/**
 * Initializes the analytics provider (Google Analytics 4).
 * This MUST ONLY be called if `hasAnalyticsConsent()` is true.
 * @param {boolean} skipPageView If true, skips sending the initial page view event.
 */
export function initializeAnalytics(skipPageView = false) {
  if (!hasAnalyticsConsent()) return;
  
  const gaId = import.meta.env.VITE_GA_MEASUREMENT_ID;
  if (!gaId) {
    console.warn('[Analytics] VITE_GA_MEASUREMENT_ID is not set in environment.');
    return;
  }

  if (analyticsInitialized) return;
  
  // Dynamically inject the GA4 script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag(){window.dataLayer.push(arguments);}
  window.gtag = gtag;
  gtag('js', new Date());
  
  // Disable automatic page view tracking to manually handle SPA routes safely
  gtag('config', gaId, { send_page_view: false });

  analyticsInitialized = true;
  
  // Track initial page view (safe check inside trackPageView)
  if (!skipPageView) {
    trackPageView(window.location.hash || '#/');
  }
}

/**
 * Tracks SPA page views ensuring consent and route isolation.
 * @param {string} path The current route hash
 */
export function trackPageView(path) {
  if (!hasAnalyticsConsent()) return;
  
  // Initialize on the fly if consent exists but not yet initialized (e.g., page refresh)
  if (!analyticsInitialized) {
    initializeAnalytics(true);
  }
  
  // Admin and Member routes MUST remain isolated and untracked
  if (path.startsWith('#/admin') || path.startsWith('#/member')) {
    return;
  }
  
  const gaId = import.meta.env.VITE_GA_MEASUREMENT_ID;
  if (!gaId || !window.gtag) return;
  
  window.gtag('event', 'page_view', {
    page_path: path
  });
}

/**
 * Fetches the global settings for cookie consent from the server.
 * Returns defaults if the server is unreachable.
 */
export async function fetchCookieSettings() {
  try {
    const res = await fetch(`${API_BASE}/settings`);
    if (res.ok) {
      const data = await res.json();
      return data.settings?.legal || {};
    }
  } catch (err) {
    console.warn('[Cookie Consent] Failed to fetch settings, using defaults.', err);
  }
  return {};
}

// Automatically initialize if consent was previously given
if (typeof window !== 'undefined' && hasAnalyticsConsent()) {
  initializeAnalytics(true);
}
