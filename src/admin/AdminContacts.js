import { API_BASE } from '../apiConfig.js';
import { supabaseClient } from '../supabaseFrontendClient.js';
import { AdminLayout } from './AdminLayout.js';

export class AdminContacts {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.contacts = [];
    this.API_URL = `${API_BASE}/contact`;
  }
  async authHeaders(isFormData = false) {
    const { data: { session } } = await supabaseClient.auth.getSession();
    const headers = { Authorization: `Bearer ${session?.access_token}` };
    if (!isFormData) headers['Content-Type'] = 'application/json';
    return headers;
  }


  async fetchContacts() {
    try {
      const res = await fetch(this.API_URL);
      if (res.ok) {
        this.contacts = await res.json();
        this.renderUI();
      }
    } catch (err) {
      console.error('Failed to load contacts', err);
    }
  }

  render() {
    const content = `
            <div class="admin-header">
              <h2>Contact Submissions</h2>
              <p>View messages submitted through the website contact form.</p>
            </div>
            
            <div class="admin-grid" style="grid-template-columns: 1fr;">
              <!-- Contacts List Card -->
              <div class="admin-card">
                <div class="admin-card-header">
                  <h3>Inbox</h3>
                </div>
                <div style="overflow-x: auto;">
                  <table class="admin-table">
                    <thead>
                      <tr>
                        <th>Sender</th>
                        <th>Contact Details</th>
                        <th>Message</th>
                        <th>Date & Time</th>
                      </tr>
                    </thead>
                    <tbody id="admin-contacts-list">
                      <tr><td colspan="4"><div class="admin-empty">Loading messages...</div></td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
            </div>
    `;

    this.container.innerHTML = AdminLayout.getLayout(content, '/admin/contacts');

    this.fetchContacts();
  }

  renderUI() {
    const list = this.container.querySelector('#admin-contacts-list');
    if (this.contacts.length === 0) {
      list.innerHTML = '<tr><td colspan="4"><div class="admin-empty">No messages received yet.</div></td></tr>';
      return;
    }

    list.innerHTML = [...this.contacts].reverse().map(c => {
      const initial = c.name ? c.name.charAt(0).toUpperCase() : '?';
      return `
      <tr>
        <td style="min-width: 200px;">
          <div class="td-primary">
            <div class="admin-avatar" style="background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3);">${initial}</div>
            <div>
              <div style="margin-bottom: 4px; font-weight: 600;">${c.name}</div>
            </div>
          </div>
        </td>
        <td class="td-secondary" style="min-width: 200px;">
          <div style="margin-bottom: 4px;">📧 <a href="mailto:${c.email}" style="color: #38bdf8; text-decoration: none;">${c.email}</a></div>
          <div>📞 <a href="tel:${c.phone}" style="color: #94a3b8; text-decoration: none;">${c.phone}</a></div>
        </td>
        <td style="max-width: 400px;">
          <div style="color: #e2e8f0; font-size: 0.9rem; line-height: 1.5; white-space: pre-wrap;">${c.message}</div>
        </td>
        <td class="td-secondary" style="min-width: 150px;">
          ${new Date(c.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
        </td>
      </tr>
    `}).join('');
  }
}
