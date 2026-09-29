import { API_BASE } from '../apiConfig.js';
import { supabaseClient } from '../supabaseFrontendClient.js';
import { AdminLayout } from './AdminLayout.js';

const CATEGORIES = [
  { value: 'pastoral',  label: 'Pastoral Team' },
  { value: 'executive', label: 'Executive Committee' }
];

export class AdminLeadership {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.leaders   = [];
    this.editingId = null;
    this.API_URL   = `${API_BASE}/leadership`;
    this.UPLOAD_URL = `${API_BASE}/upload`;
    this.filterCategory = 'all';
  }
  async authHeaders(isFormData = false) {
    const { data: { session } } = await supabaseClient.auth.getSession();
    const headers = { Authorization: `Bearer ${session?.access_token}` };
    if (!isFormData) headers['Content-Type'] = 'application/json';
    return headers;
  }


  // ─── Data ─────────────────────────────────────────────────────────────────

  async fetchLeaders() {
    try {
      const res = await fetch(this.API_URL);
      if (!res.ok) throw new Error('Failed to fetch');
      this.leaders = await res.json();
      this.renderTable();
      this.updateStats();
    } catch (err) {
      console.error(err);
      this.showToast('Failed to load leadership data.', 'error');
    }
  }

  // ─── Toast ────────────────────────────────────────────────────────────────

  showToast(msg, type = 'success') {
    const toast = document.getElementById('al-toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.className = `al-toast al-toast-${type} show`;
    setTimeout(() => toast.classList.remove('show'), 3200);
  }

  // ─── Stats ────────────────────────────────────────────────────────────────

  updateStats() {
    const total    = this.leaders.length;
    const pastoral = this.leaders.filter(l => l.category === 'pastoral').length;
    const exec     = this.leaders.filter(l => l.category === 'executive').length;
    const el = id => document.getElementById(id);
    if (el('al-stat-total'))    el('al-stat-total').textContent    = total;
    if (el('al-stat-pastoral')) el('al-stat-pastoral').textContent = pastoral;
    if (el('al-stat-exec'))     el('al-stat-exec').textContent     = exec;
  }

  // ─── Modal ────────────────────────────────────────────────────────────────

  openForm(leader = null) {
    this.editingId = leader ? leader.id : null;
    const modal = document.getElementById('al-modal');
    const title = document.getElementById('al-modal-title');
    const form  = document.getElementById('al-form');

    title.textContent = leader ? 'Edit Leader' : 'Add New Leader';

    form['l-name'].value        = leader?.name        || '';
    form['l-role'].value        = leader?.role        || '';
    form['l-category'].value    = leader?.category    || 'pastoral';
    form['l-bio'].value         = leader?.bio         || '';
    form['l-order_index'].value = leader?.order_index ?? 99;
    form['l-is_active'].checked = leader ? leader.is_active : true;

    // Image preview
    const preview = document.getElementById('al-img-preview');
    const imgUrlInput = document.getElementById('al-img-url');
    imgUrlInput.value = leader?.image_url || '';
    preview.innerHTML = leader?.image_url
      ? `<img src="${leader.image_url}" alt="preview" style="width:90px;height:90px;border-radius:50%;object-fit:cover;border:3px solid #e5e7eb;">`
      : `<div style="width:90px;height:90px;border-radius:50%;background:#f1f5f9;display:flex;align-items:center;justify-content:center;border:3px dashed #cbd5e1;">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
         </div>`;

    modal.classList.add('open');
    form['l-name'].focus();
  }

  closeForm() {
    document.getElementById('al-modal')?.classList.remove('open');
    this.editingId = null;
  }

  // ─── Media Picker ─────────────────────────────────────────────────────────

  async openMediaPicker() {
    // Fetch media files from API
    let files = [];
    try {
      const res = await fetch(`${API_BASE}/media`);
      files = await res.json();
    } catch {
      this.showToast('Failed to load media library.', 'error');
      return;
    }

    const picker = document.getElementById('al-media-picker');
    const grid   = document.getElementById('al-media-grid');

    grid.innerHTML = files.length === 0
      ? `<p style="grid-column:1/-1;text-align:center;color:#94a3b8;padding:40px;">No images uploaded yet. Use the <a href="#/admin/media" style="color:#003F3A;">Media Library</a> to upload photos.</p>`
      : files.map(f => `
          <div class="al-media-item" data-url="${f.url}" title="${f.name}">
            <img src="${f.url}" alt="${f.name}" style="width:100%;height:80px;object-fit:cover;border-radius:8px;">
            <div style="font-size:11px;color:#64748b;margin-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${f.name}</div>
          </div>
        `).join('');

    // Bind click
    grid.querySelectorAll('.al-media-item').forEach(item => {
      item.addEventListener('click', () => {
        const url = item.dataset.url;
        document.getElementById('al-img-url').value = url;
        document.getElementById('al-img-preview').innerHTML =
          `<img src="${url}" alt="preview" style="width:90px;height:90px;border-radius:50%;object-fit:cover;border:3px solid #003F3A;">`;
        picker.classList.remove('open');
      });
    });

    picker.classList.add('open');
  }

  // ─── Save ─────────────────────────────────────────────────────────────────

  async saveLeader(form) {
    const payload = {
      name:        form['l-name'].value.trim(),
      role:        form['l-role'].value.trim(),
      category:    form['l-category'].value,
      bio:         form['l-bio'].value.trim(),
      image_url:   document.getElementById('al-img-url').value.trim() || null,
      order_index: parseInt(form['l-order_index'].value) || 99,
      is_active:   form['l-is_active'].checked
    };

    if (!payload.name || !payload.role) {
      this.showToast('Name and Role are required.', 'error');
      return;
    }

    try {
      const url    = this.editingId ? `${this.API_URL}/${this.editingId}` : this.API_URL;
      const method = this.editingId ? 'PUT' : 'POST';
      const res    = await fetch(url, {
        method,
        headers: await this.authHeaders(false),
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Save failed');
      this.showToast(this.editingId ? 'Leader updated!' : 'Leader added!');
      this.closeForm();
      await this.fetchLeaders();
    } catch (err) {
      this.showToast('Failed to save. Try again.', 'error');
    }
  }

  // ─── Delete ───────────────────────────────────────────────────────────────

  async deleteLeader(id, name) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${this.API_URL}/${id}`, { method: 'DELETE', headers: await this.authHeaders() });
      if (!res.ok) throw new Error('Delete failed');
      this.showToast(`"${name}" deleted.`);
      await this.fetchLeaders();
    } catch {
      this.showToast('Failed to delete.', 'error');
    }
  }

  // ─── Table Render ─────────────────────────────────────────────────────────

  renderTable() {
    const tbody = document.getElementById('al-tbody');
    if (!tbody) return;

    const filtered = this.filterCategory === 'all'
      ? this.leaders
      : this.leaders.filter(l => l.category === this.filterCategory);

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:48px;color:#94a3b8;font-size:15px;">No leaders found. Click "Add Leader" to get started.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(l => {
      const catLabel = l.category === 'pastoral' ? 'Pastoral Team' : 'Executive Committee';
      const catColor = l.category === 'pastoral' ? '#003F3A' : '#7c3aed';
      const catBg    = l.category === 'pastoral' ? '#ecfdf5' : '#f5f3ff';

      const avatar = l.image_url
        ? `<img src="${l.image_url}" alt="${l.name}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;border:2px solid #e5e7eb;">`
        : `<div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#003F3A,#C9A84C);display:flex;align-items:center;justify-content:center;font-size:16px;color:white;font-weight:700;">${l.name.charAt(0)}</div>`;

      return `
        <tr>
          <td style="padding:14px 16px;">
            <div style="display:flex;align-items:center;gap:12px;">
              ${avatar}
              <div>
                <div style="font-weight:600;color:#111827;font-size:14px;">${l.name}</div>
                ${l.bio ? `<div style="font-size:12px;color:#6b7280;margin-top:2px;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${l.bio.substring(0, 60)}…</div>` : ''}
              </div>
            </div>
          </td>
          <td style="padding:14px 16px;font-size:14px;color:#374151;">${l.role}</td>
          <td style="padding:14px 16px;">
            <span style="display:inline-flex;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:600;color:${catColor};background:${catBg};">${catLabel}</span>
          </td>
          <td style="padding:14px 16px;font-size:13px;color:#6b7280;">${l.order_index}</td>
          <td style="padding:14px 16px;">
            <span style="display:inline-flex;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:600;
              color:${l.is_active ? '#166534' : '#9ca3af'};
              background:${l.is_active ? '#dcfce7' : '#f3f4f6'};">
              ${l.is_active ? 'Active' : 'Hidden'}
            </span>
          </td>
          <td style="padding:14px 16px;">
            <div style="display:flex;gap:8px;">
              <button onclick="window.__alEdit(${l.id})" style="padding:6px 14px;border-radius:6px;border:1px solid #e5e7eb;background:white;color:#374151;font-size:13px;cursor:pointer;font-weight:500;transition:all 0.15s;" onmouseover="this.style.background='#f9fafb'" onmouseout="this.style.background='white'">Edit</button>
              <button onclick="window.__alDelete(${l.id},'${l.name.replace(/'/g, "\\'")}')" style="padding:6px 14px;border-radius:6px;border:1px solid #fee2e2;background:white;color:#dc2626;font-size:13px;cursor:pointer;font-weight:500;transition:all 0.15s;" onmouseover="this.style.background='#fef2f2'" onmouseout="this.style.background='white'">Delete</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  async render() {
    this.container.innerHTML = AdminLayout.getLayout(this._buildHTML(), '/admin/leadership');
    await this.fetchLeaders();
    this._bindEvents();
  }

  _buildHTML() {
    return `
      <!-- Toast -->
      <div id="al-toast" class="al-toast"></div>

      <!-- Page Header -->
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:28px;flex-wrap:wrap;gap:12px;">
        <div>
          <h1 style="font-family:'Playfair Display',serif;font-size:28px;color:#111827;margin:0 0 4px;">Leadership</h1>
          <p style="color:#6b7280;font-size:14px;margin:0;">Manage pastoral team and executive committee members</p>
        </div>
        <button id="al-add-btn" style="display:inline-flex;align-items:center;gap:8px;padding:10px 22px;border-radius:8px;border:none;background:#003F3A;color:white;font-weight:600;font-size:14px;cursor:pointer;transition:background 0.2s;" onmouseover="this.style.background='#00564f'" onmouseout="this.style.background='#003F3A'">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Leader
        </button>
      </div>

      <!-- Stats Row -->
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:24px;">
        ${[
          { id:'al-stat-total',    label:'Total Members', icon:'👥', color:'#003F3A', bg:'#ecfdf5' },
          { id:'al-stat-pastoral', label:'Pastoral Team', icon:'✝',  color:'#1d4ed8', bg:'#eff6ff' },
          { id:'al-stat-exec',     label:'Executive Committee', icon:'⭐', color:'#7c3aed', bg:'#f5f3ff' }
        ].map(s => `
          <div style="background:white;border-radius:12px;padding:20px;border:1px solid #e5e7eb;display:flex;align-items:center;gap:14px;">
            <div style="width:44px;height:44px;border-radius:10px;background:${s.bg};display:flex;align-items:center;justify-content:center;font-size:20px;">${s.icon}</div>
            <div>
              <div id="${s.id}" style="font-size:26px;font-weight:700;color:${s.color};line-height:1;">—</div>
              <div style="font-size:12px;color:#6b7280;margin-top:2px;">${s.label}</div>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Filter Tabs -->
      <div style="display:flex;gap:8px;margin-bottom:16px;">
        ${[
          { val:'all',       label:'All Members' },
          { val:'pastoral',  label:'Pastoral Team' },
          { val:'executive', label:'Executive Committee' }
        ].map(f => `
          <button class="al-filter-btn${f.val === 'all' ? ' active' : ''}" data-filter="${f.val}"
            style="padding:7px 16px;border-radius:20px;border:1px solid ${f.val === 'all' ? '#003F3A' : '#e5e7eb'};
                   background:${f.val === 'all' ? '#003F3A' : 'white'};
                   color:${f.val === 'all' ? 'white' : '#374151'};
                   font-size:13px;font-weight:500;cursor:pointer;transition:all 0.2s;">
            ${f.label}
          </button>
        `).join('')}
      </div>

      <!-- Table -->
      <div style="background:white;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr style="background:#f8fafc;border-bottom:1px solid #e5e7eb;">
              <th style="padding:12px 16px;text-align:left;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Name</th>
              <th style="padding:12px 16px;text-align:left;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Role</th>
              <th style="padding:12px 16px;text-align:left;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Category</th>
              <th style="padding:12px 16px;text-align:left;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Order</th>
              <th style="padding:12px 16px;text-align:left;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Status</th>
              <th style="padding:12px 16px;text-align:left;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Actions</th>
            </tr>
          </thead>
          <tbody id="al-tbody">
            <tr><td colspan="6" style="text-align:center;padding:48px;color:#94a3b8;">Loading…</td></tr>
          </tbody>
        </table>
      </div>

      <!-- Add/Edit Modal -->
      <div id="al-modal" style="position:fixed;inset:0;z-index:1000;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,0.5);backdrop-filter:blur(4px);">
        <div style="background:white;border-radius:16px;padding:32px;width:100%;max-width:540px;max-height:90vh;overflow-y:auto;position:relative;margin:16px;">
          <button id="al-modal-close" style="position:absolute;top:16px;right:16px;background:none;border:none;cursor:pointer;padding:4px;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>

          <h2 id="al-modal-title" style="font-family:'Playfair Display',serif;font-size:22px;color:#111827;margin:0 0 24px;">Add New Leader</h2>

          <form id="al-form">
            <!-- Photo -->
            <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px;">
              <div id="al-img-preview">
                <div style="width:90px;height:90px;border-radius:50%;background:#f1f5f9;display:flex;align-items:center;justify-content:center;border:3px dashed #cbd5e1;">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                </div>
              </div>
              <div style="flex:1;">
                <div style="font-size:13px;font-weight:600;color:#374151;margin-bottom:8px;">Profile Photo</div>
                <button type="button" id="al-pick-media" style="display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:7px;border:1px solid #e5e7eb;background:#f8fafc;color:#374151;font-size:13px;cursor:pointer;">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  Pick from Media Library
                </button>
                <input type="hidden" id="al-img-url" value="">
                <div style="font-size:11px;color:#9ca3af;margin-top:6px;">Upload photos in Media Library first, then pick here.</div>
              </div>
            </div>

            <!-- Name -->
            <div style="margin-bottom:16px;">
              <label style="display:block;font-size:13px;font-weight:600;color:#374151;margin-bottom:6px;">Name <span style="color:#dc2626;">*</span></label>
              <input name="l-name" type="text" placeholder="Rev. Dr. Full Name" required
                style="width:100%;padding:9px 12px;border:1px solid #e5e7eb;border-radius:8px;font-size:14px;box-sizing:border-box;outline:none;transition:border 0.2s;"
                onfocus="this.style.borderColor='#003F3A'" onblur="this.style.borderColor='#e5e7eb'">
            </div>

            <!-- Role -->
            <div style="margin-bottom:16px;">
              <label style="display:block;font-size:13px;font-weight:600;color:#374151;margin-bottom:6px;">Role / Title <span style="color:#dc2626;">*</span></label>
              <input name="l-role" type="text" placeholder="e.g. Senior Pastor, President"
                style="width:100%;padding:9px 12px;border:1px solid #e5e7eb;border-radius:8px;font-size:14px;box-sizing:border-box;outline:none;transition:border 0.2s;"
                onfocus="this.style.borderColor='#003F3A'" onblur="this.style.borderColor='#e5e7eb'">
            </div>

            <!-- Category + Order (2-col) -->
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
              <div>
                <label style="display:block;font-size:13px;font-weight:600;color:#374151;margin-bottom:6px;">Category</label>
                <select name="l-category"
                  style="width:100%;padding:9px 12px;border:1px solid #e5e7eb;border-radius:8px;font-size:14px;box-sizing:border-box;outline:none;background:white;">
                  <option value="pastoral">Pastoral Team</option>
                  <option value="executive">Executive Committee</option>
                </select>
              </div>
              <div>
                <label style="display:block;font-size:13px;font-weight:600;color:#374151;margin-bottom:6px;">Display Order</label>
                <input name="l-order_index" type="number" min="1" placeholder="99"
                  style="width:100%;padding:9px 12px;border:1px solid #e5e7eb;border-radius:8px;font-size:14px;box-sizing:border-box;outline:none;">
              </div>
            </div>

            <!-- Bio -->
            <div style="margin-bottom:16px;">
              <label style="display:block;font-size:13px;font-weight:600;color:#374151;margin-bottom:6px;">Short Bio</label>
              <textarea name="l-bio" rows="4" placeholder="A brief description about this person's ministry and role…"
                style="width:100%;padding:9px 12px;border:1px solid #e5e7eb;border-radius:8px;font-size:14px;resize:vertical;box-sizing:border-box;outline:none;font-family:inherit;transition:border 0.2s;"
                onfocus="this.style.borderColor='#003F3A'" onblur="this.style.borderColor='#e5e7eb'"></textarea>
            </div>

            <!-- Active toggle -->
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:24px;">
              <label class="al-toggle">
                <input type="checkbox" name="l-is_active" checked style="display:none;">
                <span class="al-toggle-track">
                  <span class="al-toggle-thumb"></span>
                </span>
              </label>
              <span style="font-size:13px;color:#374151;font-weight:500;">Show on website</span>
            </div>

            <!-- Actions -->
            <div style="display:flex;gap:10px;justify-content:flex-end;">
              <button type="button" id="al-form-cancel" style="padding:10px 20px;border-radius:8px;border:1px solid #e5e7eb;background:white;color:#374151;font-size:14px;font-weight:500;cursor:pointer;">Cancel</button>
              <button type="submit" id="al-form-save" style="padding:10px 24px;border-radius:8px;border:none;background:#003F3A;color:white;font-size:14px;font-weight:600;cursor:pointer;transition:background 0.2s;" onmouseover="this.style.background='#00564f'" onmouseout="this.style.background='#003F3A'">Save Leader</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Media Picker Modal -->
      <div id="al-media-picker" style="position:fixed;inset:0;z-index:1100;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,0.6);backdrop-filter:blur(4px);">
        <div style="background:white;border-radius:16px;padding:28px;width:100%;max-width:680px;max-height:80vh;overflow-y:auto;margin:16px;position:relative;">
          <button id="al-media-picker-close" style="position:absolute;top:16px;right:16px;background:none;border:none;cursor:pointer;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <h3 style="font-family:'Playfair Display',serif;font-size:20px;color:#111827;margin:0 0 20px;">Pick from Media Library</h3>
          <div id="al-media-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:12px;"></div>
        </div>
      </div>

      <style>
        #al-modal.open { display: flex !important; }
        #al-media-picker.open { display: flex !important; }

        .al-toast {
          position: fixed; bottom: 28px; right: 28px; z-index: 9999;
          padding: 13px 22px; border-radius: 10px; font-size: 14px; font-weight: 500;
          color: white; opacity: 0; pointer-events: none;
          transform: translateY(10px); transition: all 0.3s ease;
          font-family: 'Inter', sans-serif; box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        }
        .al-toast.show { opacity: 1; pointer-events: auto; transform: translateY(0); }
        .al-toast-success { background: #003F3A; }
        .al-toast-error   { background: #dc2626; }

        .al-toggle { display: inline-flex; cursor: pointer; }
        .al-toggle-track {
          display: inline-block; width: 44px; height: 24px; border-radius: 12px;
          background: #e5e7eb; position: relative; transition: background 0.2s;
        }
        .al-toggle input:checked + .al-toggle-track { background: #003F3A; }
        .al-toggle-thumb {
          position: absolute; top: 2px; left: 2px; width: 20px; height: 20px;
          border-radius: 50%; background: white; transition: transform 0.2s;
          box-shadow: 0 1px 4px rgba(0,0,0,0.2);
        }
        .al-toggle input:checked + .al-toggle-track .al-toggle-thumb { transform: translateX(20px); }

        .al-filter-btn.active {
          background: #003F3A !important; color: white !important;
          border-color: #003F3A !important;
        }

        .al-media-item {
          cursor: pointer; border-radius: 8px; padding: 6px;
          border: 2px solid transparent; transition: all 0.15s;
        }
        .al-media-item:hover { border-color: #003F3A; background: #f0fdf4; }

        #al-tbody tr { border-bottom: 1px solid #f1f5f9; transition: background 0.15s; }
        #al-tbody tr:hover { background: #fafafa; }
        #al-tbody tr:last-child { border-bottom: none; }
      </style>
    `;
  }

  // ─── Events ───────────────────────────────────────────────────────────────

  _bindEvents() {
    // Global callbacks for table buttons
    window.__alEdit = (id) => {
      const leader = this.leaders.find(l => l.id === id);
      if (leader) this.openForm(leader);
    };
    window.__alDelete = (id, name) => this.deleteLeader(id, name);

    // Add button
    document.getElementById('al-add-btn')?.addEventListener('click', () => this.openForm());

    // Modal close
    document.getElementById('al-modal-close')?.addEventListener('click', () => this.closeForm());
    document.getElementById('al-form-cancel')?.addEventListener('click', () => this.closeForm());
    document.getElementById('al-modal')?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) this.closeForm();
    });

    // Media picker
    document.getElementById('al-pick-media')?.addEventListener('click', () => this.openMediaPicker());
    document.getElementById('al-media-picker-close')?.addEventListener('click', () => {
      document.getElementById('al-media-picker').classList.remove('open');
    });
    document.getElementById('al-media-picker')?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) document.getElementById('al-media-picker').classList.remove('open');
    });

    // Form submit
    document.getElementById('al-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveLeader(e.target);
    });

    // Filter tabs
    document.querySelectorAll('.al-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.al-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.filterCategory = btn.dataset.filter;
        this.renderTable();
      });
    });
  }
}
