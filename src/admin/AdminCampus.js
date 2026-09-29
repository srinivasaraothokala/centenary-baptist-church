import { API_BASE } from '../apiConfig.js';
import { supabaseClient } from '../supabaseFrontendClient.js';
import { AdminLayout } from './AdminLayout.js';

const ICONS = ['🏛', '⛪', '🌿', '🏫', '✝', '🏠', '🌳', '⭐', '📍', '🕊', '🤝', '📖', '🙏'];

export class AdminCampus {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.campuses = [];
    this.editingId = null;
    this.API_URL = `${API_BASE}/campus`;
    this.UPLOAD_URL = `${API_BASE}/upload`;
  }
  async authHeaders(isFormData = false) {
    const { data: { session } } = await supabaseClient.auth.getSession();
    const headers = { Authorization: `Bearer ${session?.access_token}` };
    if (!isFormData) headers['Content-Type'] = 'application/json';
    return headers;
  }


  // ─── Data ─────────────────────────────────────────────────────────────────

  async fetchCampus() {
    try {
      const res = await fetch(this.API_URL);
      if (!res.ok) throw new Error('Failed');
      this.campuses = await res.json();
      this.renderTable();
      this.updateStats();
    } catch {
      this.showToast('Failed to load campus locations.', 'error');
    }
  }

  // ─── Toast ────────────────────────────────────────────────────────────────

  showToast(msg, type = 'success') {
    const t = document.getElementById('ac-toast');
    if (!t) return;
    t.textContent = msg;
    t.className = `ac-toast ac-toast-${type} show`;
    setTimeout(() => t.classList.remove('show'), 3200);
  }

  // ─── Stats ────────────────────────────────────────────────────────────────

  updateStats() {
    const total  = this.campuses.length;
    const active = this.campuses.filter(c => c.is_active).length;
    const s = id => document.getElementById(id);
    if (s('ac-stat-total'))    s('ac-stat-total').textContent    = total;
    if (s('ac-stat-active'))   s('ac-stat-active').textContent   = active;
    if (s('ac-stat-inactive')) s('ac-stat-inactive').textContent = total - active;
  }

  // ─── Modal ────────────────────────────────────────────────────────────────

  openForm(campus = null) {
    this.editingId = campus ? campus.id : null;
    const form  = document.getElementById('ac-form');
    const title = document.getElementById('ac-modal-title');

    title.textContent = campus ? 'Edit Campus Location' : 'Add Campus Location';

    form['c-title'].value      = campus?.title      || '';
    form['c-short_desc'].value = campus?.short_desc || '';
    form['c-full_desc'].value  = campus?.full_desc  || '';
    form['c-icon'].value       = campus?.icon       || '🏛';
    form['c-address'].value    = campus?.address    || '';
    form['c-map_url'].value    = campus?.map_url    || '';
    form['c-phone'].value      = campus?.phone      || '';
    form['c-sort_order'].value = campus?.sort_order ?? 99;
    form['c-is_active'].checked = campus ? campus.is_active : true;

    const preview = document.getElementById('ac-img-preview');
    preview.innerHTML = campus?.image_url
      ? `<img src="${campus.image_url}" style="max-width:140px;max-height:90px;border-radius:8px;object-fit:cover;margin-top:10px;border:1px solid #e5e7eb;">`
      : '';

    document.getElementById('ac-modal').classList.add('open');
  }

  closeForm() {
    document.getElementById('ac-modal').classList.remove('open');
    document.getElementById('ac-form').reset();
    document.getElementById('ac-img-preview').innerHTML = '';
    this.editingId = null;
  }

  async saveCampus(e) {
    e.preventDefault();
    const form = e.target;
    const btn  = form.querySelector('button[type="submit"]');
    btn.disabled = true; btn.textContent = 'Saving…';

    // Image upload
    let image_url = '';
    const file = form['c-imageFile']?.files[0];
    if (file) {
      const fd = new FormData(); fd.append('file', file);
      try {
        const up = await fetch(this.UPLOAD_URL, { method: 'POST', body: fd, headers: await this.authHeaders(true) });
        if (!up.ok) throw new Error();
        image_url = (await up.json()).url;
      } catch {
        this.showToast('Image upload failed.', 'error');
        btn.disabled = false; btn.textContent = 'Save Location';
        return;
      }
    } else if (this.editingId) {
      image_url = this.campuses.find(c => c.id === this.editingId)?.image_url || '';
    }

    const payload = {
      title:      form['c-title'].value.trim(),
      short_desc: form['c-short_desc'].value.trim(),
      full_desc:  form['c-full_desc'].value.trim(),
      icon:       form['c-icon'].value,
      image_url,
      address:    form['c-address'].value.trim(),
      map_url:    form['c-map_url'].value.trim(),
      phone:      form['c-phone'].value.trim(),
      is_active:  form['c-is_active'].checked,
      sort_order: parseInt(form['c-sort_order'].value) || 99
    };

    try {
      const url    = this.editingId ? `${this.API_URL}/${this.editingId}` : this.API_URL;
      const method = this.editingId ? 'PUT' : 'POST';
      const res    = await fetch(url, { method, headers: await this.authHeaders(false), body: JSON.stringify(payload) });
      if (!res.ok) throw new Error();
      this.showToast(this.editingId ? 'Location updated!' : 'Location added!');
      this.closeForm();
      await this.fetchCampus();
    } catch {
      this.showToast('Failed to save.', 'error');
    } finally {
      btn.disabled = false; btn.textContent = 'Save Location';
    }
  }

  async toggleActive(id, current) {
    try {
      const res = await fetch(`${this.API_URL}/${id}`, {
        method: 'PUT', headers: await this.authHeaders(false),
        body: JSON.stringify({ is_active: !current })
      });
      if (!res.ok) throw new Error();
      this.showToast(!current ? 'Location activated.' : 'Location deactivated.');
      await this.fetchCampus();
    } catch { this.showToast('Failed to update.', 'error'); }
  }

  async deleteCampus(id, title) {
    if (!confirm(`Delete "${title}"?\nThis cannot be undone.`)) return;
    try {
      const res = await fetch(`${this.API_URL}/${id}`, { method: 'DELETE', headers: await this.authHeaders() });
      if (!res.ok) throw new Error();
      this.showToast('Location deleted.');
      await this.fetchCampus();
    } catch { this.showToast('Failed to delete.', 'error'); }
  }

  // ─── Table ────────────────────────────────────────────────────────────────

  renderTable() {
    const tbody = document.getElementById('ac-tbody');
    if (!tbody) return;

    if (!this.campuses.length) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:56px;color:#94a3b8;">No campus locations yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = this.campuses.map(c => {
      const dotColor    = c.is_active ? '#22c55e' : '#94a3b8';
      const statusLabel = c.is_active ? 'Active' : 'Hidden';

      const imgHtml = c.image_url
        ? `<img src="${c.image_url}" style="width:52px;height:40px;object-fit:cover;border-radius:6px;border:1px solid #e5e7eb;flex-shrink:0;">`
        : `<div style="width:52px;height:40px;background:linear-gradient(135deg,#003F3A,#005F58);border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;">${c.icon || '🏛'}</div>`;

      return `
        <tr style="border-top:1px solid #f1f5f9;transition:background .15s;">
          <td style="padding:14px 16px;">
            <div style="display:flex;align-items:center;gap:12px;">
              ${imgHtml}
              <div>
                <div style="font-weight:700;color:#1e293b;font-size:14px;margin-bottom:3px;">${c.title}</div>
                <div style="color:#64748b;font-size:12px;">${c.short_desc?.slice(0, 65) || '—'}${(c.short_desc?.length || 0) > 65 ? '…' : ''}</div>
                ${c.address ? `<div style="color:#94a3b8;font-size:11px;margin-top:3px;">📍 ${c.address}</div>` : ''}
              </div>
            </div>
          </td>
          <td style="padding:14px 16px;text-align:center;font-size:24px;">${c.icon || '—'}</td>
          <td style="padding:14px 16px;">
            ${c.phone    ? `<div style="font-size:12px;color:#64748b;">📞 ${c.phone}</div>` : ''}
            ${c.map_url  ? `<a href="${c.map_url}" target="_blank" style="font-size:11px;color:#003F3A;text-decoration:none;">🗺 View Map</a>` : ''}
            ${!c.phone && !c.map_url ? '<span style="color:#94a3b8;font-size:12px;">—</span>' : ''}
          </td>
          <td style="padding:14px 16px;text-align:center;">
            <span style="display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:600;color:${dotColor};">
              <span style="width:7px;height:7px;border-radius:50%;background:${dotColor};display:inline-block;"></span>
              ${statusLabel}
            </span>
          </td>
          <td style="padding:14px 16px;">
            <div style="display:flex;gap:6px;justify-content:center;">
              <button class="ac-btn-edit" data-id="${c.id}" style="padding:5px 12px;border:none;border-radius:6px;background:#eff6ff;color:#2563eb;font-size:12px;font-weight:600;cursor:pointer;">Edit</button>
              <button class="ac-btn-toggle" data-id="${c.id}" data-active="${c.is_active}" style="padding:5px 12px;border:none;border-radius:6px;background:${c.is_active ? '#fef9c3' : '#f0fdf4'};color:${c.is_active ? '#ca8a04' : '#16a34a'};font-size:12px;font-weight:600;cursor:pointer;">${c.is_active ? 'Hide' : 'Show'}</button>
              <button class="ac-btn-delete" data-id="${c.id}" data-title="${c.title.replace(/"/g, '&quot;')}" style="padding:5px 12px;border:none;border-radius:6px;background:#fee2e2;color:#dc2626;font-size:12px;font-weight:600;cursor:pointer;">Delete</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    tbody.querySelectorAll('.ac-btn-edit').forEach(btn =>
      btn.addEventListener('click', () => {
        const c = this.campuses.find(x => x.id == btn.dataset.id);
        if (c) this.openForm(c);
      })
    );
    tbody.querySelectorAll('.ac-btn-toggle').forEach(btn =>
      btn.addEventListener('click', () => this.toggleActive(btn.dataset.id, btn.dataset.active === 'true'))
    );
    tbody.querySelectorAll('.ac-btn-delete').forEach(btn =>
      btn.addEventListener('click', () => this.deleteCampus(btn.dataset.id, btn.dataset.title))
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  render() {
    const iconOptions = ICONS.map(ic => `<option value="${ic}">${ic}</option>`).join('');

    const content = `
      <style>
        .ac-toast{position:fixed;bottom:28px;right:28px;padding:12px 22px;border-radius:10px;font-size:14px;font-weight:600;z-index:9999;opacity:0;transform:translateY(12px);transition:all .3s;pointer-events:none;}
        .ac-toast.show{opacity:1;transform:translateY(0);}
        .ac-toast-success{background:#003F3A;color:#fff;}
        .ac-toast-error{background:#dc2626;color:#fff;}

        .ac-modal-backdrop{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:1000;align-items:flex-start;justify-content:center;padding:40px 16px;overflow-y:auto;}
        .ac-modal-backdrop.open{display:flex;}
        .ac-modal-box{background:#fff;border-radius:18px;width:min(620px,95vw);box-shadow:0 24px 80px rgba(0,0,0,0.22);margin:auto;}
        .ac-modal-header{display:flex;align-items:center;justify-content:space-between;padding:24px 28px 18px;border-bottom:1px solid #f1f5f9;}
        .ac-modal-header h3{margin:0;font-size:18px;font-weight:700;color:#1e293b;}
        .ac-close{background:none;border:none;font-size:24px;cursor:pointer;color:#94a3b8;line-height:1;padding:0;}
        .ac-modal-body{padding:24px 28px 28px;max-height:75vh;overflow-y:auto;}

        .ac-section-label{font-size:11px;font-weight:800;letter-spacing:1.2px;text-transform:uppercase;color:#003F3A;border-bottom:2px solid #003F3A;padding-bottom:6px;margin:22px 0 14px;}
        .ac-field{margin-bottom:16px;}
        .ac-field label{display:block;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.7px;color:#475569;margin-bottom:5px;}
        .ac-field input,.ac-field textarea,.ac-field select{width:100%;padding:10px 14px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:14px;color:#1e293b;font-family:inherit;background:#fff;transition:border-color .2s;box-sizing:border-box;}
        .ac-field input:focus,.ac-field textarea:focus,.ac-field select:focus{outline:none;border-color:#003F3A;}
        .ac-field textarea{resize:vertical;min-height:80px;}
        .ac-grid-2{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
        .ac-check-wrap{display:flex;align-items:center;gap:10px;padding:12px 14px;border:1.5px solid #e2e8f0;border-radius:8px;}
        .ac-check-wrap input{width:18px;height:18px;cursor:pointer;accent-color:#003F3A;}
        .ac-check-wrap span{font-size:14px;color:#374151;font-weight:500;}
        .ac-modal-actions{display:flex;gap:10px;justify-content:flex-end;margin-top:24px;padding-top:18px;border-top:1px solid #f1f5f9;}
        .ac-btn-cancel{padding:10px 22px;border:1.5px solid #e2e8f0;border-radius:8px;background:#fff;color:#64748b;font-size:14px;font-weight:600;cursor:pointer;}
        .ac-btn-primary{padding:10px 24px;border:none;border-radius:8px;background:#003F3A;color:#fff;font-size:14px;font-weight:600;cursor:pointer;transition:background .2s;}
        .ac-btn-primary:hover{background:#005F58;}
        .ac-btn-primary:disabled{opacity:.6;cursor:not-allowed;}
        .ac-table{width:100%;border-collapse:collapse;}
        .ac-table thead tr{background:#f8fafc;}
        .ac-table thead th{padding:12px 16px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#64748b;text-align:left;}
        .ac-table tbody tr:hover{background:#fafbfc;}
      </style>

      <div id="ac-toast" class="ac-toast"></div>

      <!-- Modal -->
      <div id="ac-modal" class="ac-modal-backdrop">
        <div class="ac-modal-box">
          <div class="ac-modal-header">
            <h3 id="ac-modal-title">Add Campus Location</h3>
            <button class="ac-close" id="ac-close-btn" type="button">×</button>
          </div>
          <div class="ac-modal-body">
            <form id="ac-form" autocomplete="off">

              <div class="ac-section-label">Basic Info</div>
              <div class="ac-field">
                <label>Location Name *</label>
                <input type="text" name="c-title" placeholder="e.g. Church Building" required>
              </div>
              <div class="ac-field">
                <label>Short Description <span style="font-weight:400;color:#94a3b8;">(shown on cards)</span></label>
                <textarea name="c-short_desc" rows="2" placeholder="1–2 sentences for homepage and listing cards…"></textarea>
              </div>
              <div class="ac-field">
                <label>Full Description <span style="font-weight:400;color:#94a3b8;">(shown on location detail page)</span></label>
                <textarea name="c-full_desc" rows="4" placeholder="Detailed description for the campus detail page…"></textarea>
              </div>

              <div class="ac-section-label">Appearance</div>
              <div class="ac-grid-2">
                <div class="ac-field">
                  <label>Icon (Emoji)</label>
                  <select name="c-icon">${iconOptions}</select>
                </div>
                <div class="ac-field">
                  <label>Sort Order</label>
                  <input type="number" name="c-sort_order" placeholder="1, 2, 3…" min="1">
                </div>
              </div>
              <div class="ac-field">
                <label>Location Image / Photo</label>
                <input type="file" name="c-imageFile" accept="image/*" style="padding:8px;border:1.5px solid #e2e8f0;border-radius:8px;width:100%;box-sizing:border-box;font-size:13px;">
                <div id="ac-img-preview" style="margin-top:8px;"></div>
              </div>

              <div class="ac-section-label">Location Details</div>
              <div class="ac-field">
                <label>Address</label>
                <input type="text" name="c-address" placeholder="e.g. St. Mary's Road, Secunderabad, Telangana">
              </div>
              <div class="ac-grid-2">
                <div class="ac-field">
                  <label>Google Maps Link</label>
                  <input type="url" name="c-map_url" placeholder="https://maps.google.com/…">
                </div>
                <div class="ac-field">
                  <label>Phone Number</label>
                  <input type="text" name="c-phone" placeholder="+91 40 …">
                </div>
              </div>

              <div class="ac-section-label">Settings</div>
              <div class="ac-field">
                <label class="ac-check-wrap">
                  <input type="checkbox" name="c-is_active">
                  <span>Active — show this location on the website</span>
                </label>
              </div>

              <div class="ac-modal-actions">
                <button type="button" class="ac-btn-cancel" id="ac-cancel-btn">Cancel</button>
                <button type="submit" class="ac-btn-primary">Save Location</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Page Header -->
      <div class="admin-header">
        <h2>Campus Locations</h2>
        <p>Manage all CBC campus locations. Changes reflect live on the website.</p>
      </div>

      <!-- Stats -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:16px;margin-bottom:28px;">
        <div style="background:#fff;border-radius:12px;padding:20px 24px;box-shadow:0 1px 4px rgba(0,0,0,0.06);border:1px solid #f1f5f9;">
          <div style="font-size:30px;font-weight:800;color:#1e293b;" id="ac-stat-total">—</div>
          <div style="font-size:12px;color:#64748b;font-weight:600;margin-top:4px;text-transform:uppercase;letter-spacing:.5px;">Total Locations</div>
        </div>
        <div style="background:#fff;border-radius:12px;padding:20px 24px;box-shadow:0 1px 4px rgba(0,0,0,0.06);border:1px solid #f1f5f9;">
          <div style="font-size:30px;font-weight:800;color:#22c55e;" id="ac-stat-active">—</div>
          <div style="font-size:12px;color:#64748b;font-weight:600;margin-top:4px;text-transform:uppercase;letter-spacing:.5px;">Active (Live)</div>
        </div>
        <div style="background:#fff;border-radius:12px;padding:20px 24px;box-shadow:0 1px 4px rgba(0,0,0,0.06);border:1px solid #f1f5f9;">
          <div style="font-size:30px;font-weight:800;color:#94a3b8;" id="ac-stat-inactive">—</div>
          <div style="font-size:12px;color:#64748b;font-weight:600;margin-top:4px;text-transform:uppercase;letter-spacing:.5px;">Hidden</div>
        </div>
      </div>

      <!-- Table -->
      <div class="admin-card">
        <div class="admin-card-header" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">
          <h3>All Campus Locations</h3>
          <button id="ac-add-btn" style="display:inline-flex;align-items:center;gap:8px;padding:10px 20px;background:#003F3A;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
            Add Location
          </button>
        </div>
        <div style="overflow-x:auto;">
          <table class="ac-table">
            <thead>
              <tr>
                <th>Location</th>
                <th style="text-align:center;">Icon</th>
                <th>Contact / Map</th>
                <th style="text-align:center;">Status</th>
                <th style="text-align:center;">Actions</th>
              </tr>
            </thead>
            <tbody id="ac-tbody">
              <tr><td colspan="5" style="text-align:center;padding:56px;color:#94a3b8;">Loading…</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    `;

    this.container.innerHTML = AdminLayout.getLayout(content, '/admin/campus');

    document.getElementById('ac-add-btn').addEventListener('click', () => this.openForm());
    document.getElementById('ac-close-btn').addEventListener('click', () => this.closeForm());
    document.getElementById('ac-cancel-btn').addEventListener('click', () => this.closeForm());
    document.getElementById('ac-form').addEventListener('submit', e => this.saveCampus(e));
    document.getElementById('ac-modal').addEventListener('click', e => {
      if (e.target === document.getElementById('ac-modal')) this.closeForm();
    });

    this.fetchCampus();
  }
}
