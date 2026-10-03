import { API_BASE } from '../apiConfig.js';
import { supabaseClient } from '../supabaseFrontendClient.js';
import './admin.css';
import { AdminLayout } from './AdminLayout.js';

export class AdminEvents {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.events = [];
    this.regCounts = {};
    this.API_URL = `${API_BASE}/events`;
    this.currentModalRegs = [];
    this.currentModalPage = 1;
    this.currentEventId = null;
    this.pageSize = 10;
  }

  async authHeaders(isFormData = false) {
    const { data: { session } } = await supabaseClient.auth.getSession();
    const headers = { Authorization: `Bearer ${session?.access_token}` };
    if (!isFormData) headers['Content-Type'] = 'application/json';
    return headers;
  }

  formatDate(iso) {
    if (!iso) return '-';
    return new Date(iso).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true
    });
  }

  async fetchRegCounts() {
    const regEvents = this.events.filter(e => e.registration_enabled);
    this.regCounts = {};
    await Promise.all(regEvents.map(async (ev) => {
      try {
        const res = await fetch(`${this.API_URL}/${ev.id}/registrations`, { headers: await this.authHeaders() });
        if (res.ok) {
          const body = await res.json();
          this.regCounts[ev.id] = (body.registrations || []).length;
        } else { this.regCounts[ev.id] = 0; }
      } catch { this.regCounts[ev.id] = 0; }
    }));
  }

  async viewRegistrations(eventId, event) {
    const existing = document.getElementById('admin-reg-modal');
    if (existing) existing.remove();

    document.body.insertAdjacentHTML('beforeend', `
      <div id="admin-reg-modal" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.55);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;">
        <div style="background:white;border-radius:12px;width:100%;max-width:960px;padding:40px;text-align:center;color:#64748b;box-shadow:0 20px 60px rgba(0,0,0,0.25);">
          Loading registrations...
        </div>
      </div>`);

    try {
      const res = await fetch(`${this.API_URL}/${eventId}/registrations`, { headers: await this.authHeaders() });
      if (!res.ok) throw new Error('Failed to load registrations');
      const { event: ev, registrations } = await res.json();
      const eventName = ev?.title || event?.title || '';
      const regs = registrations || [];
      this.currentModalRegs = regs;
      this.currentModalPage = 1;
      this.currentEventId = eventId;

      const modal = document.getElementById('admin-reg-modal');
      if (!modal) return;

      const eventDate = event?.fullDate
        ? new Date(event.fullDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
        : `${event?.date || ''} ${event?.month || ''}`;

      modal.innerHTML = `
        <div style="background:white;border-radius:12px;width:100%;max-width:960px;max-height:92vh;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,0.25);">
          <div style="padding:20px 28px;border-bottom:1px solid #e2e8f0;display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-shrink:0;">
            <div>
              <p style="margin:0 0 2px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#b6893f;">Event Registrations</p>
              <h2 style="margin:0;font-family:'Playfair Display',serif;font-size:20px;color:#791c1c;">${eventName}</h2>
            </div>
            <div style="display:flex;align-items:center;gap:8px;flex-shrink:0;">
              <button id="admin-reg-download-btn" style="display:flex;align-items:center;gap:6px;padding:8px 14px;background:#063b35;color:white;border:none;border-radius:6px;cursor:pointer;font-size:13px;font-weight:600;font-family:inherit;">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
                Download CSV
              </button>
              <button id="admin-reg-close-btn" style="background:none;border:1px solid #e2e8f0;border-radius:6px;width:32px;height:32px;cursor:pointer;font-size:20px;display:flex;align-items:center;justify-content:center;color:#64748b;">&#x00D7;</button>
            </div>
          </div>
          <div style="padding:14px 28px;background:#f8fafc;border-bottom:1px solid #e2e8f0;display:flex;gap:24px;flex-wrap:wrap;flex-shrink:0;font-size:13px;color:#374151;">
            <span>&#128197; <strong>${eventDate}</strong> &middot; ${event?.time || ''}</span>
            <span>&#128205; ${event?.location || ''}</span>
            <span>&#128101; <strong id="modal-reg-count">${regs.length}</strong> Registration${regs.length !== 1 ? 's' : ''}</span>
          </div>
          <div id="admin-reg-table-area" style="overflow-y:auto;flex:1;padding:0 28px 16px;"></div>
          <div id="admin-reg-pagination" style="padding:12px 28px;border-top:1px solid #e2e8f0;flex-shrink:0;"></div>
        </div>`;

      this._renderModalTable();

      document.getElementById('admin-reg-close-btn').addEventListener('click', () => document.getElementById('admin-reg-modal')?.remove());
      modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

      document.getElementById('admin-reg-download-btn').addEventListener('click', async () => {
        const btn = document.getElementById('admin-reg-download-btn');
        if (!btn) return;
        const orig = btn.innerHTML;
        btn.textContent = 'Downloading...';
        btn.disabled = true;
        try {
          const dlRes = await fetch(`${this.API_URL}/${eventId}/registrations/export`, { headers: await this.authHeaders() });
          if (!dlRes.ok) throw new Error('Export failed');
          const blob = await dlRes.blob();
          const cd = dlRes.headers.get('Content-Disposition') || '';
          const match = cd.match(/filename="?([^"]+)"?/);
          const filename = match ? match[1] : `${eventId}-registrations.csv`;
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url; a.download = filename;
          document.body.appendChild(a); a.click();
          document.body.removeChild(a); URL.revokeObjectURL(url);
        } catch {
          alert('Download failed. Please try again.');
        } finally {
          if (btn) { btn.innerHTML = orig; btn.disabled = false; }
        }
      });

    } catch (err) {
      console.error(err);
      const modal = document.getElementById('admin-reg-modal');
      if (modal) modal.innerHTML = `<div style="background:white;border-radius:12px;padding:40px;text-align:center;color:#991b1b;"><p>Failed to load registrations.</p><button onclick="document.getElementById('admin-reg-modal').remove()" style="padding:8px 16px;background:#f1f5f9;border:1px solid #e2e8f0;border-radius:6px;cursor:pointer;">Close</button></div>`;
    }
  }

  _renderModalTable() {
    const area = document.getElementById('admin-reg-table-area');
    const paginEl = document.getElementById('admin-reg-pagination');
    const regs = this.currentModalRegs;
    if (!area) return;

    if (!regs || regs.length === 0) {
      area.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 20px;color:#94a3b8;text-align:center;">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom:16px;opacity:.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          <p style="margin:0 0 6px;font-size:15px;font-weight:600;color:#374151;">No registrations yet</p>
          <p style="margin:0;font-size:13px;">This event has not received any registrations.</p>
        </div>`;
      if (paginEl) paginEl.innerHTML = '';
      return;
    }

    const totalPages = Math.ceil(regs.length / this.pageSize);
    const page = this.currentModalPage;
    const start = (page - 1) * this.pageSize;
    const end = Math.min(start + this.pageSize, regs.length);
    const pageRegs = regs.slice(start, end);

    area.innerHTML = `
      <table style="width:100%;border-collapse:collapse;margin-top:20px;table-layout:fixed;">
        <colgroup>
          <col style="width:36px"><col style="width:18%"><col style="width:22%">
          <col style="width:13%"><col style="width:8%"><col style="width:18%"><col style="width:16%">
        </colgroup>
        <thead>
          <tr style="background:#f8fafc;border-bottom:2px solid #e2e8f0;">
            ${['#','Name','Email','Phone','Att.','Notes','Registered At'].map((h,i) =>
              `<th style="padding:10px 8px;text-align:${i===4?'center':'left'};font-size:11px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:.06em;">${h}</th>`
            ).join('')}
          </tr>
        </thead>
        <tbody>
          ${pageRegs.map((r, i) => {
            const notes = r.notes || '-';
            const notesTrunc = notes.length > 38 ? notes.substring(0, 38) + '…' : notes;
            return `
            <tr style="border-bottom:1px solid #f1f5f9;">
              <td style="padding:11px 8px;color:#94a3b8;font-size:13px;">${start+i+1}</td>
              <td style="padding:11px 8px;font-weight:600;font-size:13px;color:#1e293b;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${r.full_name||''}">${r.full_name||'-'}</td>
              <td style="padding:11px 8px;font-size:13px;color:#374151;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${r.email||''}">${r.email||'-'}</td>
              <td style="padding:11px 8px;font-size:13px;color:#374151;">${r.phone||'-'}</td>
              <td style="padding:11px 8px;text-align:center;font-size:13px;font-weight:600;color:#374151;">${r.attendee_count||1}</td>
              <td style="padding:11px 8px;font-size:12px;color:#64748b;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${notes}">${notesTrunc}</td>
              <td style="padding:11px 8px;font-size:12px;color:#64748b;white-space:nowrap;">${this.formatDate(r.created_at)}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>`;

    if (paginEl) {
      if (totalPages <= 1) {
        paginEl.innerHTML = `<span style="font-size:13px;color:#64748b;">Showing all ${regs.length} registration${regs.length!==1?'s':''}</span>`;
      } else {
        const pageNums = Array.from({length:totalPages},(_,i)=>i+1).map(p => {
          const active = p===page;
          return `<button data-page="${p}" style="width:30px;height:30px;border:1px solid ${active?'#791c1c':'#e2e8f0'};background:${active?'#791c1c':'white'};color:${active?'white':'#374151'};border-radius:4px;cursor:pointer;font-size:13px;font-weight:${active?'700':'400'};">${p}</button>`;
        }).join('');
        paginEl.innerHTML = `
          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
            <span style="font-size:13px;color:#64748b;">Showing ${start+1}–${end} of ${regs.length} registrations</span>
            <div style="display:flex;gap:4px;">
              <button data-page="${Math.max(1,page-1)}" style="padding:4px 10px;border:1px solid #e2e8f0;background:white;border-radius:4px;cursor:pointer;font-size:13px;${page===1?'opacity:.4;pointer-events:none;':''}">&#8249;</button>
              ${pageNums}
              <button data-page="${Math.min(totalPages,page+1)}" style="padding:4px 10px;border:1px solid #e2e8f0;background:white;border-radius:4px;cursor:pointer;font-size:13px;${page===totalPages?'opacity:.4;pointer-events:none;':''}">&#8250;</button>
            </div>
          </div>`;
        paginEl.querySelectorAll('[data-page]').forEach(btn => {
          btn.addEventListener('click', () => { this.currentModalPage = parseInt(btn.dataset.page); this._renderModalTable(); });
        });
      }
    }
  }

  async fetchEvents() {
    const list = this.container.querySelector('#admin-events-list');
    if (list) list.innerHTML = '<tr><td colspan="6"><div style="padding:32px;text-align:center;color:#64748b;">Loading events...</div></td></tr>';
    try {
      const res = await fetch(this.API_URL);
      this.events = await res.json();
      await this.fetchRegCounts();
      this.renderUI();
    } catch (err) {
      console.error(err);
      if (list) list.innerHTML = '<tr><td colspan="6"><div style="padding:32px;text-align:center;color:#991b1b;">Failed to load events.</div></td></tr>';
    }
  }

  async deleteEvent(id) {
    if (!confirm('Are you sure you want to delete this event?')) return;
    try {
      const res = await fetch(`${this.API_URL}/${id}`, { method: 'DELETE', headers: await this.authHeaders() });
      if (!res.ok) throw new Error('Delete failed');
      await this.fetchEvents();
    } catch (err) {
      console.error(err);
      alert('Failed to delete event.');
    }
  }

  _showFormMsg(msg, type = 'success') {
    const existing = this.container.querySelector('#form-msg');
    if (existing) existing.remove();
    const bg = type === 'success' ? '#dcfce7' : '#fee2e2';
    const fg = type === 'success' ? '#166534' : '#991b1b';
    const form = this.container.querySelector('#admin-event-form');
    if (!form) return;
    form.insertAdjacentHTML('afterend', `<div id="form-msg" style="margin-top:12px;padding:12px 16px;background:${bg};color:${fg};border-radius:6px;font-size:14px;">${msg}</div>`);
    setTimeout(() => document.getElementById('form-msg')?.remove(), 4000);
  }

  async saveEvent(e) {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector('button[type="submit"]');
    const isEdit = form.dataset.id !== '';
    const id = form.dataset.id;

    const dateInput = form.fullDate.value;
    const dateObj = new Date(dateInput);
    const month = dateObj.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const day = dateObj.getDate().toString().padStart(2, '0');

    const imageFile = form.imageFile.files[0];
    let imageUrl = form.dataset.imageUrl || null;

    if (imageFile) {
      btn.textContent = 'Uploading image...';
      btn.disabled = true;
      const formData = new FormData();
      formData.append('file', imageFile);
      try {
        const uploadRes = await fetch(`${API_BASE}/upload`, { method: 'POST', body: formData, headers: await this.authHeaders(true) });
        if (uploadRes.ok) imageUrl = (await uploadRes.json()).url;
      } catch (uploadErr) { console.error('Image upload failed', uploadErr); }
    }

    btn.textContent = isEdit ? 'Saving...' : 'Creating...';
    btn.disabled = true;

    const data = {
      title: form.title.value,
      fullDate: dateInput, date: day, month,
      time: form.time.value,
      location: form.location.value,
      category: form.category.value,
      description: form.description.value,
      featured: form.featured.checked,
      registration_enabled: form.registration_enabled.checked,
      image: imageUrl
    };

    try {
      const url = isEdit ? `${this.API_URL}/${id}` : this.API_URL;
      const res = await fetch(url, { method: isEdit ? 'PUT' : 'POST', headers: await this.authHeaders(false), body: JSON.stringify(data) });
      if (!res.ok) { const b = await res.json().catch(()=>({})); throw new Error(b.error || 'Save failed'); }
      form.reset();
      form.dataset.id = ''; form.dataset.imageUrl = '';
      this.container.querySelector('#form-heading').textContent = 'Create New Event';
      btn.textContent = 'Save Event'; btn.disabled = false;
      this._updateRegToggleUI(false);
      this._showFormMsg(isEdit ? 'Event updated successfully.' : 'Event created successfully.', 'success');
      await this.fetchEvents();
    } catch (err) {
      console.error(err);
      btn.textContent = isEdit ? 'Update Event' : 'Save Event';
      btn.disabled = false;
      this._showFormMsg(err.message || 'Failed to save event.', 'error');
    }
  }

  editEvent(id) {
    const ev = this.events.find(e => e.id === id);
    if (!ev) return;
    const form = this.container.querySelector('#admin-event-form');
    form.dataset.id = ev.id;
    form.title.value = ev.title;
    form.fullDate.value = ev.fullDate || '';
    form.time.value = ev.time;
    form.location.value = ev.location;
    form.category.value = ev.category;
    form.description.value = ev.description;
    form.featured.checked = !!ev.featured;
    form.registration_enabled.checked = !!ev.registration_enabled;
    form.dataset.imageUrl = ev.image || '';
    this._updateRegToggleUI(!!ev.registration_enabled);
    this.container.querySelector('#form-heading').textContent = 'Edit Event';
    form.querySelector('button[type="submit"]').textContent = 'Update Event';
    form.scrollIntoView({ behavior: 'smooth' });
  }

  _updateRegToggleUI(enabled) {
    const label = this.container.querySelector('#reg-toggle-label');
    const text  = this.container.querySelector('#reg-toggle-text');
    if (!label || !text) return;
    if (enabled) {
      label.textContent = 'ON'; label.style.background = '#dcfce7'; label.style.color = '#166534';
      text.textContent = 'Allow visitors to register for this event';
    } else {
      label.textContent = 'OFF'; label.style.background = '#f1f5f9'; label.style.color = '#64748b';
      text.textContent = 'Information only — no registration form';
    }
  }

  render() {
    const content = `
      <div class="admin-header">
        <h2>Events Management</h2>
        <p>Add, edit, or remove upcoming church events.</p>
      </div>
      <div class="admin-grid">
        <div class="admin-card">
          <div class="admin-card-header"><h3 id="form-heading">Create New Event</h3></div>
          <div class="admin-card-body">
            <form id="admin-event-form" data-id="" data-image-url="" class="admin-form">
              <div class="form-group">
                <label>Event Title *</label>
                <input type="text" name="title" required placeholder="E.g. Sunday Service">
              </div>
              <div class="form-group-row">
                <div class="form-group"><label>Date *</label><input type="date" name="fullDate" required></div>
                <div class="form-group"><label>Time *</label><input type="text" name="time" placeholder="E.g. 10:00 AM" required></div>
              </div>
              <div class="form-group-row">
                <div class="form-group"><label>Location *</label><input type="text" name="location" required placeholder="E.g. Main Sanctuary"></div>
                <div class="form-group"><label>Category *</label><input type="text" name="category" placeholder="E.g. Worship, Youth" required></div>
              </div>
              <div class="form-group">
                <label>Description *</label>
                <textarea name="description" rows="3" required placeholder="Brief description of the event..."></textarea>
              </div>
              <div class="form-group">
                <label>Event Image (Optional)</label>
                <input type="file" name="imageFile" accept="image/*">
              </div>
              <div class="checkbox-group form-group">
                <input type="checkbox" name="featured" id="featured-ev">
                <label for="featured-ev">Feature on Homepage</label>
              </div>
              <div style="margin-bottom:20px;padding:16px;border:1px solid #e2e8f0;border-radius:8px;background:#f8fafc;">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
                  <span style="font-weight:700;font-size:14px;color:#1e293b;">Registration</span>
                  <span id="reg-toggle-label" style="font-size:12px;font-weight:700;padding:2px 10px;border-radius:12px;background:#f1f5f9;color:#64748b;">OFF</span>
                </div>
                <div class="checkbox-group" style="margin:0;">
                  <input type="checkbox" name="registration_enabled" id="registration-ev">
                  <label for="registration-ev" style="font-size:13px;color:#64748b;" id="reg-toggle-text">Information only — no registration form</label>
                </div>
              </div>
              <div class="admin-actions">
                <button type="submit" class="admin-btn admin-btn-primary">Save Event</button>
                <button type="button" class="admin-btn admin-btn-outline" id="cancel-event-btn">Cancel</button>
              </div>
            </form>
          </div>
        </div>

        <div class="admin-card" style="grid-column: 1 / -1;">
          <div class="admin-card-header"><h3>All Events</h3></div>
          <div style="overflow-x: auto;">
            <table class="admin-table" style="table-layout:fixed;width:100%;">
              <colgroup>
                <col style="width:30%"><col style="width:15%"><col style="width:16%">
                <col style="width:9%;text-align:center"><col style="width:14%"><col style="width:16%">
              </colgroup>
              <thead>
                <tr>
                  <th>Event Name &amp; Category</th>
                  <th>Date &amp; Time</th>
                  <th>Location</th>
                  <th style="text-align:center;">Featured</th>
                  <th>Status</th>
                  <th style="text-align:right;">Actions</th>
                </tr>
              </thead>
              <tbody id="admin-events-list">
                <tr><td colspan="6"><div style="padding:32px;text-align:center;color:#64748b;">Loading events...</div></td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    </div>`;

    this.container.innerHTML = AdminLayout.getLayout(content, '/admin/events');
    this.container.querySelector('#admin-event-form').addEventListener('submit', (e) => this.saveEvent(e));
    this.container.querySelector('#cancel-event-btn').addEventListener('click', () => {
      this.container.querySelector('#admin-event-form').reset();
      this.container.querySelector('#admin-event-form').dataset.id = '';
      this.container.querySelector('#admin-event-form').dataset.imageUrl = '';
      this.container.querySelector('#form-heading').textContent = 'Create New Event';
      this.container.querySelector('#admin-event-form button[type="submit"]').textContent = 'Save Event';
      this._updateRegToggleUI(false);
    });
    const regCb = this.container.querySelector('#registration-ev');
    regCb.addEventListener('change', () => this._updateRegToggleUI(regCb.checked));
    this._updateRegToggleUI(false);
    this.fetchEvents();
  }

  renderUI() {
    const list = this.container.querySelector('#admin-events-list');
    if (!list) return;
    if (!this.events || this.events.length === 0) {
      list.innerHTML = '<tr><td colspan="6"><div style="padding:32px;text-align:center;color:#64748b;">No events found.</div></td></tr>';
      return;
    }

    list.innerHTML = this.events.map(ev => {
      const initial = ev.title.charAt(0).toUpperCase();
      const regCount = this.regCounts[ev.id] ?? 0;

      const statusCell = ev.registration_enabled
        ? `<span style="display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:12px;background:#dcfce7;color:#166534;font-size:11px;font-weight:700;white-space:nowrap;">&#9679; Registration Enabled</span>`
        : `<span style="display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:12px;background:#f1f5f9;color:#64748b;font-size:11px;font-weight:600;white-space:nowrap;">&#9679; Information Only</span>`;

      const regsBtn = ev.registration_enabled
        ? `<button class="admin-btn admin-btn-outline view-regs" data-id="${ev.id}" data-title="${ev.title.replace(/"/g,'&quot;')}"
             style="font-size:11px;padding:4px 9px;display:inline-flex;align-items:center;gap:4px;white-space:nowrap;">
             <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
             Registrations ${regCount}
           </button>`
        : '';

      return `
        <tr>
          <td>
            <div style="display:flex;align-items:center;gap:10px;">
              <div style="width:34px;height:34px;border-radius:8px;background:#ede9e4;color:#791c1c;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;flex-shrink:0;">${initial}</div>
              <div>
                <div style="font-weight:600;color:#1e293b;font-size:14px;margin-bottom:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:190px;" title="${ev.title}">${ev.title}</div>
                <span style="font-size:11px;padding:2px 8px;border-radius:10px;background:#f1f5f9;color:#475569;font-weight:600;">${ev.category||''}</span>
              </div>
            </div>
          </td>
          <td>
            <div style="font-weight:600;color:#202124;font-size:13px;margin-bottom:2px;">${ev.date} ${ev.month}</div>
            <div style="color:#64748b;font-size:12px;">${ev.time}</div>
          </td>
          <td style="font-size:13px;color:#374151;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${ev.location}">${ev.location}</td>
          <td style="text-align:center;">
            ${ev.featured
              ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="#b6893f"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>'
              : '<span style="color:#cbd5e1;">&#8212;</span>'}
          </td>
          <td>${statusCell}</td>
          <td>
            <div style="display:flex;justify-content:flex-end;align-items:center;gap:6px;flex-wrap:wrap;">
              ${regsBtn}
              <button class="admin-icon-btn edit" data-id="${ev.id}" title="Edit"
                style="width:30px;height:30px;border:1px solid #e2e8f0;border-radius:6px;background:white;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#64748b;">
                <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
              </button>
              <button class="admin-icon-btn delete" data-id="${ev.id}" title="Delete"
                style="width:30px;height:30px;border:1px solid #fecaca;border-radius:6px;background:white;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#ef4444;">
                <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
              </button>
            </div>
          </td>
        </tr>`;
    }).join('');

    list.querySelectorAll('.edit').forEach(btn => btn.addEventListener('click', () => this.editEvent(btn.dataset.id)));
    list.querySelectorAll('.delete').forEach(btn => btn.addEventListener('click', () => this.deleteEvent(btn.dataset.id)));
    list.querySelectorAll('.view-regs').forEach(btn => {
      btn.addEventListener('click', () => {
        const ev = this.events.find(e => e.id === btn.dataset.id);
        this.viewRegistrations(btn.dataset.id, ev);
      });
    });
  }
}
