/**
 * MemberResetPassword.js
 * Handles the password-reset callback from Supabase's reset email.
 *
 * When a user clicks the reset link in their email, Supabase redirects them to:
 *   <site-url>#/member/reset-password
 * and simultaneously fires an onAuthStateChange event with event = 'PASSWORD_RECOVERY'.
 * The router catches #/member/reset-password and renders this page.
 * The user is in an authenticated recovery session at this point.
 *
 * The user sets a new password → supabase.auth.updateUser({ password }) →
 * session is upgraded to a full session → redirect to dashboard.
 */
import { memberAuth } from './memberAuth.js';
import './member.css';

export class MemberResetPassword {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
  }

  async render() {
    // Verify we actually have a recovery session
    const session = await memberAuth.getSession();

    this.container.innerHTML = `
      <div class="mp-auth-page">
        <div class="mp-auth-card">
          <div class="mp-auth-logo">
            <img src="/logo-150.png" alt="Centenary Baptist Church" onerror="this.style.display='none'">
            <div class="mp-auth-logo-name">Centenary Baptist Church</div>
          </div>

          <h1 class="mp-auth-heading">Set New Password</h1>
          <p class="mp-auth-sub">Choose a strong new password for your account.</p>

          <div class="mp-alert mp-alert-error"   id="mrp-alert"   role="alert"></div>
          <div class="mp-alert mp-alert-success"  id="mrp-success" role="status"></div>

          ${!session ? `
            <div class="mp-alert mp-alert-error visible" role="alert">
              This password reset link is invalid or has expired.
              <br><br>
              <a href="#/member/forgot-password" style="color:#075C50;font-weight:700;">
                Request a new reset link
              </a>
            </div>
          ` : `
            <form id="mrp-form" novalidate>
              <div class="mp-form-group">
                <label class="mp-label" for="mrp-password">New Password <span>*</span></label>
                <div class="mp-input-wrap">
                  <input class="mp-input" type="password" id="mrp-password"
                    placeholder="Min. 8 characters" autocomplete="new-password" required>
                  <button type="button" class="mp-eye-btn" id="mrp-eye1" aria-label="Show password">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                    </svg>
                  </button>
                </div>
                <div class="mp-field-error" id="mrp-pw-err">Password must be at least 8 characters.</div>
              </div>

              <div class="mp-form-group">
                <label class="mp-label" for="mrp-confirm">Confirm New Password <span>*</span></label>
                <div class="mp-input-wrap">
                  <input class="mp-input" type="password" id="mrp-confirm"
                    placeholder="Re-enter new password" autocomplete="new-password" required>
                  <button type="button" class="mp-eye-btn" id="mrp-eye2" aria-label="Show password">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                    </svg>
                  </button>
                </div>
                <div class="mp-field-error" id="mrp-confirm-err">Passwords do not match.</div>
              </div>

              <!-- Password strength hint -->
              <p style="font-size:11.5px;color:#64748b;margin:-6px 0 14px;line-height:1.5;">
                Use at least 8 characters, including a mix of letters and numbers.
              </p>

              <button type="submit" class="mp-btn-primary" id="mrp-submit">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                Update Password
              </button>
            </form>
          `}

          <hr class="mp-auth-divider">
          <div class="mp-auth-links">
            <a href="#/member/login">← Back to Sign In</a>
          </div>
        </div>
      </div>
    `;

    if (session) this._bindEvents();
  }

  _bindEvents() {
    // Eye toggles
    const toggle = (btnId, inputId) => {
      document.getElementById(btnId)?.addEventListener('click', () => {
        const el = document.getElementById(inputId);
        if (el) el.type = el.type === 'text' ? 'password' : 'text';
      });
    };
    toggle('mrp-eye1', 'mrp-password');
    toggle('mrp-eye2', 'mrp-confirm');

    // Clear errors on input
    ['mrp-password', 'mrp-confirm'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', () => {
        document.getElementById(id)?.classList.remove('error');
        document.getElementById(id + (id === 'mrp-password' ? '-err' : '-err'))?.classList.remove('visible');
        document.getElementById('mrp-alert')?.classList.remove('visible');
      });
    });
    document.getElementById('mrp-password')?.addEventListener('input', () => {
      document.getElementById('mrp-pw-err')?.classList.remove('visible');
    });
    document.getElementById('mrp-confirm')?.addEventListener('input', () => {
      document.getElementById('mrp-confirm-err')?.classList.remove('visible');
    });

    document.getElementById('mrp-form')?.addEventListener('submit', (e) => this._handleSubmit(e));
  }

  async _handleSubmit(e) {
    e.preventDefault();

    const pwInput  = document.getElementById('mrp-password');
    const confInput = document.getElementById('mrp-confirm');
    const pw        = pwInput.value;
    const conf      = confInput.value;
    const btn       = document.getElementById('mrp-submit');
    const alertEl   = document.getElementById('mrp-alert');
    const successEl = document.getElementById('mrp-success');

    // Reset state
    alertEl.classList.remove('visible');
    successEl.classList.remove('visible');
    pwInput.classList.remove('error');
    confInput.classList.remove('error');
    document.getElementById('mrp-pw-err').classList.remove('visible');
    document.getElementById('mrp-confirm-err').classList.remove('visible');

    // Validate
    let valid = true;
    if (!pw || pw.length < 8) {
      pwInput.classList.add('error');
      document.getElementById('mrp-pw-err').classList.add('visible');
      valid = false;
    }
    if (!conf || pw !== conf) {
      confInput.classList.add('error');
      document.getElementById('mrp-confirm-err').classList.add('visible');
      valid = false;
    }
    if (!valid) return;

    btn.disabled = true;
    btn.innerHTML = '<span class="mp-spinner"></span> Updating password&hellip;';

    try {
      await memberAuth.updatePassword(pw);

      successEl.textContent = 'Password updated successfully! Redirecting to your dashboard…';
      successEl.classList.add('visible');
      btn.innerHTML = 'Password Updated ✓';

      setTimeout(async () => {
        // Ensure profile exists then go to dashboard
        const session = await memberAuth.getSession();
        if (session?.user) {
          await memberAuth.ensureProfile(session.user);
        }
        window.location.hash = '#/member/dashboard';
      }, 2000);

    } catch (err) {
      console.warn('[MemberResetPassword] updatePassword error:', err.code || err.message);
      const userMsg = err.message?.includes('same_password')
        ? 'Your new password must be different from your current password.'
        : err.message?.includes('session')
          ? 'Your reset link has expired. Please request a new one.'
          : 'Unable to update your password. Please try again or request a new reset link.';

      alertEl.textContent = userMsg;
      alertEl.classList.add('visible');
      btn.disabled = false;
      btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg> Update Password`;
    }
  }
}
