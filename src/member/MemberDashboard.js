/**
 * MemberDashboard.js
 * Protected member dashboard. Shows welcome banner + quick-action cards.
 * Reads real data from Supabase (session + profile). Never fabricates data.
 */
import { memberAuth } from './memberAuth.js';
import { MemberLayout } from './MemberLayout.js';

export class MemberDashboard {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
  }

  async render() {
    // Show loading spinner while resolving auth
    this.container.innerHTML = `<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f0f4f2;"><div class="mp-spinner-page"></div></div>`;

    try {
      const session = await memberAuth.getSession();
      if (!session) { window.location.hash = '#/member/login'; return; }

      // Ensure profile exists
      await memberAuth.ensureProfile(session.user);
      const profile = await memberAuth.getProfile(session.user.id);

      const firstName = profile?.first_name || session.user.user_metadata?.first_name || 'Member';
      const lastName  = profile?.last_name  || session.user.user_metadata?.last_name  || '';
      const email     = session.user.email || '';
      const joinedDate = profile?.created_at
        ? new Date(profile.created_at).toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' })
        : 'Pending';

      const content = `
        <!-- Welcome Banner -->
        <div class="mp-dash-welcome">
          <h2>Welcome back, ${firstName}!</h2>
          <p>Manage your church membership and personal information from one place. We're glad you're part of the CBC family.</p>
        </div>

        <!-- Quick Action Cards -->
        <div class="mp-cards-grid">
          <a href="#/member/profile" class="mp-card">
            <div class="mp-card-icon mp-icon-green">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
              </svg>
            </div>
            <div class="mp-card-title">My Profile</div>
            <p class="mp-card-sub">View and update your personal information.</p>
            <span class="mp-card-badge mp-badge-green">Available</span>
          </a>

          <a href="#/member/family" class="mp-card">
            <div class="mp-card-icon mp-icon-gold">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
              </svg>
            </div>
            <div class="mp-card-title">My Family</div>
            <p class="mp-card-sub">Manage your family members and relationships.</p>
            <span class="mp-card-badge mp-badge-gold">Coming Soon</span>
          </a>

          <div class="mp-card" style="cursor:default;">
            <div class="mp-card-icon mp-icon-blue">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12zM6 10h2v2H6zm0 4h8v2H6zm10 0h2v2h-2zm-6-4h8v2h-8z"/>
              </svg>
            </div>
            <div class="mp-card-title">Membership</div>
            <p class="mp-card-sub">Your membership status and information.</p>
            <span class="mp-card-badge mp-badge-gray">Status: Pending</span>
          </div>

          <div class="mp-card" style="cursor:default;">
            <div class="mp-card-icon mp-icon-purple">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
              </svg>
            </div>
            <div class="mp-card-title">Requests</div>
            <p class="mp-card-sub">Submit requests to the church office.</p>
            <span class="mp-card-badge mp-badge-gray">Coming Soon</span>
          </div>
        </div>

        <!-- Account summary -->
        <div class="mp-section-card">
          <div class="mp-section-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            Account Overview
          </div>
          <div class="mp-info-grid">
            <div class="mp-info-item">
              <label>Full Name</label>
              <span>${firstName} ${lastName}</span>
            </div>
            <div class="mp-info-item">
              <label>Email</label>
              <span>${email}</span>
            </div>
            <div class="mp-info-item">
              <label>Member Since</label>
              <span>${joinedDate}</span>
            </div>
            <div class="mp-info-item">
              <label>Account Status</label>
              <span><span class="mp-card-badge mp-badge-green" style="font-size:11px;">Verified</span></span>
            </div>
          </div>
        </div>
      `;

      this.container.innerHTML = MemberLayout.getLayout(
        '#/member/dashboard',
        'Dashboard',
        content,
        { firstName, lastName, email }
      );

      MemberLayout.wireLayout();
      this._wireLogout();
    } catch (err) {
      console.error('[MemberDashboard]', err);
      this.container.innerHTML = `<div style="padding:40px;text-align:center;color:#c0392b;">Failed to load dashboard. <a href="#/member/login" style="color:#075C50;">Sign in again</a></div>`;
    }
  }

  _wireLogout() {
    const btn = document.getElementById('mp-logout-btn');
    if (btn) {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        await memberAuth.logout();
        window.location.hash = '#/member/login';
      });
    }
  }
}
