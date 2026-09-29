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
      <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f3f4f6; font-family: 'Inter', sans-serif;">
        <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); width: 100%; max-width: 400px; text-align: center;">
          <img src="/images/cbc-logo.jpg" alt="Centenary Baptist Church" style="width: 80px; height: 80px; border-radius: 50%; margin-bottom: 20px;" onerror="this.style.display='none'">
          <h2 style="color: var(--primary-green); margin-bottom: 8px; font-family: 'Playfair Display', serif;">Admin Login</h2>
          <p style="color: #6b7280; font-size: 14px; margin-bottom: 24px;">Please sign in to access the CMS.</p>
          
          <form id="admin-login-form" style="display: flex; flex-direction: column; gap: 16px; text-align: left;">
            <div>
              <label style="display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 6px;">Email Address</label>
              <input type="email" name="email" required style="width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
            </div>
            <div>
              <label style="display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 6px;">Password</label>
              <input type="password" name="password" required style="width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
            </div>
            <button type="submit" style="width: 100%; padding: 12px; background: var(--primary-green); color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; margin-top: 8px; transition: background 0.2s;">Login</button>
          </form>
          <div style="margin-top: 20px; font-size: 13px;">
            <a href="#/" style="color: var(--secondary-gold); text-decoration: none;">&larr; Back to Website</a>
          </div>
        </div>
      </div>
    `;

    this.container.innerHTML = html;
    this.container.querySelector('#admin-login-form').addEventListener('submit', (e) => this.handleLogin(e));
  }
}
