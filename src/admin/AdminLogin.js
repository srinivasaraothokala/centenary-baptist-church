import { supabaseClient } from '../supabaseFrontendClient.js';
import './admin.css';

export class AdminLogin {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
  }

  async handleLogin(e) {
    e.preventDefault();
    const form = e.target;
    const email = form.email.value;
    const password = form.password.value;
    const btn = form.querySelector('button');

    btn.textContent = 'Logging in...';
    btn.disabled = true;

    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) throw error;

      const role = data.user?.app_metadata?.role;
      const isActive = data.user?.app_metadata?.is_active !== false;
      if (!isActive || (role !== 'admin' && role !== 'super_admin')) {
        await supabaseClient.auth.signOut();
        throw new Error('This account does not have active admin access.');
      }

      // Login successful, redirect to dashboard
      window.location.hash = '#/admin';
    } catch (error) {
      console.error(error);
      alert('Login failed: ' + error.message);
      btn.textContent = 'Login';
      btn.disabled = false;
    }
  }

  render() {
    const html = `
      <div style="
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #042e29 0%, #063b35 60%, #0a5247 100%);
        font-family: 'Inter', sans-serif;
        padding: 24px;
        box-sizing: border-box;
      ">
        <div style="
          background: white;
          padding: 48px 40px 40px;
          border-radius: 20px;
          box-shadow: 0 24px 60px rgba(0,0,0,0.35);
          width: 100%;
          max-width: 420px;
          text-align: center;
          box-sizing: border-box;
        ">

          <!-- Church Seal Logo -->
          <div style="margin-bottom: 20px;">
            <img
              src="/new-logo.png"
              alt="Centenary Baptist Church"
              style="width: 88px; height: 88px; object-fit: contain; display: block; margin: 0 auto;"
              onerror="this.style.display='none'"
            >
          </div>

          <!-- Title -->
          <h2 style="
            color: #063b35;
            margin: 0 0 4px;
            font-family: 'Playfair Display', serif;
            font-size: 1.55rem;
            font-weight: 700;
          ">Admin Login</h2>
          <p style="color: #6b7280; font-size: 13.5px; margin: 0 0 28px; line-height: 1.5;">
            Please sign in to access the CMS.
          </p>

          <!-- Divider -->
          <div style="height: 1px; background: #f0f0f0; margin-bottom: 28px;"></div>

          <!-- Form -->
          <form id="admin-login-form" style="display: flex; flex-direction: column; gap: 18px; text-align: left;">
            <div>
              <label style="display: block; font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.05em;">Email Address</label>
              <input
                type="email"
                name="email"
                required
                placeholder="admin@cbcsecbad.in"
                style="width: 100%; padding: 11px 14px; border: 1.5px solid #d1d5db; border-radius: 8px; font-size: 14px; font-family: 'Inter', sans-serif; outline: none; box-sizing: border-box; transition: border-color 0.2s;"
                onfocus="this.style.borderColor='#063b35'"
                onblur="this.style.borderColor='#d1d5db'"
              >
            </div>
            <div>
              <label style="display: block; font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.05em;">Password</label>
              <input
                type="password"
                name="password"
                required
                placeholder="••••••••"
                style="width: 100%; padding: 11px 14px; border: 1.5px solid #d1d5db; border-radius: 8px; font-size: 14px; font-family: 'Inter', sans-serif; outline: none; box-sizing: border-box; transition: border-color 0.2s;"
                onfocus="this.style.borderColor='#063b35'"
                onblur="this.style.borderColor='#d1d5db'"
              >
            </div>
            <button
              type="submit"
              style="width: 100%; padding: 13px; background: #063b35; color: white; border: none; border-radius: 8px; font-weight: 700; font-size: 15px; cursor: pointer; margin-top: 4px; font-family: 'Inter', sans-serif; letter-spacing: 0.02em; transition: background 0.2s;"
              onmouseover="this.style.background='#0a5247'"
              onmouseout="this.style.background='#063b35'"
            >Login</button>
          </form>

          <!-- Back link -->
          <div style="margin-top: 24px; font-size: 13px;">
            <a href="#/" style="color: #b6893f; text-decoration: none; font-weight: 500;">&larr; Back to Website</a>
          </div>

          <!-- Footer motto -->
          <div style="margin-top: 28px; padding-top: 20px; border-top: 1px solid #f0f0f0;">
            <p style="color: #9ca3af; font-size: 11px; font-style: italic; margin: 0; font-family: 'Playfair Display', serif;">
              &ldquo;We Preach Christ Crucified&rdquo; &mdash; 1 Cor. 1:23
            </p>
          </div>

        </div>
      </div>
    `;

    this.container.innerHTML = html;
    this.container.querySelector('#admin-login-form').addEventListener('submit', (e) => this.handleLogin(e));
  }
}
