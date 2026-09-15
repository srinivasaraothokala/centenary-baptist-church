/**
 * Centenary Baptist Church — Main Application Script
 *
 * Handles all client-side interactivity:
 *  - Mobile navigation toggle
 *  - "Under production" notices for incomplete features
 *  - Smooth scroll behaviour
 */

import './style.css';

/* ────────────────────────────────────────────────
 * Constants
 * ──────────────────────────────────────────────── */

const PRODUCTION_NOTICE =
  'This feature is currently under production. We will get back to you soon!';

const Selectors = {
  MOBILE_MENU_BTN: '#mobile-menu-btn',
  NAV_LINKS: '#nav-links',
  ALL_BUTTONS: '.btn',
  FILTER_BUTTONS: '.filter-btn',
  SERMON_CARDS: '.sermon-card',
  AMOUNT_PILLS: '.give-amt',
};

/* ────────────────────────────────────────────────
 * Utility helpers
 * ──────────────────────────────────────────────── */

/**
 * Shorthand for document.querySelector.
 * @param {string} selector - CSS selector
 * @param {Element} [parent=document] - Parent element to search within
 * @returns {Element|null}
 */
const $ = (selector, parent = document) => parent.querySelector(selector);

/**
 * Shorthand for document.querySelectorAll (returns a real Array).
 * @param {string} selector - CSS selector
 * @param {Element} [parent=document] - Parent element to search within
 * @returns {Element[]}
 */
const $$ = (selector, parent = document) =>
  Array.from(parent.querySelectorAll(selector));

/**
 * Show the "under production" alert and prevent default link/button behaviour.
 * @param {Event} event
 */
function showProductionNotice(event) {
  event.preventDefault();
  alert(PRODUCTION_NOTICE);
}

/* ────────────────────────────────────────────────
 * Feature: Mobile Navigation
 * ──────────────────────────────────────────────── */

function initMobileMenu() {
  const menuBtn = $(Selectors.MOBILE_MENU_BTN);
  const navLinks = $(Selectors.NAV_LINKS);

  if (!menuBtn || !navLinks) return;

  menuBtn.addEventListener('click', () => {
    navLinks.classList.toggle('active');
  });

  // Close the mobile menu when any nav link is tapped
  $$(Selectors.NAV_LINKS + ' a').forEach((link) => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('active');
    });
  });
}

/* ────────────────────────────────────────────────
 * Feature: Under-Production Notices
 *
 * Intercepts clicks on interactive elements that
 * are not yet wired to a backend and shows a
 * friendly "coming soon" message.
 * ──────────────────────────────────────────────── */

function initProductionNotices() {
  // Nav links
  $$(Selectors.NAV_LINKS + ' a').forEach((link) => {
    link.addEventListener('click', showProductionNotice);
  });

  // All .btn elements that are local anchors (href starts with #)
  $$(Selectors.ALL_BUTTONS).forEach((btn) => {
    const href = btn.getAttribute('href');
    if (href && href.startsWith('#')) {
      btn.addEventListener('click', showProductionNotice);
    }
  });

  // Sermon filter pills
  $$(Selectors.FILTER_BUTTONS).forEach((btn) => {
    btn.addEventListener('click', showProductionNotice);
  });

  // Donation amount pills
  $$(Selectors.AMOUNT_PILLS).forEach((pill) => {
    pill.addEventListener('click', showProductionNotice);
  });
}

/* ────────────────────────────────────────────────
 * Bootstrap
 * ──────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  initProductionNotices();
});
