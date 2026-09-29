import { API_BASE } from '../apiConfig.js';
import { supabaseClient } from '../supabaseFrontendClient.js';
import { AdminLayout } from './AdminLayout.js';

export class AdminDonations {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.donations = [];
    this.config = { note: '', qrCodeUrl: '' };
    this.API_URL = `${API_BASE}/donations`;
  }
  async authHeaders(isFormData = false) {
    const { data: { session } } = await supabaseClient.auth.getSession();
    const headers = { Authorization: `Bearer ${session?.access_token}` };
    if (!isFormData) headers['Content-Type'] = 'application/json';
    return headers;
  }


  async fetchData() {
    try {
      const configRes = await fetch(`${this.API_URL}/config`);
      if (configRes.ok) this.config = await configRes.json();

      const donRes = await fetch(this.API_URL);
      if (donRes.ok) this.donations = await donRes.json();
      
      this.renderUI();
    } catch (err) {
      console.error(err);
    }
  }

  async saveConfig(e) {
    e.preventDefault();
    const form = e.target;
    
    const formData = new FormData();
    formData.append('note', form.note.value);
    
    if (form.qrCode.files[0]) {
      formData.append('qrCode', form.qrCode.files[0]);
    }

    try {
      const res = await fetch(`${this.API_URL}/config`, { method: 'POST', body: formData, headers: await this.authHeaders(true) });
      if (res.ok) {
        alert('Donation configuration updated!');
        await this.fetchData();
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save config.');
    }
  }

  render() {
    const content = `
            <div class="admin-header">
              <h2>Donations Management</h2>
              <p>Update the QR code, edit the donation note, and view received donations.</p>
            </div>
            
            <div class="admin-grid">
              <!-- Config Card -->
              <div class="admin-card">
                <div class="admin-card-header">
                  <h3>Donation Page Setup</h3>
                </div>
                <div class="admin-card-body">
                  <form id="admin-donation-config-form" class="admin-form">
                    <div class="form-group">
                      <label>Explanation / Note</label>
                      <textarea name="note" rows="4" required placeholder="Why should they donate?"></textarea>
                    </div>
                    <div class="form-group">
                      <label>QR Code Image</label>
                      <input type="file" name="qrCode" accept="image/*">
                      <div id="current-qr-preview" style="margin-top: 10px;"></div>
                    </div>
                    <div class="admin-actions">
                      <button type="submit" class="admin-btn admin-btn-primary">Update Setup</button>
                    </div>
                  </form>
                </div>
              </div>

              <!-- Donations List Card -->
              <div class="admin-card">
                <div class="admin-card-header">
                  <h3>Recent Donations</h3>
                </div>
                <div style="overflow-x: auto;">
                  <table class="admin-table">
                    <thead>
                      <tr>
                        <th>Donor</th>
                        <th>Amount</th>
                        <th>Date & Time</th>
                      </tr>
                    </thead>
                    <tbody id="admin-donations-list">
                      <tr><td colspan="3"><div class="admin-empty">Loading donations...</div></td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
            </div>
    `;

    this.container.innerHTML = AdminLayout.getLayout(content, '/admin/donations');

    this.container.querySelector('#admin-donation-config-form').addEventListener('submit', (e) => this.saveConfig(e));
    this.fetchData();
  }

  renderUI() {
    // Fill Config Form
    const form = this.container.querySelector('#admin-donation-config-form');
    form.note.value = this.config.note;
    const qrPreview = this.container.querySelector('#current-qr-preview');
    if (this.config.qrCodeUrl) {
      qrPreview.innerHTML = `<img src="${this.config.qrCodeUrl}" alt="QR Code" style="max-width: 150px; border-radius: 8px; margin-top: 10px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">`;
    } else {
      qrPreview.innerHTML = '<span style="color: #94a3b8; font-size: 0.85rem; display: block; margin-top: 10px;">No QR code uploaded yet.</span>';
    }

    // Fill Donations List
    const list = this.container.querySelector('#admin-donations-list');
    if (this.donations.length === 0) {
      list.innerHTML = '<tr><td colspan="3"><div class="admin-empty">No donations recorded yet.</div></td></tr>';
      return;
    }

    list.innerHTML = [...this.donations].reverse().map(don => {
      const initial = don.anonymous ? 'A' : don.name.charAt(0).toUpperCase();
      const avatarClass = don.anonymous ? 'admin-avatar anon' : 'admin-avatar';
      const nameHtml = don.anonymous 
        ? 'Anonymous <span class="admin-badge anon-badge" style="margin-left: 8px;">Hidden</span>'
        : don.name;
        
      return `
      <tr>
        <td>
          <div class="td-primary">
            <div class="${avatarClass}">${initial}</div>
            ${nameHtml}
          </div>
        </td>
        <td class="td-amount">₹${don.amount.toLocaleString('en-IN')}</td>
        <td class="td-secondary">${new Date(don.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</td>
      </tr>
    `}).join('');
  }
}
