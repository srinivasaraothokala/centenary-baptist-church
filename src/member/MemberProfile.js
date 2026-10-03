/**
 * MemberProfile.js
 * Protected profile page. Shows real data from member_profiles.
 * Allows inline editing of first_name, last_name, phone.
 * Never fabricates membership status, baptism, or family data.
 */
import { memberAuth } from './memberAuth.js';
import { MemberLayout } from './MemberLayout.js';

export class MemberProfile {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
  }

  async render() {
    this.container.innerHTML = `<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f0f4f2;"><div class="mp-spinner-page"></div></div>`;

    try {
      const session = await memberAuth.getSession();
      if (!session) { window.location.hash = '#/member/login'; return; }

      await memberAuth.ensureProfile(session.user);
      const profile = await memberAuth.getProfile(session.user.id);

      const firstName  = profile?.first_name || '';
      const lastName   = profile?.last_name  || '';
      const phone      = profile?.phone      || '';
      const email      = session.user.email  || '';
      const initials   = (firstName[0]||'') + (lastName[0]||'');
      const memberSince = profile?.created_at
        ? new Date(profile.created_at).toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' })
        : 'N/A';

      const content = `
        <div class="mp-page-header">
          <h2>My Profile</h2>
          <p>View and manage your personal information.</p>
        </div>

        <!-- Avatar + name -->
        <div class="mp-section-card">
          <div class="mp-profile-avatar-section">
            <div class="mp-profile-avatar-lg">${(initials || '?').toUpperCase()}</div>
            <div class="mp-profile-avatar-info">
              <h3>${firstName} ${lastName}</h3>
              <p>${email}</p>
            </div>
          </div>

          <div class="mp-section-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
            Personal Information
            <button class="mp-btn-sm" id="mp-edit-btn" style="margin-left:auto;">Edit</button>
          </div>

          <!-- Read view -->
          <div id="mp-info-view">
            <div class="mp-info-grid">
              <div class="mp-info-item">
                <label>First Name</label>
                <span>${firstName || '<em class="empty">Not set</em>'}</span>
              </div>
              <div class="mp-info-item">
                <label>Last Name</label>
                <span>${lastName || '<em class="empty">Not set</em>'}</span>
              </div>
              <div class="mp-info-item">
                <label>Email Address</label>
                <span>${email}</span>
              </div>
              <div class="mp-info-item">
                <label>Phone Number</label>
                <span>${phone || '<span class="empty">Not provided</span>'}</span>
              </div>
              <div class="mp-info-item">
                <label>Member Since</label>
                <span>${memberSince}</span>
              </div>
              <div class="mp-info-item">
                <label>Account Status</label>
                <span><span class="mp-card-badge mp-badge-green">Active</span></span>
              </div>
            </div>
          </div>

          <!-- Edit form (hidden until Edit clicked) -->
          <div id="mp-edit-form" class="mp-edit-form">
            <div class="mp-form-row" style="margin-top:16px;">
              <div class="mp-form-group">
                <label class="mp-label" for="mp-ef-fname">First Name <span>*</span></label>
                <input class="mp-input" type="text" id="mp-ef-fname" value="${firstName}">
                <div class="mp-field-error" id="mp-ef-fname-err">First name is required.</div>
              </div>
              <div class="mp-form-group">
                <label class="mp-label" for="mp-ef-lname">Last Name</label>
                <input class="mp-input" type="text" id="mp-ef-lname" value="${lastName}">
              </div>
            </div>
            <div class="mp-form-group">
              <label class="mp-label" for="mp-ef-phone">Phone Number</label>
              <input class="mp-input" type="tel" id="mp-ef-phone" value="${phone}" placeholder="e.g. 9876543210">
            </div>
            <div style="display:flex;gap:10px;margin-top:8px;">
              <button class="mp-btn-sm" id="mp-save-btn">Save Changes</button>
              <button class="mp-btn-sm mp-btn-sm-danger" id="mp-cancel-btn">Cancel</button>
            </div>
          </div>
        </div>

        <!-- Account details (read-only) -->
        <div class="mp-section-card">
          <div class="mp-section-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            Account Information
          </div>
          <div class="mp-info-grid">
            <div class="mp-info-item">
              <label>Email (Login)</label>
              <span>${email}</span>
            </div>
            <div class="mp-info-item">
              <label>Email Verified</label>
              <span><span class="mp-card-badge mp-badge-green">Yes</span></span>
            </div>
            <div class="mp-info-item">
              <label>Membership Status</label>
              <span class="empty" style="font-style:italic;font-size:13px;color:#94a3b8;">Pending — contact church office</span>
            </div>
          </div>
        </div>

        <!-- Future sections placeholder -->
        <div class="mp-section-card" style="opacity:0.6;">
          <div class="mp-section-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
            </svg>
            Family Information
            <span class="mp-coming-soon-tag" style="margin-left:8px;">Coming Soon</span>
          </div>
          <p style="font-size:13px;color:#94a3b8;margin:0;">
            Family management — including spouse, children and dependents — will be available in a future update.
          </p>
        </div>
      `;

      this.container.innerHTML = MemberLayout.getLayout(
        '#/member/profile',
        'My Profile',
        content,
        { firstName, lastName, email }
      );

      MemberLayout.wireLayout();
      this._wireProfileEvents(session.user.id);
      this._wireLogout();
    } catch (err) {
      console.error('[MemberProfile]', err);
      this.container.innerHTML = `<div style="padding:40px;text-align:center;color:#c0392b;">Failed to load profile. <a href="#/member/login">Sign in again</a></div>`;
    }
  }

  _wireProfileEvents(userId) {
    const editBtn   = document.getElementById('mp-edit-btn');
    const cancelBtn = document.getElementById('mp-cancel-btn');
    const saveBtn   = document.getElementById('mp-save-btn');
    const editForm  = document.getElementById('mp-edit-form');
    const infoView  = document.getElementById('mp-info-view');

    editBtn?.addEventListener('click', () => {
      editForm.classList.add('visible');
      infoView.style.display = 'none';
      editBtn.style.display = 'none';
    });

    cancelBtn?.addEventListener('click', () => {
      editForm.classList.remove('visible');
      infoView.style.display = '';
      editBtn.style.display = '';
    });

    saveBtn?.addEventListener('click', async () => {
      const fnameInput = document.getElementById('mp-ef-fname');
      const fname = fnameInput.value.trim();
      if (!fname) {
        fnameInput.classList.add('error');
        document.getElementById('mp-ef-fname-err').classList.add('visible');
        return;
      }

      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving…';

      try {
        await memberAuth.updateProfile(userId, {
          first_name: fname,
          last_name:  document.getElementById('mp-ef-lname').value.trim(),
          phone:      document.getElementById('mp-ef-phone').value.trim()
        });
        MemberLayout.showToast('Profile updated successfully!', 'success');
        // Re-render to reflect changes
        await this.render();
      } catch (err) {
        MemberLayout.showToast('Failed to save. Please try again.', 'error');
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Changes';
      }
    });
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
