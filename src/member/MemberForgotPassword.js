/**
 * MemberForgotPassword.js
 * Password reset flow using Supabase Auth resetPasswordForEmail.
 * Two states: (1) enter email → send link, (2) reset-password (entered via email link).
 */
import { memberAuth } from './memberAuth.js';
import './member.css';

export class MemberForgotPassword {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
  }

  render() {
    this.container.innerHTML = `
      <div class="mp-auth-page">
        <div class="mp-auth-card">
          <div class="mp-auth-logo">
            <img src="/logo-150.png" alt="Centenary Baptist Church" onerror="this.style.display='none'">
            <div class="mp-auth-logo-name">Centenary Baptist Church</div>
          </div>

          <h1 class="mp-auth-heading">Forgot Password</h1>
          <p class="mp-auth-sub">Enter your account email. We'll send a secure reset link.</p>

          <div class="mp-alert mp-alert-error" id="mfp-alert" role="alert"></div>
          <div class="mp-alert mp-alert-success" id="mfp-success" role="status"></div>

          <!-- Step 1: Enter email -->
          <div id="mfp-step1">
            <form id="mfp-form" novalidate>
              <div class="mp-form-group">
                <label class="mp-label" for="mfp-email">Email Address <span>*</span></label>
                <input class="mp-input" type="email" id="mfp-email" placeholder="you@example.com" autocomplete="email" required>
                <div class="mp-field-error" id="mfp-email-err">Please enter a valid email address.</div>
              </div>

              <button type="submit" class="mp-btn-primary" id="mfp-submit">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                Send Reset Link
              </button>
            </form>
          </div>

          <!-- Step 2: Sent confirmation -->
          <div id="mfp-step2" style="display:none;text-align:center;">
            <div class="mp-verify-icon" style="margin:0 auto 16px;">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <p style="font-size:14px;color:#334155;line-height:1.7;">
              If this email is registered, you'll receive a password reset link shortly.
              <br><br>Click the link in the email to set a new password.
            </p>
          </div>

          <hr class="mp-auth-divider">
          <div class="mp-auth-links">
            <a href="#/member/login">← Back to Sign In</a>
          </div>
        </div>
      </div>
    `;
    this._bindEvents();
  }

  _bindEvents() {
    const emailInput = document.getElementById('mfp-email');
    emailInput.addEventListener('input', () => {
      emailInput.classList.remove('error');
      document.getElementById('mfp-email-err').classList.remove('visible');
      document.getElementById('mfp-alert').classList.remove('visible');
    });
    document.getElementById('mfp-form').addEventListener('submit', (e) => this._handleSubmit(e));
  }

  async _handleSubmit(e) {
    e.preventDefault();
    const email = document.getElementById('mfp-email').value.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      document.getElementById('mfp-email').classList.add('error');
      document.getElementById('mfp-email-err').classList.add('visible');
      return;
    }

    const btn = document.getElementById('mfp-submit');
    btn.disabled = true;
    btn.innerHTML = '<span class="mp-spinner"></span> Sending&hellip;';

    try {
      await memberAuth.sendPasswordReset(email);
      document.getElementById('mfp-step1').style.display = 'none';
      document.getElementById('mfp-step2').style.display = 'block';
    } catch (err) {
      console.error('[ForgotPassword]', err);
      const alert = document.getElementById('mfp-alert');
      alert.textContent = 'Unable to send reset link. Please try again.';
      alert.classList.add('visible');
      btn.disabled = false;
      btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> Send Reset Link`;
    }
  }
}
