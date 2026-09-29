import { API_BASE } from '../apiConfig.js';
import { supabaseClient } from '../supabaseFrontendClient.js';
import { AdminLayout } from './AdminLayout.js';

const ACTION_COLORS = {
  created:  { bg: '#f0fdf4', color: '#16a34a', dot: '#22c55e' },
  updated:  { bg: '#eff6ff', color: '#2563eb', dot: '#3b82f6' },
  deleted:  { bg: '#fee2e2', color: '#dc2626', dot: '#ef4444' },
  uploaded: { bg: '#fefce8', color: '#ca8a04', dot: '#eab308' },
  login:    { bg: '#f5f3ff', color: '#7c3aed', dot: '#8b5cf6' },
  logout:   { bg: '#f8fafc', color: '#64748b', dot: '#94a3b8' },
};

const ENTITY_ICONS = {
  sermon:     '🎙️',
  event:      '📅',
  gallery:    '🖼️',
  ministry:   '⛪',
  campus:     '🏛️',
  media:      '📁',
  settings:   '⚙️',
  user:       '👤',
  audit_logs: '📋',
};

export class AdminAuditLogs {
  constructor(containerId) {
    this.container  = document.getElementById(containerId);
    this.logs       = [];
    this.filtered   = [];
    this.API_URL    = `${API_BASE}/audit-logs`;
    this.filterAction = '';
    this.filterType   = '';
    this.searchQuery  = '';
  }
  async authHeaders(isFormData = false) {
    const { data: { session } } = await supabaseClient.auth.getSession();
    const headers = { Authorization: `Bearer ${session?.access_token}` };
    if (!isFormData) headers['Content-Type'] = 'application/json';
    return headers;
  }


  // ─── Data ─────────────────────────────────────────────────────────────────

  async fetchLogs() {
    const tbody = document.getElementById('al-tbody');
    if (tbody) tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:48px;color:#94a3b8;">Loading logs…</td></tr>`;

    try {
      const res = await fetch(`${this.API_URL}?limit=500`);
      if (!res.ok) throw new Error('Failed');
      this.logs     = await res.json();
      this.filtered = [...this.logs];
      this.applyFilters();
      this.updateStats();
    } catch {
      this.showToast('Failed to load audit logs.', 'error');
      if (tbody) tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:48px;color:#ef4444;">Failed to load. Make sure the server is running.</td></tr>`;
    }
  }

  // ─── Toast ────────────────────────────────────────────────────────────────

  showToast(msg, type = 'success') {
    const t = document.getElementById('al-toast');
    if (!t) return;
    t.textContent = msg;
    t.className   = `al-toast al-toast-${type} show`;
    setTimeout(() => t.classList.remove('show'), 3200);
  }

  // ─── Stats ────────────────────────────────────────────────────────────────

  updateStats() {
    const s = id => document.getElementById(id);
    if (s('al-stat-total'))   s('al-stat-total').textContent   = this.logs.length;
    if (s('al-stat-created')) s('al-stat-created').textContent = this.logs.filter(l => l.action === 'created').length;
    if (s('al-stat-updated')) s('al-stat-updated').textContent = this.logs.filter(l => l.action === 'updated').length;
    if (s('al-stat-deleted')) s('al-stat-deleted').textContent = this.logs.filter(l => l.action === 'deleted').length;
  }

  // ─── Filters ──────────────────────────────────────────────────────────────

  applyFilters() {
    this.filtered = this.logs.filter(l => {
      const matchAction = !this.filterAction || l.action      === this.filterAction;
      const matchType   = !this.filterType   || l.entity_type === this.filterType;
      const matchSearch = !this.searchQuery  ||
        (l.entity_name || '').toLowerCase().includes(this.searchQuery) ||
        (l.user_email  || '').toLowerCase().includes(this.searchQuery) ||
        (l.action      || '').toLowerCase().includes(this.searchQuery) ||
        (l.entity_type || '').toLowerCase().includes(this.searchQuery);
      return matchAction && matchType && matchSearch;
    });
    this.renderTable();

    // Update showing count
    const el = document.getElementById('al-stat-showing');
    if (el) el.textContent = `${this.filtered.length} of ${this.logs.length}`;
  }

  // ─── Clear Logs ───────────────────────────────────────────────────────────

  async clearAllLogs() {
    if (!confirm('Clear ALL audit logs?\n\nThis permanently deletes every log entry and cannot be undone.')) return;
    try {
      const res = await fetch(this.API_URL, { method: 'DELETE', headers: await this.authHeaders() });
      if (!res.ok) throw new Error();
      this.logs     = [];
      this.filtered = [];
      this.renderTable();
      this.updateStats();
      this.showToast('All logs cleared.');
    } catch {
      this.showToast('Failed to clear logs.', 'error');
    }
  }

