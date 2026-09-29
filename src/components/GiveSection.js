import { API_BASE } from '../apiConfig.js';
export class GiveSection {
  constructor(containerSelector) {
    this.container = document.querySelector(containerSelector);
    if (!this.container) return;
    this.API_URL = `${API_BASE}/donations`;
    
    this.renderInitial();
    this.loadConfig();
  }

  renderInitial() {
    this.container.innerHTML = `
      <style>
        .give-page-wrapper {
          font-family: 'Inter', sans-serif;
          background-color: #ffffff;
          color: #1E1E1E;
        }

        /* Hero Section */
        .give-hero {
          position: relative;
          background-image: url('/church_background_enhanced.jpg');
          background-size: cover;
          background-position: center right; /* To keep bible on the right visible */
          min-height: 350px;
          display: flex;
          align-items: center;
          color: white;
          overflow: hidden;
        }
        .give-hero::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: linear-gradient(to right, rgba(15, 20, 18, 0.95) 0%, rgba(15, 20, 18, 0.8) 40%, rgba(15, 20, 18, 0.2) 100%);
          z-index: 1;
        }
        .give-hero-content {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          padding: 60px 24px;
          text-align: left;
        }
        .give-eyebrow {
          color: #C6922E;
          font-weight: 700;
          letter-spacing: 2px;
          font-size: 16px;
          margin-bottom: 16px;
          text-transform: uppercase;
        }
        .give-hero h1 {
          font-family: 'Playfair Display', serif;
          font-size: 48px;
          line-height: 1.15;
          margin-bottom: 24px;
          max-width: 600px;
          color: #FFFFFF !important;
          font-weight: 700;
        }
        .give-hero p {
          font-size: 18px;
          line-height: 1.6;
          margin-bottom: 32px;
          max-width: 550px;
          color: #FFFFFF !important;
        }
        .give-quote-divider {
          width: 60px;
          height: 2px;
          background-color: #C6922E;
          margin-bottom: 20px;
        }
        .give-quote {
          font-family: 'Playfair Display', serif;
          font-style: italic;
          font-size: 16px;
          line-height: 1.5;
          opacity: 0.95;
          max-width: 500px;
          color: #FFFFFF !important;
        }
        .give-quote span {
          display: block;
          margin-top: 8px;
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          font-weight: 600;
          font-style: normal;
        }

        /* Donation Section */
        .give-donation-section {
          max-width: 1000px;
          margin: 60px auto;
          padding: 0 24px;
        }
        .give-split-container {
          display: flex;
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.05);
          border: 1px solid #f0f0f0;
          position: relative;
        }
        .give-column {
          flex: 1;
          padding: 48px 40px;
        }
        .give-column-left {
          text-align: center;
          border-right: 1px solid #eaeaea;
        }
        
        /* OR Divider */
        .give-divider-or {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          width: 40px;
          height: 40px;
          background: #ffffff;
          border: 1px solid #eaeaea;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          color: #888;
          font-size: 13px;
          z-index: 5;
        }

        /* Section Titles */
        .give-col-title {
          font-family: 'Playfair Display', serif;
          font-size: 28px;
          color: #0F4A3A;
          margin-bottom: 12px;
          font-weight: 700;
        }
        .give-col-desc {
          font-size: 15px;
          color: #555;
          margin-bottom: 32px;
          line-height: 1.5;
        }

        /* Left Side (QR) */
        .qr-code-wrapper {
          background: #ffffff;
          padding: 16px;
          border-radius: 8px;
          border: 1px solid #eee;
          display: inline-block;
          margin-bottom: 24px;
        }
        .qr-code-wrapper img {
          max-width: 220px;
          display: block;
        }
        .upi-id-box {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border: 1px solid #ddd;
          padding: 12px 16px;
          border-radius: 8px;
          background: #fafafa;
          margin-bottom: 20px;
          max-width: 300px;
          margin-left: auto;
          margin-right: auto;
        }
        .upi-id-text-group {
          text-align: left;
        }
        .upi-id-label {
          font-size: 11px;
          color: #888;
          text-transform: uppercase;
          margin-bottom: 2px;
          font-weight: 600;
        }
        .upi-id-text {
          font-weight: 700;
          color: #1E1E1E;
          font-size: 15px;
        }
        .copy-btn {
          background: none;
          border: none;
          color: #0F4A3A;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 600;
          padding: 6px 12px;
          border-radius: 4px;
          transition: background 0.2s;
        }
        .copy-btn:hover {
          background: #eef2f0;
        }
        .open-upi-btn {
          background: #0F4A3A;
          color: white;
          border: none;
          padding: 14px 24px;
          border-radius: 8px;
          font-weight: 600;
          width: 100%;
          max-width: 300px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: background 0.2s;
          text-decoration: none;
          font-size: 15px;
        }
        .open-upi-btn:hover {
          background: #0a3328;
        }
        .security-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 13px;
          color: #666;
          margin-top: 24px;
        }

        /* Right Side (Form) */
        .give-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .form-group label {
          font-size: 14px;
          font-weight: 600;
          color: #1E1E1E;
        }
        .form-input, .form-select {
          padding: 12px 16px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 15px;
          font-family: inherit;
          background: #fafafa;
          color: #333;
          transition: border-color 0.2s, background 0.2s;
        }
        .form-input:focus, .form-select:focus {
          outline: none;
          border-color: #C6922E;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(198, 146, 46, 0.1);
        }
        .submit-btn {
          background: #8A1525;
          color: white;
          border: none;
          padding: 14px 24px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
          margin-top: 12px;
          font-size: 16px;
        }
        .submit-btn:hover {
          background: #680f1b;
        }
        .submit-btn:disabled {
          background: #ccc;
          cursor: not-allowed;
        }
        .form-footer-note {
          font-size: 13px;
          color: #666;
          text-align: center;
          margin-top: 8px;
          line-height: 1.5;
        }

        /* Impact Section */
        .give-impact-section {
          text-align: center;
          padding: 60px 24px 80px;
          background-color: #ffffff;
        }
        .give-impact-section h2 {
          font-family: 'Playfair Display', serif;
          font-size: 36px;
          color: #0F4A3A;
          margin-bottom: 16px;
        }
        .give-impact-section > p {
          color: #555;
          margin-bottom: 48px;
          font-size: 16px;
        }
        .impact-grid {
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 24px;
          max-width: 1200px;
          margin: 0 auto;
        }
        .impact-card {
          background: #ffffff;
          padding: 32px 24px;
          border-radius: 12px;
          border: 1px solid #f0f0f0;
          box-shadow: 0 4px 12px rgba(0,0,0,0.02);
          width: 200px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .impact-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.06);
        }
        .impact-icon {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          margin-bottom: 20px;
        }
        .impact-icon.c-green { background-color: #0F4A3A; }
        .impact-icon.c-burgundy { background-color: #8A1525; }
        .impact-icon.c-gold { background-color: #C6922E; }

        .impact-title {
          font-weight: 700;
          font-size: 16px;
          margin-bottom: 8px;
          color: #1E1E1E;
        }
        .impact-desc {
          font-size: 13px;
          color: #666;
          line-height: 1.5;
        }

        /* Thank you banner */
        .thank-you-banner {
          background: #F8F5EC;
          max-width: 900px;
          margin: 0 auto 60px;
          padding: 32px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 20px;
          color: #0F4A3A;
          border: 1px solid #eae5d8;
        }
        .thank-you-text h4 {
          font-family: 'Playfair Display', serif;
          font-size: 24px;
          margin: 0 0 8px 0;
          font-weight: 600;
        }
        .thank-you-text p {
          margin: 0;
          font-size: 15px;
          opacity: 0.8;
        }
        
        #give-success-msg {
          display: none;
          margin-top: 1rem;
          color: #0F4A3A;
          font-weight: 600;
          text-align: center;
          padding: 16px;
          background: #eaf2ee;
          border: 1px solid #c2decb;
          border-radius: 8px;
        }

        @media (max-width: 900px) {
          .give-split-container {
            flex-direction: column;
          }
          .give-divider-or {
            display: none;
          }
          .give-column-left {
            border-right: none;
            border-bottom: 1px solid #eaeaea;
          }
          .give-hero h1 {
            font-size: 36px;
          }
        }
      </style>

      <div class="give-page-wrapper">
        <header class="give-hero">
          <div class="give-hero-content">
            <div class="give-eyebrow">GIVE</div>
            <h1>Support the Ministry<br>of Centenary Baptist Church</h1>
            <p>Your generous giving helps us worship, serve,<br>and reach our community with the love of Christ.</p>
            <div class="give-quote-divider"></div>
            <div class="give-quote">
              "Each one must give as he has decided in his heart, not reluctantly or under compulsion, for God loves a cheerful giver."
              <span>2 Corinthians 9:7</span>
            </div>
          </div>
        </header>

        <main class="give-donation-section">
          <div class="give-split-container">
            <!-- Left Side -->
            <div class="give-column give-column-left">
              <h2 class="give-col-title">Scan to Give</h2>
              <p class="give-col-desc">Use any UPI app (PhonePe, Google Pay, Paytm, etc.)<br>to scan the QR code below.</p>
              
              <div id="dynamic-qr-container">
                <p style="padding: 40px; color: #888;">Loading QR Code...</p>
              </div>

              <div class="security-badge">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                Safe, secure and trusted UPI payments
              </div>
            </div>

            <div class="give-divider-or">OR</div>

            <!-- Right Side -->
            <div class="give-column give-column-right">
              <h2 class="give-col-title">Give with Details</h2>
              <p class="give-col-desc">Help us know your gift so we can pray and stay in touch (optional).</p>

              <form id="public-donation-form" class="give-form">
                <div class="form-group">
                  <label>Name (Optional)</label>
                  <input type="text" name="name" class="form-input" placeholder="Your name">
                </div>
                <div class="form-group">
                  <label>Email (Optional)</label>
                  <input type="email" name="email" class="form-input" placeholder="you@example.com">
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                  <div class="form-group">
                    <label>Amount (Optional)</label>
                    <div style="position: relative;">
                      <span style="position: absolute; left: 16px; top: 12px; color: #555; font-weight: 600;">₹</span>
                      <input type="number" name="amount" class="form-input" placeholder="0.00" style="padding-left: 36px; width: 100%; box-sizing: border-box;">
                    </div>
                  </div>
                  <div class="form-group">
                    <label>Purpose (Optional)</label>
                    <select name="purpose" class="form-select" id="purpose-select">
                      <option value="General Fund">General Fund</option>
                      <option value="Missions">Missions</option>
                      <option value="Building Fund">Building Fund</option>
                      <option value="Youth Ministry">Youth Ministry</option>
                      <option value="Outreach">Outreach</option>
                    </select>
                  </div>
                </div>
                <button type="submit" class="submit-btn">
                  <span>Submit Details</span>
                </button>
                <div class="form-footer-note">All information is optional. You can also give anonymously using the QR code.</div>
              </form>
              <div id="give-success-msg">
                Thank you. Your giving details have been received.
              </div>
            </div>
          </div>
        </main>

        <section class="give-impact-section">
          <h2>Your Giving Makes a Difference</h2>
          <p>Your support helps us carry out the mission of Christ through:</p>
          
          <div class="impact-grid">
            <div class="impact-card">
              <div class="impact-icon c-green">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              </div>
              <div class="impact-title">Church Ministry</div>
              <div class="impact-desc">Supporting Sunday services and church operations</div>
            </div>
            
            <div class="impact-card">
              <div class="impact-icon c-burgundy">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
              <div class="impact-title">Children & Youth</div>
              <div class="impact-desc">Nurturing the next generation in faith</div>
            </div>

            <div class="impact-card">
              <div class="impact-icon c-gold">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              </div>
              <div class="impact-title">Outreach Programs</div>
              <div class="impact-desc">Serving our local community</div>
            </div>

            <div class="impact-card">
              <div class="impact-icon c-green">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
              </div>
              <div class="impact-title">Missions</div>
              <div class="impact-desc">Supporting mission work and evangelism</div>
            </div>

            <div class="impact-card">
              <div class="impact-icon c-burgundy">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
              </div>
              <div class="impact-title">Community Care</div>
              <div class="impact-desc">Helping those in need with Christ's love</div>
            </div>
          </div>
        </section>

        <div class="thank-you-banner">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink: 0;"><path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z"/></svg>
          <div class="thank-you-text">
            <h4>Thank you for partnering with us in the work of the Gospel.</h4>
            <p>May God richly bless your generosity.</p>
          </div>
        </div>
      </div>
    `;

    this.container.querySelector('#public-donation-form').addEventListener('submit', (e) => this.submitDonation(e));
  }

