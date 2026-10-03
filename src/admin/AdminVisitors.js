import { API_BASE } from '../apiConfig.js';
import { supabaseClient } from '../supabaseFrontendClient.js';
import { AdminLayout } from './AdminLayout.js';

export class AdminVisitors {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.visitors = [];
    this.filteredVisitors = [];
    this.API_URL = `${API_BASE}/visitor`;
    this.searchQuery = '';
  }

  async authHeaders() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    return {
      Authorization: `Bearer ${session?.access_token}`,
      'Content-Type': 'application/json'
    };
  }

  async fetchVisitors() {
    this.renderLoading();
    try {
      const res = await fetch(this.API_URL, { headers: await this.authHeaders() });
      if (res.ok) {
        this.visitors = await res.json();
        this.filteredVisitors = [...this.visitors];
        this.renderUI();
      } else {
        throw new Error('Failed to load visitors');
      }
    } catch (err) {
      console.error('Failed to load visitors', err);
      this.renderError();
    }
  }

  renderLoading() {
    const list = this.container.querySelector('#admin-visitors-list');
    if (list) list.innerHTML = '<tr><td colspan="5"><div class="admin-empty">Loading visitors...</div></td></tr>';
  }

  renderError() {
    const list = this.container.querySelector('#admin-visitors-list');
    if (list) {
      list.innerHTML = `
        <tr><td colspan="5">
          <div class="admin-empty" style="color: #991b1b;">
            Unable to load visitors.<br><br>
            <button id="admin-visitors-retry" class="btn btn-outline-maroon" style="padding: 6px 16px; font-size: 13px;">Retry</button>
          </div>
        </td></tr>
      `;
      const retryBtn = document.getElementById('admin-visitors-retry');
      if (retryBtn) retryBtn.addEventListener('click', () => this.fetchVisitors());
    }
  }

  render() {
    const content = `
      <div class="admin-header">
        <h2>First-Time Visitors</h2>
        <p>Manage and review people who have submitted the Plan Your Visit form.</p>
      </div>
      
      <div class="admin-grid" style="grid-template-columns: 1fr;">
        <div class="admin-card">
          <div class="admin-card-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
            <h3>Submissions <span class="sidebar-badge" style="background:#f1f5f9;color:#64748b;font-size:12px;margin-left:8px;" id="visitor-count-badge">0</span></h3>
            
            <div style="display: flex; gap: 12px; align-items: center;">
              <div style="position: relative; max-width: 250px; width: 100%;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; color: #94a3b8;"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                <input type="text" id="admin-visitor-search" placeholder="Search visitors..." style="width: 100%; padding: 8px 12px 8px 32px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 14px; outline: none;">
              </div>
              <button id="admin-visitor-refresh" class="btn" style="background: white; border: 1px solid #cbd5e1; color: #475569; padding: 8px 12px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 6px;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
              </button>
            </div>
          </div>
          <div style="overflow-x: auto;">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Visitor</th>
                  <th>Contact Details</th>
                  <th>City / Area</th>
                  <th>Visit Intent</th>
                  <th>Submitted</th>
                  <th style="text-align: right;">Action</th>
                </tr>
              </thead>
              <tbody id="admin-visitors-list">
                <tr><td colspan="6"><div class="admin-empty">Loading visitors...</div></td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    this.container.innerHTML = AdminLayout.getLayout(content, '/admin/visitors');

    // Bind Search
    const searchInput = document.getElementById('admin-visitor-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.filterVisitors();
      });
    }

    // Bind Refresh
    const refreshBtn = document.getElementById('admin-visitor-refresh');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.fetchVisitors();
      });
    }

    this.fetchVisitors();
  }

  filterVisitors() {
    if (!this.searchQuery) {
      this.filteredVisitors = [...this.visitors];
    } else {
      this.filteredVisitors = this.visitors.filter(v => {
        const fullStr = `${v.first_name} ${v.last_name} ${v.email} ${v.phone} ${v.city}`.toLowerCase();
        return fullStr.includes(this.searchQuery);
      });
    }
    this.renderUI();
  }

  renderUI() {
    const list = this.container.querySelector('#admin-visitors-list');
    const badge = document.getElementById('visitor-count-badge');
    
    if (badge) badge.textContent = this.filteredVisitors.length;

    if (this.filteredVisitors.length === 0) {
      list.innerHTML = '<tr><td colspan="6"><div class="admin-empty">No visitors found.</div></td></tr>';
      return;
    }

    list.innerHTML = this.filteredVisitors.map(v => {
      const name = `${v.first_name || ''} ${v.last_name || ''}`.trim() || 'Unknown Visitor';
      const initial = name.charAt(0).toUpperCase();
      const submitted = new Date(v.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
      const emailHtml = v.email ? `<div style="margin-bottom: 4px;">📧 <a href="mailto:${v.email}" style="color: #38bdf8; text-decoration: none;">${v.email}</a></div>` : '';
      const phoneHtml = v.phone ? `<div>📞 <a href="tel:${v.phone}" style="color: #94a3b8; text-decoration: none;">${v.phone}</a></div>` : '';
      
      return `
      <tr>
        <td style="min-width: 200px;">
          <div class="td-primary">
            <div class="admin-avatar" style="background: rgba(14, 165, 233, 0.1); color: #0ea5e9; border: 1px solid rgba(14, 165, 233, 0.3);">${initial}</div>
            <div>
              <div style="font-weight: 600; color: #1e293b;">${name}</div>
            </div>
          </div>
        </td>
        <td class="td-secondary" style="min-width: 200px;">
          ${emailHtml}
          ${phoneHtml}
        </td>
        <td class="td-secondary" style="min-width: 150px;">
          ${v.city || '<span style="color: #cbd5e1;">Not provided</span>'}
        </td>
        <td class="td-secondary" style="min-width: 150px;">
          <div style="margin-bottom: 4px;">${v.visit_intent || '<span style="color: #cbd5e1;">-</span>'}</div>
        </td>
        <td class="td-secondary" style="min-width: 150px;">
          ${submitted}
        </td>
        <td style="text-align: right; min-width: 80px;">
          <button class="btn admin-view-visitor-btn" data-id="${v.id}" style="background: transparent; border: 1px solid #e2e8f0; color: #0f172a; padding: 6px 12px; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; transition: 0.2s;">View</button>
        </td>
      </tr>
    `}).join('');

    // Bind View buttons
    this.container.querySelectorAll('.admin-view-visitor-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const visitor = this.visitors.find(v => v.id === id);
        if (visitor) this.showVisitorModal(visitor);
      });
    });
  }

  showVisitorModal(v) {
    const existing = document.getElementById('admin-visitor-modal');
    if (existing) existing.remove();

    const name = `${v.first_name || ''} ${v.last_name || ''}`.trim() || 'Unknown Visitor';
    const submitted = new Date(v.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });

    const modal = document.createElement('div');
    modal.id = 'admin-visitor-modal';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(15, 23, 42, 0.7);z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;backdrop-filter:blur(4px);';
    
    modal.innerHTML = `
      <div style="background:white;border-radius:12px;width:100%;max-width:600px;max-height:90vh;overflow-y:auto;box-shadow:0 25px 50px -12px rgba(0,0,0,0.25);position:relative;">
        <button id="admin-visitor-modal-close" style="position:absolute;top:16px;right:16px;background:rgba(241, 245, 249, 1);border:none;width:32px;height:32px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#64748b;transition:0.2s;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
        
        <div style="padding: 32px 32px 24px;">
          <div style="display:flex;align-items:center;gap:16px;margin-bottom:32px;">
            <div style="width:56px;height:56px;border-radius:50%;background:rgba(14, 165, 233, 0.1);color:#0ea5e9;border:1px solid rgba(14, 165, 233, 0.3);display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:600;flex-shrink:0;">
              ${name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 style="margin:0 0 4px;font-family:'Playfair Display',serif;font-size:24px;color:#0f172a;">${name}</h2>
              <div style="color:#64748b;font-size:13px;">Submitted: ${submitted}</div>
            </div>
          </div>

          <div style="margin-bottom: 24px;">
            <h3 style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;margin:0 0 12px;font-weight:700;border-bottom:1px solid #f1f5f9;padding-bottom:8px;">Contact Information</h3>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
              <div>
                <div style="font-size:12px;color:#64748b;margin-bottom:4px;">Phone</div>
                <div style="font-size:14px;color:#1e293b;font-weight:500;">${v.phone ? `<a href="tel:${v.phone}" style="color:#0ea5e9;text-decoration:none;">${v.phone}</a>` : '-'}</div>
              </div>
              <div>
                <div style="font-size:12px;color:#64748b;margin-bottom:4px;">Email</div>
                <div style="font-size:14px;color:#1e293b;font-weight:500;">${v.email ? `<a href="mailto:${v.email}" style="color:#0ea5e9;text-decoration:none;">${v.email}</a>` : '-'}</div>
              </div>
              <div style="grid-column: 1 / -1;">
                <div style="font-size:12px;color:#64748b;margin-bottom:4px;">City / Area</div>
                <div style="font-size:14px;color:#1e293b;font-weight:500;">${v.city || '-'}</div>
              </div>
            </div>
          </div>

          <div>
            <h3 style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;margin:0 0 12px;font-weight:700;border-bottom:1px solid #f1f5f9;padding-bottom:8px;">Visit Details</h3>
            <div style="display:grid;grid-template-columns:1fr;gap:16px;">
              <div>
                <div style="font-size:12px;color:#64748b;margin-bottom:4px;">Planning to Visit?</div>
                <div style="font-size:14px;color:#1e293b;font-weight:500;background:#f8fafc;padding:12px;border-radius:6px;border:1px solid #e2e8f0;">${v.visit_intent || 'Not specified'}</div>
              </div>
              <div>
                <div style="font-size:12px;color:#64748b;margin-bottom:4px;">How did they hear about us?</div>
                <div style="font-size:14px;color:#1e293b;font-weight:500;background:#f8fafc;padding:12px;border-radius:6px;border:1px solid #e2e8f0;">${v.heard_about_us || 'Not specified'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('admin-visitor-modal-close').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
  }
}
