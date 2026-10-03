/**
 * MemberRegister.js
 * Member registration screen.
 * Collects: First Name, Last Name, Email, Password, Confirm Password.
 * Does NOT collect family, baptism, or other profile data at registration.
 */
import { memberAuth } from './memberAuth.js';
import './member.css';

export class MemberRegister {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this._bound = false;
  }

  render() {
    this._bound = false;
    this.container.innerHTML = `
      <div class="mp-auth-page">
        <div class="mp-auth-card" style="max-width:520px;">
          <div class="mp-auth-logo">
            <img src="/logo-150.png" alt="Centenary Baptist Church" onerror="this.style.display='none'">
            <div class="mp-auth-logo-name">Centenary Baptist Church</div>
          </div>

          <h1 class="mp-auth-heading">Create Your Account</h1>
          <p class="mp-auth-sub">Join the Centenary Baptist Church member portal.<br>It only takes a minute.</p>

          <div class="mp-alert mp-alert-error" id="mr-alert" role="alert"></div>
          <div class="mp-alert mp-alert-success" id="mr-success" role="status"></div>

          <form id="mr-form" novalidate>
            <div class="mp-form-row">
              <div class="mp-form-group">
                <label class="mp-label" for="mr-fname">First Name <span>*</span></label>
                <input class="mp-input" type="text" id="mr-fname" placeholder="John" autocomplete="given-name" required>
                <div class="mp-field-error" id="mr-fname-err">First name is required.</div>
              </div>
              <div class="mp-form-group">
                <label class="mp-label" for="mr-lname">Last Name <span>*</span></label>
                <input class="mp-input" type="text" id="mr-lname" placeholder="Doe" autocomplete="family-name" required>
                <div class="mp-field-error" id="mr-lname-err">Last name is required.</div>
              </div>
            </div>

            <div class="mp-form-group">
              <label class="mp-label" for="mr-email">Email Address <span>*</span></label>
              <input class="mp-input" type="email" id="mr-email" placeholder="you@example.com" autocomplete="email" required>
              <div class="mp-field-error" id="mr-email-err">Please enter a valid email address.</div>
            </div>

            <div class="mp-form-group">
              <label class="mp-label" for="mr-phone">Phone Number <span style="color:#94a3b8;font-weight:400;text-transform:none;">(optional)</span></label>
              <input class="mp-input" type="tel" id="mr-phone" placeholder="e.g. 9876543210" autocomplete="tel">
              <div class="mp-field-error" id="mr-phone-err">Please enter a valid phone number.</div>
            </div>

            <div class="mp-form-group">
              <label class="mp-label" for="mr-password">Password <span>*</span></label>
              <div class="mp-input-wrap">
                <input class="mp-input" type="password" id="mr-password" placeholder="Min. 8 characters" autocomplete="new-password" required>
                <button type="button" class="mp-eye-btn" id="mr-eye1" aria-label="Show/hide password">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                  </svg>
                </button>
              </div>
              <div class="mp-field-error" id="mr-pw-err">Password must be at least 8 characters.</div>
            </div>

            <div class="mp-form-group">
              <label class="mp-label" for="mr-confirm">Confirm Password <span>*</span></label>
              <div class="mp-input-wrap">
                <input class="mp-input" type="password" id="mr-confirm" placeholder="Re-enter password" autocomplete="new-password" required>
                <button type="button" class="mp-eye-btn" id="mr-eye2" aria-label="Show/hide password">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                  </svg>
                </button>
              </div>
              <div class="mp-field-error" id="mr-confirm-err">Passwords do not match.</div>
            </div>

            <button type="submit" class="mp-btn-primary" id="mr-submit" style="margin-top:8px;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
              </svg>
              Create Account
            </button>
          </form>

          <hr class="mp-auth-divider">
          <div class="mp-auth-links">
            Already have an account?
            <a href="#/member/login">Sign In</a>
          </div>
          <div style="text-align:center;margin-top:16px;">
            <a href="#/" style="font-size:12px;color:#94a3b8;text-decoration:none;">← Back to Website</a>
          </div>
        </div>
      </div>
    `;
    this._bindEvents();
  }

  _bindEvents() {
    if (this._bound) return;
    this._bound = true;
    // Eye toggles
    const toggleEye = (btnId, inputId) => {
      document.getElementById(btnId).addEventListener('click', () => {
        const inp = document.getElementById(inputId);
        inp.type = inp.type === 'text' ? 'password' : 'text';
      });
    };
    toggleEye('mr-eye1', 'mr-password');
    toggleEye('mr-eye2', 'mr-confirm');

    // Clear errors on input
    ['mr-fname','mr-lname','mr-email','mr-password','mr-confirm'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', () => {
        el.classList.remove('error');
        const errEl = document.getElementById(id + '-err');
        if (errEl) errEl.classList.remove('visible');
        this._hideAlert();
      });
    });

    document.getElementById('mr-form').addEventListener('submit', (e) => this._handleSubmit(e));
  }

  _showAlert(msg, type = 'error') {
    const err = document.getElementById('mr-alert');
    const suc = document.getElementById('mr-success');
    if (type === 'error') {
      err.textContent = msg; err.classList.add('visible');
      suc.classList.remove('visible');
    } else {
      suc.textContent = msg; suc.classList.add('visible');
      err.classList.remove('visible');
    }
  }
  _hideAlert() {
    document.getElementById('mr-alert')?.classList.remove('visible');
    document.getElementById('mr-success')?.classList.remove('visible');
  }

  _validate() {
    let ok = true;
    const setErr = (id, errId, msg) => {
      const el = document.getElementById(id);
      const errEl = document.getElementById(errId);
      if (el) el.classList.add('error');
      if (errEl) { if (msg) errEl.textContent = msg; errEl.classList.add('visible'); }
      ok = false;
    };

    const fname   = document.getElementById('mr-fname').value.trim();
    const lname   = document.getElementById('mr-lname').value.trim();
    const email   = document.getElementById('mr-email').value.trim();
    const phone   = document.getElementById('mr-phone').value.trim();
    const pw      = document.getElementById('mr-password').value;
    const confirm = document.getElementById('mr-confirm').value;

    if (!fname) setErr('mr-fname', 'mr-fname-err');
    if (!lname) setErr('mr-lname', 'mr-lname-err');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) setErr('mr-email', 'mr-email-err');
    // Phone is optional, but if provided must contain only digits/spaces/+-() and be 6-15 digits
    if (phone && !/^[+\d][\d\s().+-]{5,19}$/.test(phone)) {
      setErr('mr-phone', 'mr-phone-err', 'Please enter a valid phone number.');
    }
    if (!pw || pw.length < 8) setErr('mr-password', 'mr-pw-err');
    if (!confirm || pw !== confirm) setErr('mr-confirm', 'mr-confirm-err');

    return ok;
  }

  async _handleSubmit(e) {
    e.preventDefault();
    if (!this._validate()) return;

    const btn = document.getElementById('mr-submit');
    btn.disabled = true;
    btn.innerHTML = '<span class="mp-spinner"></span> Creating your account&hellip;';
    this._hideAlert();

    const email     = document.getElementById('mr-email').value.trim().toLowerCase();
    const pw        = document.getElementById('mr-password').value;
    const firstName = document.getElementById('mr-fname').value.trim();
    const lastName  = document.getElementById('mr-lname').value.trim();
    const phone     = document.getElementById('mr-phone').value.trim();

    const resetBtn = () => {
      btn.disabled = false;
      btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg> Create Account`;
    };

    try {
      await memberAuth.register({ email, password: pw, firstName, lastName, phone });

      sessionStorage.setItem('mp_pending_email', email);
      window.location.hash = '#/member/verify';

    } catch (err) {
      console.warn('[MemberRegister] registration error:', err.code || err.status);

      const msg = (err.message || '').toLowerCase();
      const code = (err.code || '').toLowerCase();

      if (msg.includes('already registered') || msg.includes('user already registered') ||
          code === 'user_already_exists' || code.includes('duplicate')) {
        // Safe: build the alert message without innerHTML to avoid XSS
        const alertEl = document.getElementById('mr-alert');
        alertEl.textContent = 'An account with this email already exists. ';
        const link = document.createElement('a');
        link.href = '#/member/login';
        link.style.cssText = 'color:#075C50;font-weight:700;';
        link.textContent = 'Sign In instead';
        alertEl.appendChild(link);
        alertEl.classList.add('visible');
        resetBtn();
        return;
      }

      if (msg.includes('too many requests') || code === 'over_request_rate_limit') {
        this._showAlert('Too many attempts. Please wait a minute and try again.');
      } else if (msg.includes('network') || msg.includes('fetch')) {
        this._showAlert('Unable to connect. Please check your internet connection.');
      } else if (msg.includes('password') && msg.includes('weak')) {
        this._showAlert('Please choose a stronger password (min. 8 characters, mix of letters and numbers).');
      } else {
        this._showAlert('Unable to create your account. Please check your details and try again.');
      }
      resetBtn();
    }
  }
}