  // ─── Table ────────────────────────────────────────────────────────────────

  renderTable() {
    const tbody = document.getElementById('al-tbody');
    if (!tbody) return;

    if (!this.filtered.length) {
      tbody.innerHTML = `
        <tr><td colspan="6" style="text-align:center;padding:56px;color:#94a3b8;">
          <div style="font-size:40px;margin-bottom:12px;">📋</div>
          <div style="font-weight:600;font-size:15px;">${this.searchQuery || this.filterAction || this.filterType ? 'No logs match your filters.' : 'No audit logs yet.'}</div>
          <div style="font-size:13px;margin-top:6px;color:#cbd5e1;">${!this.searchQuery && !this.filterAction && !this.filterType ? 'Logs will appear here as admins create, edit, or delete content.' : ''}</div>
        </td></tr>`;
      return;
    }

    tbody.innerHTML = this.filtered.map(log => {
      const ac     = ACTION_COLORS[log.action] || ACTION_COLORS.updated;
      const icon   = ENTITY_ICONS[log.entity_type] || '📝';
      const time   = log.created_at ? new Date(log.created_at).toLocaleString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—';
      const badge  = `<span style="display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:999px;background:${ac.bg};color:${ac.color};font-size:11px;font-weight:700;text-transform:capitalize;">
        <span style="width:6px;height:6px;border-radius:50%;background:${ac.dot};display:inline-block;"></span>${log.action}
      </span>`;

      return `
        <tr style="border-top:1px solid #f1f5f9;transition:background .15s;">
          <td style="padding:14px 16px;white-space:nowrap;font-size:12px;color:#64748b;">${time}</td>
          <td style="padding:14px 16px;">${badge}</td>
          <td style="padding:14px 16px;">
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="font-size:18px;">${icon}</span>
              <div>
                <div style="font-size:12px;font-weight:700;color:#64748b;text-transform:capitalize;">${log.entity_type || '—'}</div>
                <div style="font-size:13px;font-weight:600;color:#1e293b;">${log.entity_name || '—'}</div>
              </div>
            </div>
          </td>
          <td style="padding:14px 16px;font-size:13px;color:#374151;">${log.user_email || '<span style="color:#94a3b8;">—</span>'}</td>
          <td style="padding:14px 16px;font-size:12px;color:#94a3b8;">${log.ip_address || '—'}</td>
          <td style="padding:14px 16px;max-width:200px;">
            ${log.details ? `<details style="font-size:11px;color:#64748b;cursor:pointer;"><summary style="font-weight:600;color:#475569;">View details</summary><pre style="margin:6px 0 0;font-size:10px;background:#f8fafc;padding:8px;border-radius:6px;overflow:auto;max-height:80px;">${JSON.stringify(log.details, null, 2)}</pre></details>` : '<span style="color:#cbd5e1;font-size:12px;">—</span>'}
          </td>
        </tr>
      `;
    }).join('');
  }

  // ─── Render Shell ─────────────────────────────────────────────────────────

