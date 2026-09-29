import { API_BASE } from '../apiConfig.js';
import { supabaseClient } from '../supabaseFrontendClient.js';
import { AdminLayout } from './AdminLayout.js';

export class AdminUsers {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.users = [];
    this.session = null;
    this.API_URL = `${API_BASE}/admin-users`;
  }

  async authHeaders() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` };
  }

  async render(session) {
    this.session = session;
    this.renderLayout();
    await this.fetchUsers();
  }

  async fetchUsers() {
    try {
      const res = await fetch(this.API_URL, { headers: await this.authHeaders() });
      if (!res.ok) throw new Error('Failed to fetch');
      this.users = await res.json();
      this.renderTable();
      this.renderStats();
    } catch (err) {
      console.error(err);
    }
  }

  showToast(msg, type = 'success') {
    const toast = document.getElementById('au-toast');
    toast.textContent = msg;
    toast.className = `au-toast au-toast-${type} show`;
    setTimeout(() => toast.classList.remove('show'), 3000);
  }

  renderStats() {
    const total = this.users.length;
    const superAdmins = this.users.filter(u => u.role === 'super_admin').length;
    const admins = this.users.filter(u => u.role === 'admin').length;
    const active = this.users.filter(u => u.is_active).length;
    document.getElementById('au-stat-total').textContent = total;
    document.getElementById('au-stat-super').textContent = superAdmins;
    document.getElementById('au-stat-admins').textContent = admins;
    document.getElementById('au-stat-active').textContent = active;
  }

  renderTable() {
    const tbody = document.getElementById('au-table-body');
    if (!this.users.length) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:40px;color:#6b7280;">No admin users found.</td></tr>`;
      return;
    }

    tbody.innerHTML = this.users.map(user => {
      const isSelf = user.id === this.session?.user?.id;
      const roleColor = user.role === 'super_admin' ? '#b47a18' : '#1d4ed8';
      const roleBg = user.role === 'super_admin' ? '#fdf5e6' : '#eff6ff';
      const statusBadge = user.is_active
        ? `<span class="au-badge au-badge-green">Active</span>`
        : `<span class="au-badge au-badge-red">Disabled</span>`;
      const lastLogin = user.last_sign_in
        ? new Date(user.last_sign_in).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
        : 'Never';

      return `
        <tr>
          <td>
            <div class="au-user-cell">
              <div class="au-avatar">${(user.name || user.email)[0].toUpperCase()}</div>
              <div>
                <div class="au-name">${user.name || '—'} ${isSelf ? '<span class="au-you-tag">You</span>' : ''}</div>
                <div class="au-email">${user.email}</div>
              </div>
            </div>
          </td>
          <td><span class="au-badge" style="background:${roleBg};color:${roleColor}">${user.role === 'super_admin' ? '👑 Super Admin' : '🛠️ Admin'}</span></td>
          <td>${statusBadge}</td>
          <td style="font-size:13px;color:#6b7280;">${lastLogin}</td>
          <td>
            <div class="au-actions">
              ${!isSelf ? `
                <button class="au-btn-icon au-btn-edit" data-id="${user.id}" title="Edit">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button class="au-btn-icon ${user.is_active ? 'au-btn-warn' : 'au-btn-success'}" data-id="${user.id}" data-active="${user.is_active}" title="${user.is_active ? 'Disable' : 'Enable'}">
                  ${user.is_active
                    ? `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>`
                    : `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`
                  }
                </button>
                <button class="au-btn-icon au-btn-delete" data-id="${user.id}" title="Delete">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
              ` : `<span style="font-size:12px;color:#9ca3af;font-style:italic;">Current user</span>`}
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Bind actions
    tbody.querySelectorAll('.au-btn-edit').forEach(btn => {
      btn.addEventListener('click', () => {
        const user = this.users.find(u => u.id === btn.dataset.id);
        if (user) this.openEditModal(user);
      });
    });
    tbody.querySelectorAll('.au-btn-delete').forEach(btn => {
      btn.addEventListener('click', () => this.deleteUser(btn.dataset.id));
    });
    tbody.querySelectorAll('.au-btn-warn, .au-btn-success').forEach(btn => {
      btn.addEventListener('click', () => {
        const isActive = btn.dataset.active === 'true';
        this.toggleActive(btn.dataset.id, !isActive);
      });
    });
  }

  openAddModal() {
    document.getElementById('au-modal-title').textContent = 'Add New Admin';
    document.getElementById('au-modal-form').reset();
    document.getElementById('au-modal-id').value = '';
    document.getElementById('au-email-group').style.display = 'block';
    document.getElementById('au-password-group').style.display = 'block';
    document.getElementById('au-modal').classList.add('open');
  }

  openEditModal(user) {
    document.getElementById('au-modal-title').textContent = 'Edit Admin';
    document.getElementById('au-modal-id').value = user.id;
    document.getElementById('au-modal-name').value = user.name || '';
    document.getElementById('au-modal-email').value = user.email;
    document.getElementById('au-modal-role').value = user.role;
    document.getElementById('au-modal-password').value = '';
    document.getElementById('au-email-group').style.display = 'block';
    document.getElementById('au-password-group').style.display = 'block';
    document.getElementById('au-modal').classList.add('open');
  }

  closeModal() {
    document.getElementById('au-modal').classList.remove('open');
  }

  async saveUser(e) {
    e.preventDefault();
    const form = e.target;
    const id = document.getElementById('au-modal-id').value;
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const password = form.password.value;
    const role = form.role.value;
    const btn = form.querySelector('[type="submit"]');

    btn.textContent = 'Saving...';
    btn.disabled = true;

    try {
      const headers = await this.authHeaders();
      if (id) {
        // Edit
        const body = { name, role };
        if (email) body.email = email;
        if (password) body.password = password;
        const res = await fetch(`${this.API_URL}/${id}`, { method: 'PUT', headers, body: JSON.stringify(body) });
        if (!res.ok) throw new Error((await res.json()).error);
        this.showToast('Admin updated successfully!');
      } else {
        // Add
        if (!password) { alert('Password is required for new admin.'); return; }
        const res = await fetch(this.API_URL, { method: 'POST', headers, body: JSON.stringify({ name, email, password, role }) });
        if (!res.ok) throw new Error((await res.json()).error);
        this.showToast('Admin added successfully!');
      }
      this.closeModal();
      await this.fetchUsers();
    } catch (err) {
      this.showToast(err.message || 'Failed to save.', 'error');
    } finally {
      btn.textContent = 'Save';
      btn.disabled = false;
    }
  }

  async deleteUser(id) {
    if (!confirm('Are you sure you want to permanently delete this admin account?')) return;
    try {
      const res = await fetch(`${this.API_URL}/${id}`, { method: 'DELETE', headers: await this.authHeaders() });
      if (!res.ok) throw new Error((await res.json()).error);
      this.showToast('Admin deleted.');
      await this.fetchUsers();
    } catch (err) {
      this.showToast(err.message || 'Failed to delete.', 'error');
    }
  }

  async toggleActive(id, is_active) {
    try {
      const res = await fetch(`${this.API_URL}/${id}/toggle-active`, {
        method: 'PATCH',
        headers: await this.authHeaders(),
        body: JSON.stringify({ is_active })
      });
      if (!res.ok) throw new Error((await res.json()).error);
      this.showToast(is_active ? 'Admin enabled.' : 'Admin disabled.');
      await this.fetchUsers();
    } catch (err) {
      this.showToast(err.message || 'Failed.', 'error');
    }
  }

  renderLayout() {
    const userName = this.session?.user?.user_metadata?.name || 'Admin User';
    const userRole = this.session?.user?.user_metadata?.role === 'super_admin' ? 'Super Admin' : 'Admin';
    const userInitial = userName[0].toUpperCase();

    const pageContent = `
      <style>
        .au-wrap { font-family: 'Inter', sans-serif; }
        .au-page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px; }
        .au-page-title { font-family: 'Playfair Display', serif; font-size: 26px; margin: 0 0 4px 0; color: #111827; }
        .au-page-desc { color: #6b7280; font-size: 13px; margin: 0; }
        .au-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
        .au-stat-card { background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; display: flex; align-items: center; gap: 16px; }
        .au-stat-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .au-stat-num { font-size: 28px; font-weight: 700; line-height: 1; }
        .au-stat-label { font-size: 12px; color: #6b7280; font-weight: 500; margin-top: 2px; }
        .au-table-wrap { background: white; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; }
        .au-table-wrap table { width: 100%; border-collapse: collapse; }
        .au-table-wrap th { padding: 13px 20px; font-size: 11px; font-weight: 600; color: #6b7280; border-bottom: 1px solid #e5e7eb; text-transform: uppercase; letter-spacing: 0.5px; text-align: left; background: #fafafa; }
        .au-table-wrap td { padding: 15px 20px; border-bottom: 1px solid #f3f4f6; vertical-align: middle; }
        .au-table-wrap tr:last-child td { border-bottom: none; }
        .au-table-wrap tr:hover td { background: #fafafa; }
        .au-user-cell { display: flex; align-items: center; gap: 12px; }
        .au-avatar { width: 38px; height: 38px; border-radius: 50%; background: #003F3A; color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 15px; flex-shrink: 0; }
        .au-name { font-weight: 600; font-size: 14px; color: #111827; }
        .au-email { font-size: 12px; color: #6b7280; }
        .au-you-tag { background: #dbeafe; color: #1d4ed8; font-size: 10px; padding: 2px 7px; border-radius: 10px; font-weight: 600; margin-left: 6px; vertical-align: middle; }
        .au-badge { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
        .au-badge-green { background: #dcfce7; color: #16a34a; }
        .au-badge-red { background: #fee2e2; color: #b91c1c; }
        .au-badge-gold { background: #fef9c3; color: #b45309; }
        .au-badge-blue { background: #dbeafe; color: #1d4ed8; }
        .au-actions { display: flex; gap: 6px; align-items: center; }
        .au-btn-icon { width: 32px; height: 32px; border-radius: 7px; border: 1px solid #e5e7eb; background: white; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.2s; color: #6b7280; }
        .au-btn-edit:hover { background: #eff6ff; color: #1d4ed8; border-color: #bfdbfe; }
        .au-btn-warn:hover { background: #fff7ed; color: #c2410c; border-color: #fed7aa; }
        .au-btn-success:hover { background: #f0fdf4; color: #15803d; border-color: #bbf7d0; }
        .au-btn-delete:hover { background: #fee2e2; color: #dc2626; border-color: #fca5a5; }
        .au-btn-primary { background: #9B1023; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 600; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: 0.2s; }
        .au-btn-primary:hover { background: #7A0C1C; }
        .au-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 999; display: none; align-items: center; justify-content: center; }
        .au-modal-overlay.open { display: flex; }
        .au-modal { background: white; border-radius: 16px; padding: 32px; width: 100%; max-width: 460px; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
        .au-modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
        .au-modal-title-text { font-family: 'Playfair Display', serif; font-size: 22px; margin: 0; }
        .au-modal-close { background: none; border: none; cursor: pointer; color: #6b7280; font-size: 22px; line-height: 1; }
        .au-form-group { margin-bottom: 18px; }
        .au-label { display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 6px; }
        .au-input, .au-select { width: 100%; padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; font-family: inherit; outline: none; box-sizing: border-box; transition: 0.2s; }
        .au-input:focus, .au-select:focus { border-color: #003F3A; box-shadow: 0 0 0 3px rgba(0,63,58,0.1); }
        .au-modal-footer { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; }
        .au-btn-cancel { background: white; border: 1px solid #d1d5db; color: #374151; padding: 10px 20px; border-radius: 8px; font-weight: 600; font-size: 14px; cursor: pointer; }
        .au-toast { position: fixed; bottom: 24px; right: 24px; padding: 12px 24px; border-radius: 8px; font-size: 13px; font-weight: 600; transform: translateY(80px); opacity: 0; transition: 0.3s; z-index: 2000; box-shadow: 0 8px 24px rgba(0,0,0,0.15); }
        .au-toast.show { transform: translateY(0); opacity: 1; }
        .au-toast-success { background: #003F3A; color: white; }
        .au-toast-error { background: #dc2626; color: white; }
        @media (max-width: 768px) { .au-stats { grid-template-columns: 1fr 1fr; } }
      </style>

      <div class="au-wrap">
        <div class="au-page-header">
          <div>
            <h2 class="au-page-title">Admin Users</h2>
            <p class="au-page-desc">Manage who has access to the Centenary Baptist Church CMS.</p>
          </div>
          <button class="au-btn-primary" id="au-add-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            + Add Admin
          </button>
        </div>

        <div class="au-stats">
          <div class="au-stat-card">
            <div class="au-stat-icon" style="background:#e0f2fe;">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#0369a1"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
            </div>
            <div><div class="au-stat-num" id="au-stat-total" style="color:#0369a1;">0</div><div class="au-stat-label">Total Users</div></div>
          </div>
          <div class="au-stat-card">
            <div class="au-stat-icon" style="background:#fef9c3;">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#b45309"><path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm2.1-2h9.8l1-5.3-3.3 3.5-2.6-4.5-2.6 4.5-3.3-3.5 1 5.3z"/></svg>
            </div>
            <div><div class="au-stat-num" id="au-stat-super" style="color:#b45309;">0</div><div class="au-stat-label">Super Admins</div></div>
          </div>
          <div class="au-stat-card">
            <div class="au-stat-icon" style="background:#ede9fe;">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#7c3aed"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
            </div>
            <div><div class="au-stat-num" id="au-stat-admins" style="color:#7c3aed;">0</div><div class="au-stat-label">Admins</div></div>
          </div>
          <div class="au-stat-card">
            <div class="au-stat-icon" style="background:#dcfce7;">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#16a34a"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
            </div>
            <div><div class="au-stat-num" id="au-stat-active" style="color:#16a34a;">0</div><div class="au-stat-label">Active</div></div>
          </div>
        </div>

        <div class="au-table-wrap">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Last Login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="au-table-body">
              <tr><td colspan="5" style="text-align:center;padding:40px;color:#9ca3af;">Loading...</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Modal -->
      <div class="au-modal-overlay" id="au-modal">
        <div class="au-modal">
          <div class="au-modal-header">
            <h3 class="au-modal-title-text" id="au-modal-title">Add New Admin</h3>
            <button class="au-modal-close" id="au-modal-close-btn">&times;</button>
          </div>
          <form id="au-modal-form">
            <input type="hidden" id="au-modal-id">
            <div class="au-form-group">
              <label class="au-label">Full Name *</label>
              <input type="text" name="name" id="au-modal-name" class="au-input" placeholder="e.g., John Sudhakar" required>
            </div>
            <div class="au-form-group" id="au-email-group">
              <label class="au-label">Email Address *</label>
              <input type="email" name="email" id="au-modal-email" class="au-input" placeholder="admin@cbcsecbad.in">
            </div>
            <div class="au-form-group" id="au-password-group">
              <label class="au-label">Password <span style="color:#9ca3af;font-weight:400;">(leave blank to keep current)</span></label>
              <input type="password" name="password" id="au-modal-password" class="au-input" placeholder="Min 8 characters">
            </div>
            <div class="au-form-group">
              <label class="au-label">Role *</label>
              <select name="role" id="au-modal-role" class="au-select">
                <option value="admin">🛠️ Admin</option>
                <option value="super_admin">👑 Super Admin</option>
              </select>
            </div>
            <div class="au-modal-footer">
              <button type="button" class="au-btn-cancel" id="au-modal-cancel-btn">Cancel</button>
              <button type="submit" class="au-btn-primary">Save</button>
            </div>
          </form>
        </div>
      </div>

      <div class="au-toast" id="au-toast"></div>
    `;

    // Wrap with the shared admin layout (sidebar + topbar)
    this.container.innerHTML = AdminLayout.getLayout(pageContent, '/admin/users');

    // Inject user info into the topbar after rendering
    const userAvatarEl = document.querySelector('.user-avatar');
    const userNameEl = document.querySelector('.user-info strong');
    const userRoleEl = document.querySelector('.user-info span');
    if (userAvatarEl) userAvatarEl.textContent = userInitial;
    if (userNameEl) userNameEl.textContent = userName;
    if (userRoleEl) userRoleEl.textContent = userRole;

    document.getElementById('au-add-btn').addEventListener('click', () => this.openAddModal());
    document.getElementById('au-modal-close-btn').addEventListener('click', () => this.closeModal());
    document.getElementById('au-modal-cancel-btn').addEventListener('click', () => this.closeModal());
    document.getElementById('au-modal-form').addEventListener('submit', (e) => this.saveUser(e));
  }
}
