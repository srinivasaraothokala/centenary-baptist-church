/**
 * MemberVerify.js — Production-hardened email verification screen.
 *
 * Supabase email verification flow:
 *   1. Member registers → Supabase sends email with a link like:
 *      <supabase-url>/auth/v1/verify?token=...&type=signup
 *      which Supabase processes server-side, then redirects back to:
 *      <site-url>#/member/verify (or whatever the site URL is configured to)
 *      with #access_token=...&type=signup appended.
 *
 *   2. The Supabase client JS SDK detects the access_token in the URL fragment,
 *      establishes a session, and fires onAuthStateChange with event = 'SIGNED_IN'.
 *
 *   3. This component:
 *      a. On render: checks if already verified → go to dashboard immediately.
 *      b. Listens to onAuthStateChange → when SIGNED_IN fires, checks confirmation
 *         status and redirects.
 *      c. Provides a manual "I've verified — Continue" button.
 *      d. Provides a Resend button with a 60-second cooldown.
 */
import { memberAuth } from './memberAuth.js';
import './member.css';

export class MemberVerify {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this._resendCooldown = 0;
    this._timer = null;
    this._authSubscription = null;
  }

  /** Unsubscribe from auth state listener when page is torn down. */
  _destroy() {
    if (this._authSubscription) {
      this._authSubscription.subscription?.unsubscribe?.();
      this._authSubscription = null;
    }
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
  }

  async render() {
    this._destroy(); // Clean up any previous listeners from re-renders

    // If user already has a confirmed session, skip straight to dashboard
    const session = await memberAuth.getSession();
    if (session?.user?.email_confirmed_at) {
      await memberAuth.ensureProfile(session.user);
      window.location.hash = '#/member/dashboard';
      return;
    }

    const pendingEmail = sessionStorage.getItem('mp_pending_email') || '';

    this.container.innerHTML = `
      <div class="mp-auth-page">
        <div class="mp-auth-card" style="text-align:center;">
          <div class="mp-verify-icon">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
          </div>

          <h1 class="mp-auth-heading" style="font-size:22px;">Verify Your Email</h1>
          <p class="mp-auth-sub">
            We sent a verification link to:<br>
            <strong style="color:#075C50;">${pendingEmail || 'your email address'}</strong>
          </p>

          <div class="mp-otp-hint">
            <strong>Check your inbox</strong> and click the verification link we sent you.
            The link will automatically sign you in and bring you to your dashboard.<br><br>
            If you don't see it, check your <strong>spam / junk</strong> folder.
          </div>

          <div class="mp-alert mp-alert-error"   id="mv-alert"   role="alert"></div>
          <div class="mp-alert mp-alert-success"  id="mv-success" role="status"></div>
          <div class="mp-alert mp-alert-info"     id="mv-info"    role="status"></div>

          <button class="mp-btn-primary" id="mv-resend" style="margin-bottom:12px;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.51"/>
            </svg>
            Resend Verification Email
          </button>

          <button class="mp-btn-outline" id="mv-check" style="margin-bottom:16px;">
            I've Verified My Email — Continue
          </button>

          <div id="mv-countdown" style="font-size:12px;color:#94a3b8;min-height:18px;"></div>

          <hr class="mp-auth-divider">
          <div class="mp-auth-links">
            <a href="#/member/login">← Back to Sign In</a>
          </div>
        </div>
      </div>
    `;

    this._bindEvents(pendingEmail);
    this._listenForVerification();
  }

  /**
   * Subscribe to auth state changes so that when the user clicks the
   * email link in another tab/window, this tab auto-advances.
   */
  _listenForVerification() {
    this._authSubscription = memberAuth.onAuthStateChange(async (event, session) => {
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') &&
           session?.user?.email_confirmed_at) {
        this._destroy();
        this._showMsg('mv-info', 'Email verified! Taking you to your dashboard…');
        await memberAuth.ensureProfile(session.user);
        sessionStorage.removeItem('mp_pending_email');
        setTimeout(() => { window.location.hash = '#/member/dashboard'; }, 800);
      }
    });
  }

  _bindEvents(pendingEmail) {
    document.getElementById('mv-resend')?.addEventListener('click', () => this._resend(pendingEmail));
    document.getElementById('mv-check')?.addEventListener('click',  () => this._checkSession());
  }

  async _resend(email) {
    if (this._resendCooldown > 0) return;
    if (!email) {
      this._showMsg('mv-alert', 'No email address found. Please go back and register again.');
      return;
    }

    const btn = document.getElementById('mv-resend');
    if (!btn) return;
    btn.disabled = true;
    btn.innerHTML = '<span class="mp-spinner"></span> Sending&hellip;';
    document.getElementById('mv-alert')?.classList.remove('visible');
    document.getElementById('mv-success')?.classList.remove('visible');

    try {
      await memberAuth.resendVerification(email);
      this._showMsg('mv-success', 'Verification email sent! Please check your inbox.');
      this._startCooldown(60);
    } catch (err) {
      console.warn('[MemberVerify] resend error:', err.code || err.message);
      this._showMsg('mv-alert', 'Could not send email. Please wait a moment and try again.');
      btn.disabled = false;
      btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.51"/>
      </svg> Resend Verification Email`;
    }
  }

  async _checkSession() {
    const btn = document.getElementById('mv-check');
    if (btn) { btn.disabled = true; btn.textContent = 'Checking…'; }

    const session = await memberAuth.getSession();
    if (session?.user?.email_confirmed_at) {
      this._destroy();
      await memberAuth.ensureProfile(session.user);
      sessionStorage.removeItem('mp_pending_email');
      window.location.hash = '#/member/dashboard';
    } else {
      this._showMsg('mv-alert', 'Your email has not been verified yet. Please click the link in your inbox first.');
      if (btn) { btn.disabled = false; btn.textContent = "I've Verified My Email — Continue"; }
    }
  }

  _startCooldown(seconds) {
    this._resendCooldown = seconds;
    const btn       = document.getElementById('mv-resend');
    const countdown = document.getElementById('mv-countdown');

    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.51"/>
      </svg> Resend Verification Email`;
    }

    this._timer = setInterval(() => {
      this._resendCooldown--;
      if (countdown) countdown.textContent = `Resend available in ${this._resendCooldown}s`;
      if (this._resendCooldown <= 0) {
        clearInterval(this._timer);
        this._timer = null;
        this._resendCooldown = 0;
        if (btn)      { btn.disabled = false; }
        if (countdown) { countdown.textContent = ''; }
      }
    }, 1000);
  }

  _showMsg(id, msg) {
    const el = document.getElementById(id);
    if (el) { el.textContent = msg; el.classList.add('visible'); }
  }
}
