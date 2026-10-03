/**
 * MemberSettings.js
 * Protected member settings page.
 * Sections: Account info, Security (change password), Privacy.
 * Only implements functionality supported by Supabase Auth.
 */
import { memberAuth } from './memberAuth.js';
import { MemberLayout } from './MemberLayout.js';

export class MemberSettings {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
  }

  async render() {
    this.container.innerHTML = `<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f0f4f2;"><div class="mp-spinner-page"></div></div>`;

    const session = await memberAuth.getSession();
    if (!session) { window.location.hash = '#/member/login'; return; }

    const profile = await memberAuth.getProfile(session.user.id);
    const firstName = profile?.first_name || '';
    const lastName  = profile?.last_name  || '';
    const email     = session.user.email  || '';

    const content = `
      <div class="mp-page-header">
        <h2>Settings</h2>
        <p>Manage your account preferences and security.</p>
      </div>

      <!-- Account section -->
      <div class="mp-section-card">
        <div class="mp-section-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
          </svg>
          Account
        </div>

        <div class="mp-settings-item">
          <div>
            <p class="mp-settings-label">Email Address</p>
            <p class="mp-settings-value">${email}</p>
          </div>
          <span class="mp-card-badge mp-badge-green">Verified</span>
        </div>

        <div class="mp-settings-item">
          <div>
            <p class="mp-settings-label">Full Name</p>
            <p class="mp-settings-value">${firstName} ${lastName}</p>
          </div>
          <a href="#/member/profile" class="mp-btn-sm">Edit</a>
        </div>

        <div class="mp-settings-item">
          <div>
            <p class="mp-settings-label">Account Status</p>
            <p class="mp-settings-value">Active member account</p>
          </div>
          <span class="mp-card-badge mp-badge-green">Active</span>
        </div>
      </div>

      <!-- Security section -->
      <div class="mp-section-card">
        <div class="mp-section-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          Security
        </div>

        <!-- Change Password -->
        <div class="mp-settings-item">
          <div>
            <p class="mp-settings-label">Password</p>
            <p class="mp-settings-value">Change your account password via email reset link.</p>
          </div>
          <button class="mp-btn-sm" id="ms-change-pw-btn">Change Password</button>
        </div>

        <!-- Change password inline form -->
        <div id="ms-pw-section" style="display:none;padding:20px 0 8px;border-top:1px solid #f1f5f9;margin-top:8px;">
          <div class="mp-alert mp-alert-error" id="ms-pw-alert" role="alert"></div>
          <div class="mp-alert mp-alert-success" id="ms-pw-success" role="status"></div>

          <div class="mp-form-group">
            <label class="mp-label" for="ms-new-pw">New Password <span>*</span></label>
            <div class="mp-input-wrap">
              <input class="mp-input" type="password" id="ms-new-pw" placeholder="Min. 8 characters">
              <button type="button" class="mp-eye-btn" id="ms-eye1" aria-label="Show password">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                </svg>
              </button>
            </div>
            <div class="mp-field-error" id="ms-pw-err">Password must be at least 8 characters.</div>
          </div>

          <div class="mp-form-group">
            <label class="mp-label" for="ms-confirm-pw">Confirm New Password <span>*</span></label>
            <div class="mp-input-wrap">
              <input class="mp-input" type="password" id="ms-confirm-pw" placeholder="Re-enter new password">
              <button type="button" class="mp-eye-btn" id="ms-eye2" aria-label="Show password">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                </svg>
              </button>
            </div>
            <div class="mp-field-error" id="ms-confirm-err">Passwords do not match.</div>
          </div>

          <div style="display:flex;gap:10px;">
            <button class="mp-btn-sm" id="ms-save-pw-btn">Update Password</button>
            <button class="mp-btn-sm mp-btn-sm-danger" id="ms-cancel-pw-btn">Cancel</button>
          </div>
        </div>

        <!-- Logout -->
        <div class="mp-settings-item" style="border-bottom:none;">
          <div>
            <p class="mp-settings-label">Sign Out</p>
            <p class="mp-settings-value">Sign out of your member account on this device.</p>
          </div>
          <button class="mp-btn-sm mp-btn-sm-danger" id="ms-logout-btn">Sign Out</button>
        </div>
      </div>

      <!-- Privacy section -->
      <div class="mp-section-card">
        <div class="mp-section-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          Privacy
        </div>
        <p style="font-size:13.5px;color:#64748b;line-height:1.7;margin:0;">
          Your personal information is stored securely and is only accessible by you and authorized church staff.
          We do not share your data with third parties. Your information is used solely for church membership
          management and communication purposes.
        </p>
      </div>
    `;

    this.container.innerHTML = MemberLayout.getLayout(
      '#/member/settings',
      'Settings',
      content,
      { firstName, lastName, email }
    );

    MemberLayout.wireLayout();
    this._wireEvents(email);
    this._wireLogout();
  }

  _wireEvents(email) {
    // Show/hide change password section
    const changePwBtn = document.getElementById('ms-change-pw-btn');
    const pwSection   = document.getElementById('ms-pw-section');
    const cancelPwBtn = document.getElementById('ms-cancel-pw-btn');
    const savePwBtn   = document.getElementById('ms-save-pw-btn');

    changePwBtn?.addEventListener('click', () => {
      pwSection.style.display = 'block';
      changePwBtn.style.display = 'none';
    });
    cancelPwBtn?.addEventListener('click', () => {
      pwSection.style.display = 'none';
      changePwBtn.style.display = '';
    });

    // Eye toggles
    const eye1 = document.getElementById('ms-eye1');
    const eye2 = document.getElementById('ms-eye2');
    eye1?.addEventListener('click', () => {
      const inp = document.getElementById('ms-new-pw');
      inp.type = inp.type === 'text' ? 'password' : 'text';
    });
    eye2?.addEventListener('click', () => {
      const inp = document.getElementById('ms-confirm-pw');
      inp.type = inp.type === 'text' ? 'password' : 'text';
    });

    savePwBtn?.addEventListener('click', async () => {
      const pw      = document.getElementById('ms-new-pw').value;
      const confirm = document.getElementById('ms-confirm-pw').value;
      const pwErr   = document.getElementById('ms-pw-err');
      const confErr = document.getElementById('ms-confirm-err');
      const alert   = document.getElementById('ms-pw-alert');
      const success = document.getElementById('ms-pw-success');

      // Reset errors
      [pwErr, confErr, alert, success].forEach(el => el.classList.remove('visible'));
      document.getElementById('ms-new-pw').classList.remove('error');
      document.getElementById('ms-confirm-pw').classList.remove('error');

      let valid = true;
      if (!pw || pw.length < 8) {
        document.getElementById('ms-new-pw').classList.add('error');
        pwErr.classList.add('visible');
        valid = false;
      }
      if (!confirm || pw !== confirm) {
        document.getElementById('ms-confirm-pw').classList.add('error');
        confErr.classList.add('visible');
        valid = false;
      }
      if (!valid) return;

      savePwBtn.disabled = true;
      savePwBtn.textContent = 'Updating…';

      try {
        await memberAuth.updatePassword(pw);
        success.textContent = 'Password updated successfully!';
        success.classList.add('visible');
        document.getElementById('ms-new-pw').value = '';
        document.getElementById('ms-confirm-pw').value = '';
      } catch (err) {
        alert.textContent = 'Failed to update password. Please try again.';
        alert.classList.add('visible');
      } finally {
        savePwBtn.disabled = false;
        savePwBtn.textContent = 'Update Password';
      }
    });

    // Logout from settings
    document.getElementById('ms-logout-btn')?.addEventListener('click', async () => {
      await memberAuth.logout();
      window.location.hash = '#/member/login';
    });
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