  render() {
    const actionOptions = ['', 'created', 'updated', 'deleted', 'uploaded', 'login', 'logout']
      .map(a => `<option value="${a}">${a ? a.charAt(0).toUpperCase() + a.slice(1) : 'All Actions'}</option>`).join('');

    const typeOptions = ['', 'sermon', 'event', 'gallery', 'ministry', 'campus', 'media', 'settings', 'user']
      .map(t => `<option value="${t}">${t ? t.charAt(0).toUpperCase() + t.slice(1) : 'All Types'}</option>`).join('');

    const content = `
      <style>
        .al-toast{position:fixed;bottom:28px;right:28px;padding:12px 22px;border-radius:10px;font-size:14px;font-weight:600;z-index:9999;opacity:0;transform:translateY(12px);transition:all .3s;pointer-events:none;}
        .al-toast.show{opacity:1;transform:translateY(0);}
        .al-toast-success{background:#003F3A;color:#fff;}
        .al-toast-error{background:#dc2626;color:#fff;}
        .al-table{width:100%;border-collapse:collapse;}
        .al-table thead tr{background:#f8fafc;}
        .al-table thead th{padding:12px 16px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#64748b;text-align:left;white-space:nowrap;}
        .al-table tbody tr:hover{background:#fafbfc;}
        .al-filter-bar{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding-bottom:18px;}
        .al-filter-bar select,.al-filter-bar input{padding:9px 14px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:13px;font-family:inherit;color:#374151;background:#fff;transition:border-color .2s;}
        .al-filter-bar select:focus,.al-filter-bar input:focus{outline:none;border-color:#003F3A;}
        .al-filter-bar input{flex:1;min-width:180px;}
      </style>

      <div id="al-toast" class="al-toast"></div>

      <!-- Page Header -->
      <div class="admin-header">
        <h2>Audit Logs</h2>
        <p>A record of every admin action — who created, edited, or deleted what and when.</p>
      </div>

      <!-- Stats -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:16px;margin-bottom:28px;">
        <div style="background:#fff;border-radius:12px;padding:20px 24px;box-shadow:0 1px 4px rgba(0,0,0,0.06);border:1px solid #f1f5f9;">
          <div style="font-size:28px;font-weight:800;color:#1e293b;" id="al-stat-total">—</div>
          <div style="font-size:11px;color:#64748b;font-weight:700;margin-top:4px;text-transform:uppercase;letter-spacing:.5px;">Total Logs</div>
        </div>
        <div style="background:#f0fdf4;border-radius:12px;padding:20px 24px;box-shadow:0 1px 4px rgba(0,0,0,0.06);border:1px solid #dcfce7;">
          <div style="font-size:28px;font-weight:800;color:#16a34a;" id="al-stat-created">—</div>
          <div style="font-size:11px;color:#16a34a;font-weight:700;margin-top:4px;text-transform:uppercase;letter-spacing:.5px;">Created</div>
        </div>
        <div style="background:#eff6ff;border-radius:12px;padding:20px 24px;box-shadow:0 1px 4px rgba(0,0,0,0.06);border:1px solid #dbeafe;">
          <div style="font-size:28px;font-weight:800;color:#2563eb;" id="al-stat-updated">—</div>
          <div style="font-size:11px;color:#2563eb;font-weight:700;margin-top:4px;text-transform:uppercase;letter-spacing:.5px;">Updated</div>
        </div>
        <div style="background:#fee2e2;border-radius:12px;padding:20px 24px;box-shadow:0 1px 4px rgba(0,0,0,0.06);border:1px solid #fecaca;">
          <div style="font-size:28px;font-weight:800;color:#dc2626;" id="al-stat-deleted">—</div>
          <div style="font-size:11px;color:#dc2626;font-weight:700;margin-top:4px;text-transform:uppercase;letter-spacing:.5px;">Deleted</div>
        </div>
      </div>

      <!-- Log Table -->
      <div class="admin-card">
        <div class="admin-card-header" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">
          <div>
            <h3 style="margin:0 0 4px;">Activity Log</h3>
            <p style="margin:0;font-size:12px;color:#94a3b8;" id="al-stat-showing">Loading…</p>
          </div>
          <div style="display:flex;gap:8px;align-items:center;">
            <button id="al-refresh-btn" style="padding:8px 16px;border:1.5px solid #e2e8f0;border-radius:8px;background:#fff;font-size:13px;font-weight:600;color:#64748b;cursor:pointer;">↻ Refresh</button>
            <button id="al-clear-btn" style="padding:8px 16px;border:none;border-radius:8px;background:#fee2e2;font-size:13px;font-weight:600;color:#dc2626;cursor:pointer;">🗑 Clear All</button>
          </div>
        </div>

        <!-- Filter Bar -->
        <div class="al-filter-bar">
          <select id="al-filter-action">${actionOptions}</select>
          <select id="al-filter-type">${typeOptions}</select>
          <input type="text" id="al-search" placeholder="Search by name, email, action…">
        </div>

        <div style="overflow-x:auto;">
          <table class="al-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Action</th>
                <th>Item</th>
                <th>Admin</th>
                <th>IP</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody id="al-tbody">
              <tr><td colspan="6" style="text-align:center;padding:48px;color:#94a3b8;">Loading…</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    `;

    this.container.innerHTML = AdminLayout.getLayout(content, '/admin/logs');

    // Bind filter events
    document.getElementById('al-filter-action').addEventListener('change', e => {
      this.filterAction = e.target.value;
      this.applyFilters();
    });
    document.getElementById('al-filter-type').addEventListener('change', e => {
      this.filterType = e.target.value;
      this.applyFilters();
    });
    document.getElementById('al-search').addEventListener('input', e => {
      this.searchQuery = e.target.value.toLowerCase();
      this.applyFilters();
    });
    document.getElementById('al-refresh-btn').addEventListener('click', () => this.fetchLogs());
    document.getElementById('al-clear-btn').addEventListener('click', () => this.clearAllLogs());

    this.fetchLogs();
  }
}
