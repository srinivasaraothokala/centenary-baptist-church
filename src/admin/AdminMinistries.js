import { API_BASE } from '../apiConfig.js';
import { supabaseClient } from '../supabaseFrontendClient.js';
import { AdminLayout } from './AdminLayout.js';

const ICONS = ['✝', '♥', '👥', '👤', '🌐', '⚕', '🎵', '🏛', '📖', '🙏', '🌿', '🎶', '✨', '🕊', '🤝', '⭐', '🏥', '🎓'];

export class AdminMinistries {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.ministries = [];
    this.editingId = null;
    this.dragSrcIndex = null;
    this.API_URL = `${API_BASE}/ministries`;
    this.UPLOAD_URL = `${API_BASE}/upload`;
  }
  async authHeaders(isFormData = false) {
    const { data: { session } } = await supabaseClient.auth.getSession();
    const headers = { Authorization: `Bearer ${session?.access_token}` };
    if (!isFormData) headers['Content-Type'] = 'application/json';
    return headers;
  }


  // ─── Data Fetching ────────────────────────────────────────────────────────

  async fetchMinistries() {
    try {
      const res = await fetch(this.API_URL);
      if (!res.ok) throw new Error('Failed to fetch');
      this.ministries = await res.json();
      this.renderTable();
      this.updateStats();
    } catch (err) {
      console.error(err);
      this.showToast('Failed to load ministries.', 'error');
    }
  }

  // ─── Toast ────────────────────────────────────────────────────────────────

  showToast(msg, type = 'success') {
    const toast = document.getElementById('am-toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.className = `am-toast am-toast-${type} show`;
    setTimeout(() => toast.classList.remove('show'), 3200);
  }

  // ─── Stats ────────────────────────────────────────────────────────────────

  updateStats() {
    const total = this.ministries.length;
    const active = this.ministries.filter(m => m.is_active).length;
    const el = (id) => document.getElementById(id);
    if (el('am-stat-total'))    el('am-stat-total').textContent    = total;
    if (el('am-stat-active'))   el('am-stat-active').textContent   = active;
    if (el('am-stat-inactive')) el('am-stat-inactive').textContent = total - active;
  }

  // ─── Modal Form ───────────────────────────────────────────────────────────

  openForm(ministry = null) {
    this.editingId = ministry ? ministry.id : null;
    const modal    = document.getElementById('am-modal');
    const title    = document.getElementById('am-modal-title');
    const form     = document.getElementById('am-form');

    title.textContent = ministry ? 'Edit Ministry' : 'Add New Ministry';

    form['m-title'].value            = ministry?.title            || '';
    form['m-short_desc'].value       = ministry?.short_desc       || '';
    form['m-full_desc'].value        = ministry?.full_desc        || '';
    form['m-icon'].value             = ministry?.icon             || '✝';
    form['m-leader_name'].value      = ministry?.leader_name      || '';
    form['m-meeting_time'].value     = ministry?.meeting_time     || '';
    form['m-meeting_location'].value = ministry?.meeting_location || '';
    form['m-contact_email'].value    = ministry?.contact_email    || '';
    form['m-sort_order'].value       = ministry?.sort_order       ?? 99;
    form['m-is_active'].checked      = ministry ? ministry.is_active : true;

    // Image preview
    const preview = document.getElementById('am-img-preview');
    preview.innerHTML = ministry?.image_url
      ? `<img src="${ministry.image_url}" alt="preview" style="max-width:140px;max-height:90px;border-radius:8px;object-fit:cover;margin-top:10px;border:1px solid #e5e7eb;">`
      : '';

    modal.classList.add('open');
  }

  closeForm() {
    document.getElementById('am-modal').classList.remove('open');
    document.getElementById('am-form').reset();
    document.getElementById('am-img-preview').innerHTML = '';
    this.editingId = null;
  }

  async saveMinistry(e) {
    e.preventDefault();
    const form = e.target;
    const btn  = form.querySelector('button[type="submit"]');
    btn.disabled    = true;
    btn.textContent = 'Saving…';

    // Upload image if a new file is selected
    let image_url = '';
    const file = form['m-imageFile']?.files[0];
    if (file) {
      const fd = new FormData();
      fd.append('file', file);
      try {
        const uploadRes = await fetch(this.UPLOAD_URL, { method: 'POST', body: fd, headers: await this.authHeaders(true) });
        if (!uploadRes.ok) throw new Error('Upload failed');
        const uploadData = await uploadRes.json();
        image_url = uploadData.url;
      } catch {
        this.showToast('Image upload failed.', 'error');
        btn.disabled    = false;
        btn.textContent = 'Save Ministry';
        return;
      }
    } else if (this.editingId) {
      const existing = this.ministries.find(m => m.id === this.editingId);
      image_url = existing?.image_url || '';
    }

    const payload = {
      title:            form['m-title'].value.trim(),
      short_desc:       form['m-short_desc'].value.trim(),
      full_desc:        form['m-full_desc'].value.trim(),
      icon:             form['m-icon'].value,
      image_url,
      leader_name:      form['m-leader_name'].value.trim(),
      meeting_time:     form['m-meeting_time'].value.trim(),
      meeting_location: form['m-meeting_location'].value.trim(),
      contact_email:    form['m-contact_email'].value.trim(),
      is_active:        form['m-is_active'].checked,
      sort_order:       parseInt(form['m-sort_order'].value) || 99
    };

    try {
      const url    = this.editingId ? `${this.API_URL}/${this.editingId}` : this.API_URL;
      const method = this.editingId ? 'PUT' : 'POST';
      const res    = await fetch(url, {
        method,
        headers: await this.authHeaders(false),
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Save failed');
      this.showToast(this.editingId ? 'Ministry updated!' : 'Ministry added!');
      this.closeForm();
      await this.fetchMinistries();
    } catch {
      this.showToast('Failed to save ministry.', 'error');
    } finally {
      btn.disabled    = false;
      btn.textContent = 'Save Ministry';
    }
  }

  // ─── Toggle Active ────────────────────────────────────────────────────────

  async toggleActive(id, current) {
    try {
      const res = await fetch(`${this.API_URL}/${id}`, {
        method: 'PUT',
        headers: await this.authHeaders(false),
        body: JSON.stringify({ is_active: !current })
      });
      if (!res.ok) throw new Error();
      this.showToast(!current ? 'Ministry activated.' : 'Ministry deactivated.');
      await this.fetchMinistries();
    } catch {
      this.showToast('Failed to update status.', 'error');
    }
  }

  // ─── Delete ───────────────────────────────────────────────────────────────

  async deleteMinistry(id, title) {
    if (!confirm(`Delete "${title}"?\nThis cannot be undone.`)) return;
    try {
      const res = await fetch(`${this.API_URL}/${id}`, { method: 'DELETE', headers: await this.authHeaders() });
      if (!res.ok) throw new Error();
      this.showToast('Ministry deleted.');
      await this.fetchMinistries();
    } catch {
      this.showToast('Failed to delete.', 'error');
    }
  }

  // ─── Drag-and-Drop Reorder ────────────────────────────────────────────────

  bindDragDrop(tbody) {
    const rows = tbody.querySelectorAll('tr[draggable]');

    rows.forEach((row, idx) => {
      row.addEventListener('dragstart', () => {
        this.dragSrcIndex = idx;
        row.classList.add('am-dragging');
      });
      row.addEventListener('dragend', () => {
        row.classList.remove('am-dragging');
        tbody.querySelectorAll('tr').forEach(r => r.classList.remove('am-drag-over'));
      });
      row.addEventListener('dragover', (e) => {
        e.preventDefault();
        tbody.querySelectorAll('tr').forEach(r => r.classList.remove('am-drag-over'));
        row.classList.add('am-drag-over');
      });
      row.addEventListener('drop', async (e) => {
        e.preventDefault();
        row.classList.remove('am-drag-over');
        const destIndex = idx;
        if (this.dragSrcIndex === null || this.dragSrcIndex === destIndex) return;

        // Reorder local array
        const moved = this.ministries.splice(this.dragSrcIndex, 1)[0];
        this.ministries.splice(destIndex, 0, moved);

        // Assign new sort_order values 1…n
        const updates = this.ministries.map((m, i) => ({ id: m.id, sort_order: i + 1 }));

        // Optimistic re-render
        this.renderTable();

        // Save to backend
        try {
          const res = await fetch(`${this.API_URL}/reorder`, {
            method: 'PATCH',
            headers: await this.authHeaders(false),
            body: JSON.stringify(updates)
          });
          if (!res.ok) throw new Error();
          this.showToast('Order saved!');
        } catch {
          this.showToast('Failed to save order.', 'error');
          await this.fetchMinistries(); // re-fetch on error
        }
      });
    });
  }

  // ─── Table Render ─────────────────────────────────────────────────────────

  renderTable() {
    const tbody = document.getElementById('am-tbody');
    if (!tbody) return;

    if (!this.ministries.length) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:56px;color:#94a3b8;">No ministries yet. Add your first one above.</td></tr>`;
      return;
    }

    tbody.innerHTML = this.ministries.map((m, i) => {
      const dotColor    = m.is_active ? '#22c55e' : '#94a3b8';
      const statusLabel = m.is_active ? 'Active' : 'Inactive';

      const imgHtml = m.image_url
        ? `<img src="${m.image_url}" alt="${m.title}" style="width:52px;height:40px;object-fit:cover;border-radius:6px;border:1px solid #e5e7eb;flex-shrink:0;">`
        : `<div style="width:52px;height:40px;background:linear-gradient(135deg,#003F3A,#005F58);border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;">${m.icon || '✝'}</div>`;

      return `
        <tr draggable="true" data-id="${m.id}" style="border-top:1px solid #f1f5f9;cursor:grab;transition:background 0.15s;">
          <td style="padding:14px 12px;width:32px;color:#cbd5e1;font-size:18px;user-select:none;">⠿</td>
          <td style="padding:14px 16px;">
            <div style="display:flex;align-items:center;gap:12px;">
              ${imgHtml}
              <div>
                <div style="font-weight:700;color:#1e293b;font-size:14px;margin-bottom:3px;">${m.title}</div>
                <div style="color:#64748b;font-size:12px;line-height:1.4;">${m.short_desc?.slice(0, 70) || '—'}${(m.short_desc?.length || 0) > 70 ? '…' : ''}</div>
                ${m.leader_name ? `<div style="color:#94a3b8;font-size:11px;margin-top:3px;">👤 ${m.leader_name}</div>` : ''}
              </div>
            </div>
          </td>
          <td style="padding:14px 16px;text-align:center;font-size:22px;">${m.icon || '—'}</td>
          <td style="padding:14px 16px;text-align:center;">
            <div style="font-size:12px;color:#64748b;">${m.meeting_time || '—'}</div>
            ${m.meeting_location ? `<div style="font-size:11px;color:#94a3b8;">${m.meeting_location}</div>` : ''}
          </td>
          <td style="padding:14px 16px;text-align:center;">
            <span style="display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:600;color:${dotColor};">
              <span style="width:7px;height:7px;border-radius:50%;background:${dotColor};display:inline-block;"></span>
              ${statusLabel}
            </span>
          </td>
          <td style="padding:14px 16px;">
            <div style="display:flex;gap:6px;justify-content:center;">
              <button class="am-btn-edit" data-id="${m.id}" style="padding:5px 12px;border:none;border-radius:6px;background:#eff6ff;color:#2563eb;font-size:12px;font-weight:600;cursor:pointer;">Edit</button>
              <button class="am-btn-toggle" data-id="${m.id}" data-active="${m.is_active}" style="padding:5px 12px;border:none;border-radius:6px;background:${m.is_active ? '#fef9c3' : '#f0fdf4'};color:${m.is_active ? '#ca8a04' : '#16a34a'};font-size:12px;font-weight:600;cursor:pointer;">${m.is_active ? 'Deactivate' : 'Activate'}</button>
              <button class="am-btn-delete" data-id="${m.id}" data-title="${m.title.replace(/"/g, '&quot;')}" style="padding:5px 12px;border:none;border-radius:6px;background:#fee2e2;color:#dc2626;font-size:12px;font-weight:600;cursor:pointer;">Delete</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Bind row actions
    tbody.querySelectorAll('.am-btn-edit').forEach(btn =>
      btn.addEventListener('click', () => {
        const m = this.ministries.find(x => x.id == btn.dataset.id);
        if (m) this.openForm(m);
      })
    );
    tbody.querySelectorAll('.am-btn-toggle').forEach(btn =>
      btn.addEventListener('click', () => this.toggleActive(btn.dataset.id, btn.dataset.active === 'true'))
    );
    tbody.querySelectorAll('.am-btn-delete').forEach(btn =>
      btn.addEventListener('click', () => this.deleteMinistry(btn.dataset.id, btn.dataset.title))
    );

    this.bindDragDrop(tbody);
  }

  // ─── Render Shell ─────────────────────────────────────────────────────────

  render() {
    const iconOptions = ICONS.map(ic => `<option value="${ic}">${ic}</option>`).join('');

    const content = `
      <style>
        .am-toast{position:fixed;bottom:28px;right:28px;padding:12px 22px;border-radius:10px;font-size:14px;font-weight:600;z-index:9999;opacity:0;transform:translateY(12px);transition:all .3s;pointer-events:none;}
        .am-toast.show{opacity:1;transform:translateY(0);}
        .am-toast-success{background:#003F3A;color:#fff;}
        .am-toast-error{background:#dc2626;color:#fff;}

        /* Modal */
        .am-modal-backdrop{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:1000;align-items:flex-start;justify-content:center;padding:40px 16px;overflow-y:auto;}
        .am-modal-backdrop.open{display:flex;}
        .am-modal-box{background:#fff;border-radius:18px;width:min(620px,95vw);box-shadow:0 24px 80px rgba(0,0,0,0.22);margin:auto;}
        .am-modal-header{display:flex;align-items:center;justify-content:space-between;padding:24px 28px 18px;border-bottom:1px solid #f1f5f9;}
        .am-modal-header h3{margin:0;font-size:18px;font-weight:700;color:#1e293b;}
        .am-close{background:none;border:none;font-size:24px;cursor:pointer;color:#94a3b8;line-height:1;padding:0;}
        .am-close:hover{color:#1e293b;}
        .am-modal-body{padding:24px 28px 28px;max-height:75vh;overflow-y:auto;}

        /* Form fields */
        .am-section-label{font-size:11px;font-weight:800;letter-spacing:1.2px;text-transform:uppercase;color:#003F3A;border-bottom:2px solid #003F3A;padding-bottom:6px;margin:22px 0 14px;}
        .am-field{margin-bottom:16px;}
        .am-field label{display:block;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.7px;color:#475569;margin-bottom:5px;}
        .am-field input,.am-field textarea,.am-field select{width:100%;padding:10px 14px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:14px;color:#1e293b;font-family:inherit;background:#fff;transition:border-color .2s;box-sizing:border-box;}
        .am-field input:focus,.am-field textarea:focus,.am-field select:focus{outline:none;border-color:#003F3A;}
        .am-field textarea{resize:vertical;min-height:80px;}
        .am-grid-2{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
        .am-grid-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;}
        .am-check-wrap{display:flex;align-items:center;gap:10px;padding:12px 14px;border:1.5px solid #e2e8f0;border-radius:8px;}
        .am-check-wrap input{width:18px;height:18px;cursor:pointer;accent-color:#003F3A;}
        .am-check-wrap span{font-size:14px;color:#374151;font-weight:500;}
        .am-modal-actions{display:flex;gap:10px;justify-content:flex-end;margin-top:24px;padding-top:18px;border-top:1px solid #f1f5f9;}
        .am-btn-cancel{padding:10px 22px;border:1.5px solid #e2e8f0;border-radius:8px;background:#fff;color:#64748b;font-size:14px;font-weight:600;cursor:pointer;}
        .am-btn-primary{padding:10px 24px;border:none;border-radius:8px;background:#003F3A;color:#fff;font-size:14px;font-weight:600;cursor:pointer;transition:background .2s;}
        .am-btn-primary:hover{background:#005F58;}
        .am-btn-primary:disabled{opacity:.6;cursor:not-allowed;}

        /* Table */
        .am-table{width:100%;border-collapse:collapse;}
        .am-table thead tr{background:#f8fafc;}
        .am-table thead th{padding:12px 16px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#64748b;text-align:left;white-space:nowrap;}
        .am-table tbody tr:hover{background:#fafbfc;}
        .am-dragging{opacity:.4;background:#f0fdf4;}
        .am-drag-over{background:#e0f2fe;border-top:2px solid #0ea5e9;}
      </style>

      <div id="am-toast" class="am-toast"></div>

      <!-- ── Modal ──────────────────────────────────────────────────────── -->
      <div id="am-modal" class="am-modal-backdrop">
        <div class="am-modal-box">
          <div class="am-modal-header">
            <h3 id="am-modal-title">Add New Ministry</h3>
            <button class="am-close" id="am-close-btn" type="button">×</button>
          </div>
          <div class="am-modal-body">
            <form id="am-form" autocomplete="off">

              <div class="am-section-label">Basic Info</div>
              <div class="am-field">
                <label>Ministry Title *</label>
                <input type="text" name="m-title" placeholder="e.g. Youth Ministry" required>
              </div>
              <div class="am-field">
                <label>Short Description <span style="font-weight:400;color:#94a3b8;">(shown on cards)</span></label>
                <textarea name="m-short_desc" rows="2" placeholder="1–2 sentences for homepage and listing cards…"></textarea>
              </div>
              <div class="am-field">
                <label>Full Description <span style="font-weight:400;color:#94a3b8;">(shown on ministry detail page)</span></label>
                <textarea name="m-full_desc" rows="4" placeholder="Detailed description shown on the individual ministry page…"></textarea>
              </div>

              <div class="am-section-label">Appearance</div>
              <div class="am-grid-2">
                <div class="am-field">
                  <label>Icon (Emoji)</label>
                  <select name="m-icon">${iconOptions}</select>
                </div>
                <div class="am-field">
                  <label>Sort Order</label>
                  <input type="number" name="m-sort_order" placeholder="1, 2, 3…" min="1">
                </div>
              </div>
              <div class="am-field">
                <label>Ministry Image</label>
                <input type="file" name="m-imageFile" accept="image/*" style="padding:8px;border:1.5px solid #e2e8f0;border-radius:8px;width:100%;box-sizing:border-box;font-size:13px;">
                <div id="am-img-preview" style="margin-top:8px;"></div>
              </div>

              <div class="am-section-label">Ministry Details</div>
              <div class="am-field">
                <label>Leader / Pastor Name</label>
                <input type="text" name="m-leader_name" placeholder="e.g. Rev. John Samuel">
              </div>
              <div class="am-grid-2">
                <div class="am-field">
                  <label>Meeting Time</label>
                  <input type="text" name="m-meeting_time" placeholder="e.g. Every Sunday, 5:00 PM">
                </div>
                <div class="am-field">
                  <label>Meeting Location</label>
                  <input type="text" name="m-meeting_location" placeholder="e.g. Youth Hall, CBC Campus">
                </div>
              </div>
              <div class="am-field">
                <label>Contact Email</label>
                <input type="email" name="m-contact_email" placeholder="e.g. youth@cbcsec.org">
              </div>

              <div class="am-section-label">Settings</div>
              <div class="am-field">
                <label class="am-check-wrap">
                  <input type="checkbox" name="m-is_active">
                  <span>Active — show this ministry on the website</span>
                </label>
              </div>

              <div class="am-modal-actions">
                <button type="button" class="am-btn-cancel" id="am-cancel-btn">Cancel</button>
                <button type="submit" class="am-btn-primary">Save Ministry</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- ── Page Header ────────────────────────────────────────────────── -->
      <div class="admin-header">
        <h2>Ministries</h2>
        <p>Manage all church ministries. Drag rows to reorder. Changes reflect live on the website.</p>
      </div>

      <!-- ── Stats ──────────────────────────────────────────────────────── -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:16px;margin-bottom:28px;">
        <div style="background:#fff;border-radius:12px;padding:20px 24px;box-shadow:0 1px 4px rgba(0,0,0,0.06);border:1px solid #f1f5f9;">
          <div style="font-size:30px;font-weight:800;color:#1e293b;" id="am-stat-total">—</div>
          <div style="font-size:12px;color:#64748b;font-weight:600;margin-top:4px;text-transform:uppercase;letter-spacing:.5px;">Total Ministries</div>
        </div>
        <div style="background:#fff;border-radius:12px;padding:20px 24px;box-shadow:0 1px 4px rgba(0,0,0,0.06);border:1px solid #f1f5f9;">
          <div style="font-size:30px;font-weight:800;color:#22c55e;" id="am-stat-active">—</div>
          <div style="font-size:12px;color:#64748b;font-weight:600;margin-top:4px;text-transform:uppercase;letter-spacing:.5px;">Active (Live)</div>
        </div>
        <div style="background:#fff;border-radius:12px;padding:20px 24px;box-shadow:0 1px 4px rgba(0,0,0,0.06);border:1px solid #f1f5f9;">
          <div style="font-size:30px;font-weight:800;color:#94a3b8;" id="am-stat-inactive">—</div>
          <div style="font-size:12px;color:#64748b;font-weight:600;margin-top:4px;text-transform:uppercase;letter-spacing:.5px;">Hidden</div>
        </div>
      </div>

      <!-- ── Table Card ─────────────────────────────────────────────────── -->
      <div class="admin-card">
        <div class="admin-card-header" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">
          <div>
            <h3 style="margin:0 0 4px;">All Ministries</h3>
            <p style="margin:0;font-size:12px;color:#94a3b8;">Drag ⠿ to reorder. Order is saved instantly.</p>
          </div>
          <button id="am-add-btn" style="display:inline-flex;align-items:center;gap:8px;padding:10px 20px;background:#003F3A;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;transition:background .2s;">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
            Add Ministry
          </button>
        </div>
        <div style="overflow-x:auto;">
          <table class="am-table">
            <thead>
              <tr>
                <th style="width:32px;"></th>
                <th>Ministry</th>
                <th style="text-align:center;">Icon</th>
                <th>Schedule</th>
                <th style="text-align:center;">Status</th>
                <th style="text-align:center;">Actions</th>
              </tr>
            </thead>
            <tbody id="am-tbody">
              <tr><td colspan="6" style="text-align:center;padding:56px;color:#94a3b8;">Loading ministries…</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    `;

    this.container.innerHTML = AdminLayout.getLayout(content, '/admin/ministries');

    // ── Bind Events ──────────────────────────────────────────────────────────
    document.getElementById('am-add-btn').addEventListener('click', () => this.openForm());
    document.getElementById('am-close-btn').addEventListener('click', () => this.closeForm());
    document.getElementById('am-cancel-btn').addEventListener('click', () => this.closeForm());
    document.getElementById('am-form').addEventListener('submit', e => this.saveMinistry(e));

    // Close on backdrop click
    document.getElementById('am-modal').addEventListener('click', e => {
      if (e.target === document.getElementById('am-modal')) this.closeForm();
    });

    this.fetchMinistries();
  }
}
