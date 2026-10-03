/**
 * MemberLogin.js — Production-hardened member login.
 *
 * Security guarantees:
 *  - Uses supabaseClient.auth.signInWithPassword only.
 *  - Blocks admin accounts from entering member portal.
 *  - Sanitises all error messages (no raw Supabase text to users).
 *  - No alert() calls.
 *  - No console.log of user data.
 *  - Loading state disables submit button to prevent double-submission.
 */
import { memberAuth } from './memberAuth.js';
import './member.css';

export class MemberLogin {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this._bound = false; // Guard against double-binding events
  }

  render() {
    this._bound = false;
    this.container.innerHTML = `
      <div class="mp-auth-page">
        <div class="mp-auth-card">
          <div class="mp-auth-logo">
            <img src="/logo-150.png" alt="Centenary Baptist Church" onerror="this.style.display='none'">
            <div class="mp-auth-logo-name">Centenary Baptist Church</div>
          </div>

          <h1 class="mp-auth-heading">Welcome Back</h1>
          <p class="mp-auth-sub">Sign in to access your church member portal.</p>

          <!-- Inline alert — no alert() dialogs -->
          <div class="mp-alert mp-alert-error" id="ml-alert" role="alert"></div>
          <div class="mp-alert mp-alert-info"  id="ml-info"  role="status"></div>

          <form id="ml-form" novalidate>
            <div class="mp-form-group">
              <label class="mp-label" for="ml-email">Email Address <span>*</span></label>
              <input class="mp-input" type="email" id="ml-email" name="email"
                placeholder="you@example.com" autocomplete="email" required>
              <div class="mp-field-error" id="ml-email-err">Please enter a valid email address.</div>
            </div>

            <div class="mp-form-group">
              <label class="mp-label" for="ml-password">Password <span>*</span></label>
              <div class="mp-input-wrap">
                <input class="mp-input" type="password" id="ml-password" name="password"
                  placeholder="Your password" autocomplete="current-password" required>
                <button type="button" class="mp-eye-btn" id="ml-eye" aria-label="Show/hide password">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                  </svg>
                </button>
              </div>
              <div class="mp-field-error" id="ml-pw-err">Password is required.</div>
            </div>

            <div style="text-align:right;margin-top:-10px;margin-bottom:18px;">
              <a href="#/member/forgot-password" style="font-size:13px;color:#075C50;text-decoration:none;font-weight:600;">
                Forgot Password?
              </a>
            </div>

            <button type="submit" class="mp-btn-primary" id="ml-submit">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                <polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
              </svg>
              Sign In
            </button>
          </form>

          <hr class="mp-auth-divider">
          <div class="mp-auth-links">
            Don't have an account?<br>
            <a href="#/member/register" style="margin-top:8px;display:inline-block;">
              Create Member Account
            </a>
          </div>

          <div style="text-align:center;margin-top:20px;">
            <a href="#/" style="font-size:12px;color:#94a3b8;text-decoration:none;">
              ← Back to Website
            </a>
          </div>
        </div>
      </div>
    `;

    this._bindEvents();
  }

  _bindEvents() {
    if (this._bound) return;
    this._bound = true;

    const pwInput = document.getElementById('ml-password');

    // Password visibility toggle
    document.getElementById('ml-eye').addEventListener('click', () => {
      pwInput.type = pwInput.type === 'text' ? 'password' : 'text';
    });

    // Clear field errors + alert on any input
    document.getElementById('ml-email').addEventListener('input', () => {
      document.getElementById('ml-email').classList.remove('error');
      document.getElementById('ml-email-err').classList.remove('visible');
      this._clearAlerts();
    });
    document.getElementById('ml-password').addEventListener('input', () => {
      document.getElementById('ml-password').classList.remove('error');
      document.getElementById('ml-pw-err').classList.remove('visible');
      this._clearAlerts();
    });

    document.getElementById('ml-form').addEventListener('submit', (e) => this._handleSubmit(e));
  }

  _showAlert(msg) {
    const el = document.getElementById('ml-alert');
    if (el) { el.textContent = msg; el.classList.add('visible'); }
    document.getElementById('ml-info')?.classList.remove('visible');
  }

  _showInfo(msg) {
    const el = document.getElementById('ml-info');
    if (el) { el.textContent = msg; el.classList.add('visible'); }
    document.getElementById('ml-alert')?.classList.remove('visible');
  }

  _clearAlerts() {
    document.getElementById('ml-alert')?.classList.remove('visible');
    document.getElementById('ml-info')?.classList.remove('visible');
  }

  _validate() {
    let ok = true;
    const emailEl = document.getElementById('ml-email');
    const pwEl    = document.getElementById('ml-password');

    if (!emailEl.value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailEl.value.trim())) {
      emailEl.classList.add('error');
      document.getElementById('ml-email-err').classList.add('visible');
      ok = false;
    }
    if (!pwEl.value) {
      pwEl.classList.add('error');
      document.getElementById('ml-pw-err').classList.add('visible');
      ok = false;
    }
    return ok;
  }

  /** Map Supabase error codes/messages to user-friendly text. */
  _friendlyError(err) {
    const msg = (err.message || '').toLowerCase();
    const code = (err.code || '').toLowerCase();
    if (msg.includes('invalid login credentials') || code === 'invalid_credentials') {
      return 'Email or password is incorrect. Please try again.';
    }
    if (msg.includes('email not confirmed') || code === 'email_not_confirmed') {
      return 'Please verify your email before signing in. Check your inbox.';
    }
    if (msg.includes('too many requests') || code === 'over_request_rate_limit') {
      return 'Too many attempts. Please wait a minute and try again.';
    }
    if (msg.includes('network') || msg.includes('fetch')) {
      return 'Unable to connect. Please check your internet connection.';
    }
    // Generic fallback — do NOT expose raw Supabase message
    return 'Unable to sign in. Please try again.';
  }

  _setSubmitReady(btn) {
    btn.disabled = false;
    btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
      <polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
    </svg> Sign In`;
  }

  async _handleSubmit(e) {
    e.preventDefault();
    if (!this._validate()) return;

    const btn   = document.getElementById('ml-submit');
    const email = document.getElementById('ml-email').value.trim().toLowerCase();
    const pw    = document.getElementById('ml-password').value;

    btn.disabled = true;
    btn.innerHTML = '<span class="mp-spinner"></span> Signing you in&hellip;';
    this._clearAlerts();

    try {
      const data = await memberAuth.login({ email, password: pw });

      // Block admin accounts — sign them out immediately
      if (memberAuth.isAdminUser(data.user)) {
        await memberAuth.logout();
        this._showAlert('This account uses the Admin portal. Please visit the admin login page.');
        this._setSubmitReady(btn);
        return;
      }

      // Email unverified — redirect to verify screen
      if (!data.user.email_confirmed_at) {
        sessionStorage.setItem('mp_pending_email', email);
        window.location.hash = '#/member/verify';
        return;
      }

      // Ensure profile row exists (idempotent)
      await memberAuth.ensureProfile(data.user);

      sessionStorage.removeItem('mp_pending_email');
      window.location.hash = '#/member/dashboard';

    } catch (err) {
      console.warn('[MemberLogin] login error:', err.code || err.status);

      // If Supabase says email not confirmed, redirect to verify page
      if ((err.message || '').toLowerCase().includes('email not confirmed') ||
          err.code === 'email_not_confirmed') {
        sessionStorage.setItem('mp_pending_email', email);
        this._showInfo('Your email is not verified. Redirecting to the verification page…');
        setTimeout(() => { window.location.hash = '#/member/verify'; }, 1500);
        this._setSubmitReady(btn);
        return;
      }

      this._showAlert(this._friendlyError(err));
      this._setSubmitReady(btn);
    }
  }
}
