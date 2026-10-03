/**
 * MemberFamily.js
 * UI-ONLY placeholder for the future family management system.
 * NO database CRUD is implemented here.
 * Architecture is designed so CRUD can be added later without rebuilding.
 */
import { memberAuth } from './memberAuth.js';
import { MemberLayout } from './MemberLayout.js';

export class MemberFamily {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
  }

  async render() {
    this.container.innerHTML = `<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f0f4f2;"><div class="mp-spinner-page"></div></div>`;

    const session = await memberAuth.getSession();
    if (!session) { window.location.hash = '#/member/login'; return; }

    const profile = await memberAuth.getProfile(session.user.id);
    const firstName = profile?.first_name || 'Member';
    const lastName  = profile?.last_name  || '';

    const content = `
      <div class="mp-page-header">
        <h2>My Family</h2>
        <p>Manage your family members and relationships.</p>
      </div>

      <!-- Coming soon notice -->
      <div class="mp-section-card" style="border-left:4px solid #C58A2A;background:linear-gradient(to right,#fdf5e6,#fff);">
        <div style="display:flex;align-items:flex-start;gap:16px;">
          <div style="width:44px;height:44px;background:#fdf5e6;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C58A2A" stroke-width="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <div>
            <h3 style="font-family:'Playfair Display',serif;font-size:16px;color:#1e293b;margin:0 0 6px;">Family Management — Coming Soon</h3>
            <p style="font-size:13.5px;color:#64748b;margin:0;line-height:1.6;">
              We're building the family management system. Soon you'll be able to add your spouse, children,
              and other dependents to build your complete family profile within the church.
            </p>
          </div>
        </div>
      </div>

      <!-- Spouse section -->
      <div class="mp-section-card mp-family-section">
        <div class="mp-family-type-header">
          <h3>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="color:#C58A2A;">
              <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z"/>
            </svg>
            Spouse
          </h3>
          <button class="mp-btn-sm" disabled title="Coming soon" style="opacity:0.5;cursor:not-allowed;">
            + Add Spouse
            <span class="mp-coming-soon-tag" style="margin-left:6px;">Soon</span>
          </button>
        </div>
        <div class="mp-empty-family">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="1.5">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          <p>No spouse added yet. This feature will be available soon.</p>
        </div>
      </div>

      <!-- Children section -->
      <div class="mp-section-card mp-family-section">
        <div class="mp-family-type-header">
          <h3>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="color:#3b82f6;">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
            </svg>
            Children
          </h3>
          <button class="mp-btn-sm" disabled title="Coming soon" style="opacity:0.5;cursor:not-allowed;">
            + Add Child
            <span class="mp-coming-soon-tag" style="margin-left:6px;">Soon</span>
          </button>
        </div>
        <div class="mp-empty-family">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="1.5">
            <circle cx="12" cy="8" r="4"/><path d="M6 20v-2a6 6 0 0 1 12 0v2"/>
          </svg>
          <p>No children added yet. This feature will be available soon.</p>
        </div>
      </div>

      <!-- Dependents section -->
      <div class="mp-section-card mp-family-section">
        <div class="mp-family-type-header">
          <h3>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="color:#7c3aed;">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
            </svg>
            Dependents
          </h3>
          <button class="mp-btn-sm" disabled title="Coming soon" style="opacity:0.5;cursor:not-allowed;">
            + Add Dependent
            <span class="mp-coming-soon-tag" style="margin-left:6px;">Soon</span>
          </button>
        </div>
        <div class="mp-empty-family">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="1.5">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <p>No dependents added yet. This feature will be available soon.</p>
        </div>
      </div>
    `;

    this.container.innerHTML = MemberLayout.getLayout(
      '#/member/family',
      'My Family',
      content,
      { firstName, lastName, email: session.user.email }
    );

    MemberLayout.wireLayout();
    this._wireLogout();
  }

  _wireLogout() {
    const btn = document.getElementById('mp-logout-btn');
    if (btn) btn.addEventListener('click', async (e) => {
      e.preventDefault();
      await memberAuth.logout();
      window.location.hash = '#/member/login';
    });
  }
}