  async loadConfig() {
    try {
      const res = await fetch(`${this.API_URL}/config`);
      if (res.ok) {
        const config = await res.json();
        const configEl = this.container.querySelector('#dynamic-qr-container');
        
        if (config.qrCodeUrl) {
          const upiId = config.upiId || 'centenarychurch@upi';
          configEl.innerHTML = `
            <div class="qr-code-wrapper">
              <img src="${config.qrCodeUrl}" alt="Scan to Donate">
            </div>
            <div class="upi-id-box">
              <div class="upi-id-text-group">
                <div class="upi-id-label">UPI ID</div>
                <div class="upi-id-text" id="upi-id-value">${upiId}</div>
              </div>
              <button class="copy-btn" id="copy-upi-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                Copy
              </button>
            </div>
            <a href="upi://pay?pa=${upiId}&pn=Centenary%20Baptist%20Church" class="open-upi-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>
              Open in UPI App
            </a>
          `;

          this.container.querySelector('#copy-upi-btn').addEventListener('click', (e) => {
            e.preventDefault();
            const btn = e.currentTarget;
            navigator.clipboard.writeText(upiId);
            btn.innerHTML = '&check; Copied!';
            setTimeout(() => {
              btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy`;
            }, 2000);
          });
        } else {
          configEl.innerHTML = '<p style="color: #666; padding: 20px;">Online donations are currently being set up. Please contact the church office.</p>';
        }

        // If backend provides configured purposes, update the dropdown
        if (config.purposes && Array.isArray(config.purposes)) {
          const select = this.container.querySelector('#purpose-select');
          if (select) {
            select.innerHTML = config.purposes.map(p => `<option value="${p}">${p}</option>`).join('');
          }
        }
      }
    } catch (err) {
      console.error(err);
      this.container.querySelector('#dynamic-qr-container').innerHTML = '<p style="color: #d32f2f; padding: 20px;">Failed to load donation details. Please try again later.</p>';
    }
  }

  async submitDonation(e) {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector('button');
    const msgBox = this.container.querySelector('#give-success-msg');
    
    const data = {
      name: form.name.value,
      email: form.email.value,
      amount: form.amount.value,
      purpose: form.purpose.value,
      anonymous: false
    };

    btn.disabled = true;
    btn.querySelector('span').textContent = 'Submitting...';
    msgBox.style.display = 'none';

    try {
      const res = await fetch(this.API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (res.ok) {
        form.reset();
        form.style.display = 'none';
        msgBox.style.display = 'block';
      } else {
        alert('Failed to submit your details. Please try again later.');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred while submitting. Please check your connection and try again.');
    } finally {
      if (!btn.disabled) {
        // If form didn't hide (i.e. error occurred), re-enable the button
      }
      btn.disabled = false;
      btn.querySelector('span').textContent = 'Submit Details';
    }
  }
}
