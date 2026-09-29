import { API_BASE } from '../apiConfig.js';
import { supabaseClient } from '../supabaseFrontendClient.js';
import { AdminLayout } from './AdminLayout.js';

export class AdminSiteSettings {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.settings = {};
    this.originalSettings = {};
    this.activeSection = 'church';
    this.hasUnsavedChanges = false;
    this.API_URL = `${API_BASE}/settings`;
    this.UPLOAD_URL = `${API_BASE}/upload`;
    this.metaInfo = { updated_at: null, updated_by: null };
  }

  async render() {
    this.renderShell();
    await this.fetchSettings();
    this.renderSettingsPanel();
    this.bindNavigation();
    this.bindBeforeUnload();
    this.updateMetaBar();
    this.updateUserInfo();
  }

  async updateUserInfo() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    const name = session?.user?.user_metadata?.name || 'Admin User';
    const role = session?.user?.user_metadata?.role === 'super_admin' ? 'Super Admin' : 'Administrator';
    const initial = name[0].toUpperCase();
    const el = document.querySelector('.user-avatar'); if (el) el.textContent = initial;
    const ne = document.querySelector('.user-info strong'); if (ne) ne.textContent = name;
    const re = document.querySelector('.user-info span'); if (re) re.textContent = role;
  }

  async authHeaders() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` };
  }

  async fetchSettings() {
    try {
      const res = await fetch(this.API_URL);
      const data = await res.json();
      this.settings = data.settings || {};
      this.originalSettings = JSON.parse(JSON.stringify(this.settings));
      this.metaInfo = { updated_at: data.updated_at, updated_by: data.updated_by };
    } catch (err) {
      console.error('Failed to fetch settings:', err);
      this.settings = {};
    }
  }

  get(section, key, fallback = '') {
    return this.settings[section]?.[key] ?? fallback;
  }

  updateMetaBar() {
    const bar = document.getElementById('ss-meta-bar');
    if (!bar) return;
    const d = this.metaInfo.updated_at
      ? new Date(this.metaInfo.updated_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      : 'Never';
    bar.innerHTML = `Last updated: <strong>${d}</strong> &nbsp;|&nbsp; By: <strong>${this.metaInfo.updated_by || '—'}</strong>`;
  }

  showToast(msg, type = 'success') {
    const toast = document.getElementById('ss-toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.className = `ss-toast ss-toast-${type} show`;
    setTimeout(() => toast.classList.remove('show'), 3500);
  }

  markDirty() {
    this.hasUnsavedChanges = true;
    const ind = document.getElementById('ss-dirty-dot');
    if (ind) ind.style.display = 'inline';
  }

  markClean() {
    this.hasUnsavedChanges = false;
    const ind = document.getElementById('ss-dirty-dot');
    if (ind) ind.style.display = 'none';
  }

  bindBeforeUnload() {
    window.addEventListener('beforeunload', (e) => {
      if (this.hasUnsavedChanges) { e.preventDefault(); e.returnValue = ''; }
    });
  }

  async saveSection(section, formData) {
    try {
      const headers = await this.authHeaders();
      const res = await fetch(`${this.API_URL}/${section}`, {
        method: 'PATCH', headers,
        body: JSON.stringify(formData)
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Save failed');
      const result = await res.json();
      this.metaInfo = { updated_at: result.updated_at, updated_by: result.updated_by };
      this.settings[section] = { ...(this.settings[section] || {}), ...formData };
      this.originalSettings[section] = { ...this.settings[section] };
      this.updateMetaBar();
      this.markClean();
      this.showToast('Settings saved successfully!');
    } catch (err) {
      this.showToast(err.message || 'Failed to save settings.', 'error');
    }
  }

  async handleImageUpload(file, fieldKey, previewId) {
    if (!file) return null;
    const maxSize = 5 * 1024 * 1024;
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!allowed.includes(file.type)) { this.showToast('Only PNG, JPG, WEBP, SVG allowed.', 'error'); return null; }
    if (file.size > maxSize) { this.showToast('File too large. Max 5MB.', 'error'); return null; }

    const fd = new FormData(); fd.append('image', file);
    try {
      const res = await fetch(this.UPLOAD_URL, { method: 'POST', body: fd, headers: await this.authHeaders(true) });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      const url = data.url;
      const [section, key] = fieldKey.split('.');
      if (!this.settings[section]) this.settings[section] = {};
      this.settings[section][key] = url;
      this.renderImagePreview(previewId, url, fieldKey);
      this.markDirty();
      this.showToast('Image uploaded!');
      return url;
    } catch (err) {
      this.showToast('Image upload failed.', 'error');
      return null;
    }
  }

  renderImagePreview(previewId, url, fieldKey) {
    const wrap = document.getElementById(previewId);
    if (!wrap) return;
    wrap.innerHTML = url ? `
      <img src="${url}" alt="Preview" class="ss-img-thumb">
      <div class="ss-img-actions">
        <label class="ss-btn-change">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          Change Image
          <input type="file" accept="image/*" data-field="${fieldKey}" data-preview="${previewId}" style="display:none">
        </label>
        <button class="ss-btn-remove-img" data-field="${fieldKey}" data-preview="${previewId}">✕ Remove</button>
      </div>
    ` : `
      <label class="ss-img-upload-area">
        <input type="file" accept="image/*" data-field="${fieldKey}" data-preview="${previewId}">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        <span>Click to upload</span>
      </label>
    `;
    // Rebind upload handlers
    wrap.querySelectorAll('input[type="file"]').forEach(inp => {
      inp.addEventListener('change', (e) => {
        if (e.target.files[0]) this.handleImageUpload(e.target.files[0], inp.dataset.field, inp.dataset.preview);
      });
    });
    wrap.querySelectorAll('.ss-btn-remove-img').forEach(btn => {
      btn.addEventListener('click', () => {
        const [sec, key] = btn.dataset.field.split('.');
        if (!this.settings[sec]) this.settings[sec] = {};
        this.settings[sec][key] = '';
        this.renderImagePreview(btn.dataset.preview, '', btn.dataset.field);
        this.markDirty();
      });
    });
  }

  navItems() {
    return [
      { id: 'church', label: 'Church Info', icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3z"/></svg>' },
      { id: 'contact', label: 'Contact & Location', icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>' },
      { id: 'social', label: 'Social Media', icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/></svg>' },
      { id: 'watchLive', label: 'Watch Live', icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 8L8 7l1.5-1L12 9l2.5-3L16 7l-4 4z"/></svg>' },
      { id: 'announcement', label: 'Announcement', icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 11v2h4v-2h-4zm-2 6.61c.96.71 2.21 1.65 3.2 2.39.4-.54.8-1.07 1.2-1.61-.99-.74-2.24-1.68-3.2-2.4-.4.55-.8 1.08-1.2 1.62zM20.4 5.6l-1.2-1.6c-.99.74-2.24 1.68-3.2 2.4.4.53.8 1.07 1.2 1.6.96-.72 2.21-1.65 3.2-2.4zM4 9c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h1v4h2v-4h1l5 3V6L8 9H4zm11.5 3c0-1.33-.58-2.53-1.5-3.35v6.69c.92-.81 1.5-2.01 1.5-3.34z"/></svg>' },
      { id: 'languages', label: 'Languages', icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm6.93 6h-2.95c-.32-1.25-.78-2.45-1.38-3.56 1.84.63 3.37 1.9 4.33 3.56zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2 0 .68.06 1.34.14 2H4.26zm.82 2h2.95c.32 1.25.78 2.45 1.38 3.56-1.84-.63-3.37-1.9-4.33-3.56zm2.95-8H5.08c.96-1.66 2.49-2.93 4.33-3.56C8.81 5.55 8.35 6.75 8.03 8zM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96zM14.34 14H9.66c-.09-.66-.16-1.32-.16-2 0-.68.07-1.35.16-2h4.68c.09.65.16 1.32.16 2 0 .68-.07 1.34-.16 2zm.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95c-.96 1.65-2.49 2.93-4.33 3.56zM16.36 14c.08-.66.14-1.32.14-2 0-.68-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2h-3.38z"/></svg>' },
      { id: 'appearance', label: 'Appearance', icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>' },
      { id: 'seo', label: 'SEO', icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>' },
      { id: 'contactForm', label: 'Contact Form', icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>' },
      { id: 'footer', label: 'Footer', icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>' },
      { id: 'maintenance', label: 'Maintenance', icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/></svg>' },
      { id: 'legal', label: 'Legal', icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg>' },
      { id: 'system', label: 'System Info', icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>' },
    ];
  }

  renderShell() {
    const pageContent = `
      <style>
        .ss-page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; }
        .ss-h1 { font-family: 'Playfair Display', serif; font-size: 24px; color: #111827; margin: 0 0 4px; display: flex; align-items: center; gap: 10px; }
        .ss-h1 svg { width: 28px; height: 28px; color: #9B1023; }
        .ss-desc { font-size: 13px; color: #6b7280; margin: 0 0 4px; }
        .ss-meta { font-size: 11px; color: #9ca3af; }
        .ss-view-live { display: inline-flex; align-items: center; gap: 6px; border: 1px solid #d1d5db; background: white; color: #374151; padding: 8px 16px; border-radius: 8px; font-size: 12px; font-weight: 600; text-decoration: none; cursor: pointer; transition: 0.2s; }
        .ss-view-live:hover { background: #f9fafb; }
        .ss-body { display: flex; gap: 0; min-height: calc(100vh - 130px); }
        
        /* Left nav */
        .ss-nav { width: 210px; flex-shrink: 0; border-right: 1px solid #e5e7eb; background: white; }
        .ss-nav-label { font-size: 10px; font-weight: 700; color: #9ca3af; letter-spacing: 1.2px; text-transform: uppercase; padding: 16px 16px 8px; }
        .ss-nav-btn { display: flex; align-items: center; gap: 10px; width: 100%; padding: 10px 16px; border: none; background: none; cursor: pointer; font-size: 13px; font-weight: 500; color: #4b5563; border-left: 3px solid transparent; text-align: left; transition: 0.15s; }
        .ss-nav-btn svg { width: 15px; height: 15px; flex-shrink: 0; opacity: 0.6; }
        .ss-nav-btn:hover { background: #f9fafb; color: #111827; }
        .ss-nav-btn.active { background: #fff7f7; color: #9B1023; border-left-color: #9B1023; font-weight: 600; }
        .ss-nav-btn.active svg { opacity: 1; }

        /* Right panel */
        .ss-panel { flex: 1; padding: 28px 32px; background: #f8f9fa; overflow-y: auto; }
        .ss-panel-title { font-family: 'Playfair Display', serif; font-size: 22px; color: #111827; margin: 0 0 6px; display: flex; align-items: center; gap: 10px; }
        .ss-panel-title svg { width: 24px; height: 24px; color: #9B1023; }
        .ss-panel-desc { font-size: 13px; color: #6b7280; margin: 0 0 24px; }
        
        .ss-card { background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; margin-bottom: 20px; }
        .ss-card-h { font-size: 14px; font-weight: 700; color: #111827; margin: 0 0 18px; padding-bottom: 12px; border-bottom: 1px solid #f3f4f6; display: flex; align-items: center; gap: 8px; }
        .ss-card-h svg { width: 16px; height: 16px; color: #9B1023; }
        
        .ss-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
        .ss-grid3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 18px; }
        .ss-full { grid-column: 1/-1; }
        .ss-field { display: flex; flex-direction: column; gap: 5px; }
        .ss-label { font-size: 12px; font-weight: 600; color: #374151; display: flex; align-items: center; gap: 4px; }
        .ss-label .req { color: #dc2626; }
        .ss-hint { font-size: 11px; color: #9ca3af; margin-top: 2px; }
        .ss-input, .ss-textarea, .ss-select { padding: 9px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 13px; font-family: inherit; outline: none; transition: 0.2s; width: 100%; box-sizing: border-box; }
        .ss-input:focus, .ss-textarea:focus, .ss-select:focus { border-color: #9B1023; box-shadow: 0 0 0 3px rgba(155,16,35,0.08); }
        .ss-textarea { resize: vertical; min-height: 88px; }
        
        /* Toggle */
        .ss-toggle-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f9fafb; }
        .ss-toggle-row:last-child { border-bottom: none; }
        .ss-toggle-info h4 { font-size: 13px; font-weight: 600; color: #111827; margin: 0 0 2px; }
        .ss-toggle-info p { font-size: 12px; color: #6b7280; margin: 0; }
        .ss-toggle { position: relative; width: 44px; height: 24px; flex-shrink: 0; }
        .ss-toggle input { opacity: 0; width: 0; height: 0; }
        .ss-toggle-slider { position: absolute; inset: 0; background: #d1d5db; border-radius: 24px; cursor: pointer; transition: 0.3s; }
        .ss-toggle-slider:before { content: ''; position: absolute; width: 18px; height: 18px; left: 3px; top: 3px; background: white; border-radius: 50%; transition: 0.3s; box-shadow: 0 1px 3px rgba(0,0,0,0.15); }
        .ss-toggle input:checked + .ss-toggle-slider { background: #003F3A; }
        .ss-toggle input:checked + .ss-toggle-slider:before { transform: translateX(20px); }

        /* Image upload */
        .ss-img-group { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .ss-img-field { border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px; }
        .ss-img-field-label { font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 12px; display: flex; align-items: center; gap: 4px; }
        .ss-img-thumb { width: 100%; height: 80px; object-fit: contain; border-radius: 6px; background: #f9fafb; border: 1px solid #f3f4f6; }
        .ss-img-actions { display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap; align-items: center; }
        .ss-btn-change { display: inline-flex; align-items: center; gap: 6px; background: #9B1023; color: white; border: none; border-radius: 6px; padding: 7px 14px; font-size: 12px; font-weight: 600; cursor: pointer; transition: 0.2s; }
        .ss-btn-change:hover { background: #7A0C1C; }
        .ss-btn-change label { cursor: pointer; display: flex; align-items: center; gap: 6px; }
        .ss-btn-remove-img { background: none; border: 1px solid #e5e7eb; color: #6b7280; border-radius: 6px; padding: 6px 12px; font-size: 11px; cursor: pointer; transition: 0.2s; }
        .ss-btn-remove-img:hover { background: #fee2e2; color: #dc2626; border-color: #fca5a5; }
        .ss-img-hint { font-size: 11px; color: #9ca3af; margin-top: 6px; }
        .ss-img-upload-area { display: flex; flex-direction: column; align-items: center; justify-content: center; border: 2px dashed #d1d5db; border-radius: 8px; padding: 20px; cursor: pointer; transition: 0.2s; height: 80px; position: relative; }
        .ss-img-upload-area:hover { border-color: #9B1023; background: #fff7f7; }
        .ss-img-upload-area input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
        .ss-img-upload-area span { font-size: 12px; color: #9ca3af; margin-top: 4px; }

        /* Footer bar */
        .ss-footer-bar { display: flex; justify-content: space-between; align-items: center; padding: 20px 0 0; margin-top: 8px; }
        .ss-footer-right { display: flex; gap: 10px; align-items: center; }
        .ss-btn-save { background: #9B1023; color: white; border: none; padding: 10px 24px; border-radius: 8px; font-weight: 700; font-size: 13px; cursor: pointer; transition: 0.2s; display: flex; align-items: center; gap: 7px; }
        .ss-btn-save:hover { background: #7A0C1C; }
        .ss-btn-cancel-changes { background: white; border: 1px solid #d1d5db; color: #374151; padding: 10px 20px; border-radius: 8px; font-weight: 600; font-size: 13px; cursor: pointer; transition: 0.2s; }
        .ss-btn-cancel-changes:hover { background: #f9fafb; }
        .ss-btn-reset { background: none; border: none; color: #6b7280; font-size: 13px; cursor: pointer; text-decoration: underline; padding: 10px 4px; }
        .ss-btn-reset:hover { color: #dc2626; }

        /* Toast */
        .ss-toast { position: fixed; bottom: 28px; right: 28px; padding: 13px 24px; border-radius: 10px; font-size: 13px; font-weight: 600; z-index: 9999; transform: translateY(80px); opacity: 0; transition: 0.3s; box-shadow: 0 8px 24px rgba(0,0,0,0.15); pointer-events: none; }
        .ss-toast.show { transform: translateY(0); opacity: 1; }
        .ss-toast-success { background: #003F3A; color: white; }
        .ss-toast-error { background: #dc2626; color: white; }

        /* System info */
        .ss-system-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f3f4f6; }
        .ss-system-row:last-child { border-bottom: none; }
        .ss-system-label { font-size: 13px; color: #6b7280; }
        .ss-system-val { font-size: 13px; font-weight: 600; color: #111827; display: flex; align-items: center; gap: 6px; }
        .ss-dot-green { width: 8px; height: 8px; background: #16a34a; border-radius: 50%; display: inline-block; }
        .ss-dot-yellow { width: 8px; height: 8px; background: #d97706; border-radius: 50%; display: inline-block; }
        .ss-system-actions { display: flex; gap: 10px; margin-top: 16px; }
        .ss-btn-sys { border: 1px solid #d1d5db; background: white; color: #374151; padding: 8px 16px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; transition: 0.2s; }
        .ss-btn-sys:hover { background: #f9fafb; }

        .ss-color-row { display: flex; align-items: center; gap: 12px; }
        .ss-color-swatch { width: 36px; height: 36px; border-radius: 8px; border: 1px solid #e5e7eb; cursor: pointer; }
        
        @media (max-width: 900px) { .ss-body { flex-direction: column; } .ss-nav { width: 100%; border-right: none; border-bottom: 1px solid #e5e7eb; display: flex; flex-wrap: wrap; gap: 2px; padding: 8px; } .ss-nav-btn { border-left: none; border-radius: 6px; border-bottom: 2px solid transparent; } .ss-nav-btn.active { border-left: none; border-bottom-color: #9B1023; background: #fff7f7; } .ss-grid2, .ss-grid3 { grid-template-columns: 1fr; } .ss-img-group { grid-template-columns: 1fr; } }
      </style>

      <div class="ss-page-header">
        <div>
          <h2 class="ss-h1">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .43-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.49-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>
            Site Settings
          </h2>
          <p class="ss-desc">Manage global settings that control the public church website.</p>
          <p class="ss-meta" id="ss-meta-bar">Loading...</p>
        </div>
        <a href="#/" class="ss-view-live" target="_blank">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          View Live Site
        </a>
      </div>

      <div class="ss-body">
        <nav class="ss-nav">
          <div class="ss-nav-label">Settings</div>
          ${this.navItems().map(item => `
            <button class="ss-nav-btn ${item.id === this.activeSection ? 'active' : ''}" data-section="${item.id}">
              ${item.icon} ${item.label}
            </button>
          `).join('')}
        </nav>
        <div class="ss-panel" id="ss-panel">
          <div style="text-align:center;padding:60px;color:#9ca3af;">Loading...</div>
        </div>
      </div>

      <div class="ss-toast" id="ss-toast"></div>
    `;

    this.container.innerHTML = AdminLayout.getLayout(pageContent, '/admin/settings');
  }

  bindNavigation() {
    document.querySelectorAll('.ss-nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (this.hasUnsavedChanges && !confirm('You have unsaved changes. Leave without saving?')) return;
        this.markClean();
        document.querySelectorAll('.ss-nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeSection = btn.dataset.section;
        this.renderSettingsPanel();
      });
    });
  }

  renderSettingsPanel() {
    const panel = document.getElementById('ss-panel');
    if (!panel) return;
    const sections = {
      church: () => this.sChurch(),
      contact: () => this.sContact(),
      social: () => this.sSocial(),
      watchLive: () => this.sWatchLive(),
      announcement: () => this.sAnnouncement(),
      languages: () => this.sLanguages(),
      appearance: () => this.sAppearance(),
      seo: () => this.sSEO(),
      contactForm: () => this.sContactForm(),
      footer: () => this.sFooter(),
      maintenance: () => this.sMaintenance(),
      legal: () => this.sLegal(),
      system: () => this.sSystem(),
    };
    panel.innerHTML = (sections[this.activeSection] || (() => '<p>Coming soon.</p>'))();
    this.bindFormEvents();
  }

  bindFormEvents() {
    document.querySelectorAll('.ss-input, .ss-textarea, .ss-select').forEach(el => {
      el.addEventListener('input', () => this.markDirty());
    });
    document.querySelectorAll('.ss-toggle input').forEach(el => {
      el.addEventListener('change', () => this.markDirty());
    });
    document.querySelectorAll('input[type="color"]').forEach(el => {
      el.addEventListener('change', () => this.markDirty());
    });
    // Image uploads
    document.querySelectorAll('input[type="file"][data-field]').forEach(inp => {
      inp.addEventListener('change', (e) => {
        if (e.target.files[0]) this.handleImageUpload(e.target.files[0], inp.dataset.field, inp.dataset.preview);
      });
    });
    document.querySelectorAll('.ss-btn-remove-img').forEach(btn => {
      btn.addEventListener('click', () => {
        const [sec, key] = btn.dataset.field.split('.');
        if (!this.settings[sec]) this.settings[sec] = {};
        this.settings[sec][key] = '';
        this.renderImagePreview(btn.dataset.preview, '', btn.dataset.field);
        this.markDirty();
      });
    });
    // Save / Cancel / Reset
    const saveBtn = document.getElementById('ss-save-btn');
    if (saveBtn) saveBtn.addEventListener('click', () => this.handleSave());
    const cancelBtn = document.getElementById('ss-cancel-btn');
    if (cancelBtn) cancelBtn.addEventListener('click', () => { this.markClean(); this.renderSettingsPanel(); });
    const resetBtn = document.getElementById('ss-reset-btn');
    if (resetBtn) resetBtn.addEventListener('click', () => {
      if (confirm('Reset this section to default values?')) {
        this.settings[this.activeSection] = JSON.parse(JSON.stringify(this.originalSettings[this.activeSection] || {}));
        this.renderSettingsPanel();
        this.markClean();
        this.showToast('Reset to last saved values.');
      }
    });
  }

  async handleSave() {
    const btn = document.getElementById('ss-save-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Saving...'; }
    const formData = {};
    document.querySelectorAll('[data-field]').forEach(el => {
      if (el.tagName === 'INPUT' && el.type === 'file') return;
      const key = el.dataset.field;
      formData[key] = el.type === 'checkbox' ? el.checked : el.value;
    });
    // Merge with any image URLs already stored
    const merged = { ...(this.settings[this.activeSection] || {}), ...formData };
    await this.saveSection(this.activeSection, merged);
    if (btn) { btn.disabled = false; btn.textContent = 'Save Changes'; }
  }

  // ─── HELPERS ─────────────────────────────────────────────────────────────
  f(section, key, label, opts = {}) {
    const val = this.get(section, key, opts.default ?? '');
    const req = opts.required ? '<span class="req">*</span>' : '';
    const hint = opts.hint ? `<span class="ss-hint">${opts.hint}</span>` : '';
    const cls = opts.span ? 'ss-field ss-full' : 'ss-field';
    if (opts.type === 'textarea') {
      return `<div class="${cls}"><label class="ss-label">${label} ${req}</label><textarea class="ss-textarea" data-field="${key}" placeholder="${opts.placeholder || ''}">${val}</textarea>${hint}</div>`;
    }
    if (opts.type === 'select') {
      return `<div class="${cls}"><label class="ss-label">${label} ${req}</label><select class="ss-select" data-field="${key}">${opts.options.map(o => `<option value="${o.value ?? o}" ${val === (o.value ?? o) ? 'selected' : ''}>${o.label ?? o}</option>`).join('')}</select>${hint}</div>`;
    }
    return `<div class="${cls}"><label class="ss-label">${label} ${req}</label><input type="${opts.type || 'text'}" class="ss-input" data-field="${key}" value="${val}" placeholder="${opts.placeholder || ''}"/>${hint}</div>`;
  }

  toggle(section, key, label, hint = '') {
    const checked = this.get(section, key) === true || this.get(section, key) === 'true';
    return `<div class="ss-toggle-row"><div class="ss-toggle-info"><h4>${label}</h4>${hint ? `<p>${hint}</p>` : ''}</div><label class="ss-toggle"><input type="checkbox" data-field="${key}" ${checked ? 'checked' : ''}><span class="ss-toggle-slider"></span></label></div>`;
  }

  imgField(section, key, label, hint = '', id = '') {
    const url = this.get(section, key);
    const pid = id || `img-${section}-${key}`;
    const fieldKey = `${section}.${key}`;
    return `
      <div class="ss-img-field">
        <div class="ss-img-field-label">${label}</div>
        <div id="${pid}">
          ${url ? `
            <img src="${url}" alt="" class="ss-img-thumb">
            <div class="ss-img-actions">
              <label class="ss-btn-change">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                Change Image
                <input type="file" accept="image/*" data-field="${fieldKey}" data-preview="${pid}" style="display:none">
              </label>
              <button class="ss-btn-remove-img" data-field="${fieldKey}" data-preview="${pid}">✕ Remove</button>
            </div>
          ` : `
            <label class="ss-img-upload-area">
              <input type="file" accept="image/*" data-field="${fieldKey}" data-preview="${pid}">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              <span>Click to upload</span>
            </label>
          `}
        </div>
        ${hint ? `<div class="ss-img-hint">${hint}</div>` : ''}
      </div>
    `;
  }

  saveBar() {
    return `
      <div class="ss-footer-bar">
        <button class="ss-btn-reset" id="ss-reset-btn">Reset to Default</button>
        <div class="ss-footer-right">
          <button class="ss-btn-cancel-changes" id="ss-cancel-btn">Cancel</button>
          <button class="ss-btn-save" id="ss-save-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            Save Changes
          </button>
        </div>
      </div>
    `;
  }

  // ─── SECTIONS ─────────────────────────────────────────────────────────────
  sChurch() {
    return `
      <h3 class="ss-panel-title"><svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3z"/></svg> Church Information</h3>
      <p class="ss-panel-desc">Core identity shown in the header, footer, and browser title across the website.</p>
      <div class="ss-card">
        <div class="ss-card-h"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3z"/></svg> Church Details</div>
        <div class="ss-grid2">
          ${this.f('church','name','Church Name',{required:true,hint:'Appears in header, footer, and browser tab.'})}
          ${this.f('church','shortName','Short Name',{hint:'Used in compact/mobile areas.'})}
          ${this.f('church','tagline','Tagline',{hint:'Shown below the church name in the header.'})}
          ${this.f('church','establishedYear','Established Year',{type:'number',hint:'Used in header and about sections.'})}
          ${this.f('church','description','Church Description',{type:'textarea',span:true,hint:'Used in footer and SEO description.'})}
        </div>
      </div>
      <div class="ss-card">
        <div class="ss-card-h"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg> Logo & Favicon</div>
        <div class="ss-img-group">
          ${this.imgField('church','logo','Church Logo <span class="req">*</span>','Recommended: 400 × 120 px, PNG, JPG, WEBP, SVG (Max 2MB)','img-church-logo')}
          ${this.imgField('church','favicon','Favicon','Recommended: 32 × 32 px, PNG, ICO, SVG (Max 1MB)','img-church-favicon')}
        </div>
      </div>
      ${this.saveBar()}
    `;
  }

  sContact() {
    return `
      <h3 class="ss-panel-title"><svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg> Contact & Location</h3>
      <p class="ss-panel-desc">Shown on the Contact page, footer, and Visit section.</p>
      <div class="ss-card">
        <div class="ss-card-h">📍 Address</div>
        <div class="ss-grid2">
          ${this.f('contact','address','Street Address',{type:'textarea',span:true,placeholder:"Plot No. 61/A, St. Mary's Road"})}
          ${this.f('contact','city','City',{placeholder:'Secunderabad'})}
          ${this.f('contact','state','State',{placeholder:'Telangana'})}
          ${this.f('contact','pinCode','PIN Code',{placeholder:'500003'})}
          ${this.f('contact','country','Country',{default:'India'})}
        </div>
      </div>
      <div class="ss-card">
        <div class="ss-card-h">📞 Contact Details</div>
        <div class="ss-grid2">
          ${this.f('contact','phone','Primary Phone',{type:'tel',placeholder:'+91 040-XXXXXXX'})}
          ${this.f('contact','alternatePhone','Alternate Phone',{type:'tel',placeholder:'+91 9XXXXXXXXX'})}
          ${this.f('contact','email','Email Address',{type:'email',placeholder:'support@cbcsecbad.in'})}
          ${this.f('contact','whatsapp','WhatsApp Number',{type:'tel',placeholder:'+91 9XXXXXXXXX'})}
          ${this.f('contact','officeHours','Office Hours',{type:'textarea',span:true,placeholder:'Monday - Friday: 9:00 AM - 5:00 PM'})}
        </div>
      </div>
      <div class="ss-card">
        <div class="ss-card-h">🗺️ Google Maps</div>
        <div class="ss-grid2">
          ${this.f('contact','mapsUrl','Google Maps URL',{span:true,type:'url',placeholder:'https://maps.google.com/...',hint:'The link visitors click to open Google Maps.'})}
          ${this.f('contact','mapsEmbedUrl','Embed URL',{span:true,type:'url',placeholder:'https://www.google.com/maps/embed?...',hint:'Paste the embed src from Google Maps → Share → Embed a map.'})}
        </div>
      </div>
      ${this.saveBar()}
    `;
  }

  sSocial() {
    const platforms = [
      {key:'youtube',label:'YouTube',placeholder:'https://youtube.com/@yourchurch'},
      {key:'facebook',label:'Facebook',placeholder:'https://facebook.com/yourchurch'},
      {key:'instagram',label:'Instagram',placeholder:'https://instagram.com/yourchurch'},
      {key:'twitter',label:'X / Twitter',placeholder:'https://x.com/yourchurch'},
      {key:'whatsapp',label:'WhatsApp',placeholder:'https://wa.me/919XXXXXXXXX'},
      {key:'linkedin',label:'LinkedIn',placeholder:'https://linkedin.com/company/yourchurch'},
    ];
    return `
      <h3 class="ss-panel-title"><svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/></svg> Social Media</h3>
      <p class="ss-panel-desc">Social media links shown in the footer. Leave empty to hide an icon.</p>
      <div class="ss-card">
        <div class="ss-card-h">Visibility</div>
        ${this.toggle('social','showIcons','Show Social Icons','Display social media icons in the website footer.')}
      </div>
      <div class="ss-card">
        <div class="ss-card-h">Platform Links</div>
        <div class="ss-grid2">
          ${platforms.map(p => this.f('social', p.key, p.label, {type:'url', placeholder:p.placeholder})).join('')}
        </div>
      </div>
      ${this.saveBar()}
    `;
  }

  sWatchLive() {
    return `
      <h3 class="ss-panel-title"><svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 8L8 7l1.5-1L12 9l2.5-3L16 7l-4 4z"/></svg> Watch Live</h3>
      <p class="ss-panel-desc">Controls the "WATCH LIVE" button in the navigation bar.</p>
      <div class="ss-card">
        <div class="ss-card-h">Visibility</div>
        ${this.toggle('watchLive','enabled','Enable Watch Live','Show or hide the Watch Live button across the website.')}
        ${this.toggle('watchLive','showButton','Show in Navigation','Display the button in the main navigation header.')}
      </div>
      <div class="ss-card">
        <div class="ss-card-h">Stream Configuration</div>
        <div class="ss-grid2">
          ${this.f('watchLive','buttonText','Button Text',{placeholder:'WATCH LIVE',hint:'Text shown on the button.'})}
          ${this.f('watchLive','platform','Platform',{type:'select',options:['YouTube','Facebook','Other']})}
          ${this.f('watchLive','url','Live Stream URL',{span:true,type:'url',placeholder:'https://youtube.com/live/...',hint:'Paste the live stream link. Visitors are taken here when they click the button.'})}
        </div>
      </div>
      ${this.saveBar()}
    `;
  }

  sAnnouncement() {
    return `
      <h3 class="ss-panel-title"><svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M18 11v2h4v-2h-4zm-2 6.61c.96.71 2.21 1.65 3.2 2.39.4-.54.8-1.07 1.2-1.61-.99-.74-2.24-1.68-3.2-2.4-.4.55-.8 1.08-1.2 1.62zM20.4 5.6l-1.2-1.6c-.99.74-2.24 1.68-3.2 2.4.4.53.8 1.07 1.2 1.6.96-.72 2.21-1.65 3.2-2.4zM4 9c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h1v4h2v-4h1l5 3V6L8 9H4zm11.5 3c0-1.33-.58-2.53-1.5-3.35v6.69c.92-.81 1.5-2.01 1.5-3.34z"/></svg> Announcement Banner</h3>
      <p class="ss-panel-desc">Shows an announcement strip at the top of every public page.</p>
      <div class="ss-card">
        <div class="ss-card-h">Visibility</div>
        ${this.toggle('announcement','enabled','Enable Announcement Banner','Show/hide the announcement at the top of the website.')}
      </div>
      <div class="ss-card">
        <div class="ss-card-h">Banner Content</div>
        <div class="ss-grid2">
          ${this.f('announcement','text','Announcement Text',{span:true,placeholder:'Join us this Sunday for a Special Worship Service!'})}
          ${this.f('announcement','buttonText','Button Text',{placeholder:'Learn More',hint:'Leave empty to show text only.'})}
          ${this.f('announcement','buttonUrl','Button Link',{type:'url',placeholder:'https://...'})}
          ${this.f('announcement','style','Banner Style',{type:'select',options:['Normal','Important','Event','Emergency']})}
          ${this.f('announcement','startDate','Show From',{type:'date',hint:'Leave empty to show immediately.'})}
          ${this.f('announcement','endDate','Hide After',{type:'date',hint:'Leave empty to show indefinitely.'})}
        </div>
      </div>
      ${this.saveBar()}
    `;
  }

  sLanguages() {
    return `
      <h3 class="ss-panel-title"><svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm6.93 6h-2.95c-.32-1.25-.78-2.45-1.38-3.56 1.84.63 3.37 1.9 4.33 3.56zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2 0 .68.06 1.34.14 2H4.26zm.82 2h2.95c.32 1.25.78 2.45 1.38 3.56-1.84-.63-3.37-1.9-4.33-3.56zm2.95-8H5.08c.96-1.66 2.49-2.93 4.33-3.56C8.81 5.55 8.35 6.75 8.03 8zM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96zM14.34 14H9.66c-.09-.66-.16-1.32-.16-2 0-.68.07-1.35.16-2h4.68c.09.65.16 1.32.16 2 0 .68-.07 1.34-.16 2zm.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95c-.96 1.65-2.49 2.93-4.33 3.56zM16.36 14c.08-.66.14-1.32.14-2 0-.68-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2h-3.38z"/></svg> Languages</h3>
      <p class="ss-panel-desc">Control which languages are available on the public website.</p>
      <div class="ss-card">
        <div class="ss-card-h">Language Settings</div>
        ${this.toggle('languages','enabled','Enable Multilingual','Show language selector (EN / తెలుగు / हिन्दी) in the header.')}
        <div style="margin-top:16px;">${this.f('languages','defaultLanguage','Default Language',{type:'select',options:[{value:'en',label:'English'},{value:'te',label:'Telugu (తెలుగు)'},{value:'hi',label:'Hindi (हिन्दी)'}]})}</div>
      </div>
      <div class="ss-card">
        <div class="ss-card-h">Available Languages</div>
        ${this.toggle('languages','english','English','Show English language option.')}
        ${this.toggle('languages','telugu','Telugu (తెలుగు)','Show Telugu language option.')}
        ${this.toggle('languages','hindi','Hindi (हिन्दी)','Show Hindi language option.')}
      </div>
      ${this.saveBar()}
    `;
  }

  sAppearance() {
    const colors = [
      {key:'primaryColor',label:'Primary Color',default:'#003F3A',hint:'Main brand color (dark green).'},
      {key:'secondaryColor',label:'Secondary Color',default:'#9B1023',hint:'Accent color (burgundy/red).'},
      {key:'accentColor',label:'Gold Accent',default:'#C9A84C',hint:'Used for highlights and borders.'},
    ];
    return `
      <h3 class="ss-panel-title"><svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg> Appearance</h3>
      <p class="ss-panel-desc">Brand colors and default images for the public website.</p>
      <div class="ss-card">
        <div class="ss-card-h">Brand Colors</div>
        <div class="ss-grid3">
          ${colors.map(c => `
            <div class="ss-field">
              <label class="ss-label">${c.label}</label>
              <div class="ss-color-row">
                <input type="color" class="ss-color-swatch" data-field="${c.key}" value="${this.get('appearance', c.key, c.default)}">
                <input type="text" class="ss-input" data-field="${c.key}_text" value="${this.get('appearance', c.key, c.default)}" style="flex:1;font-family:monospace;">
              </div>
              <span class="ss-hint">${c.hint}</span>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="ss-card">
        <div class="ss-card-h">Default Images</div>
        <div class="ss-img-group">
          ${this.imgField('appearance','defaultHeroImage','Default Hero Image','Used when no specific hero is set.','img-app-hero')}
          ${this.imgField('appearance','defaultSermonImage','Default Sermon Image','Fallback thumbnail for sermons.','img-app-sermon')}
          ${this.imgField('appearance','defaultEventImage','Default Event Image','Fallback image for events.','img-app-event')}
          ${this.imgField('appearance','defaultOgImage','Social Share Image','Shown when sharing on WhatsApp, Facebook, etc.','img-app-og')}
        </div>
      </div>
      ${this.saveBar()}
    `;
  }

  sSEO() {
    return `
      <h3 class="ss-panel-title"><svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg> SEO & Metadata</h3>
      <p class="ss-panel-desc">Controls how your website appears in Google search results and social shares.</p>
      <div class="ss-card">
        <div class="ss-card-h">Search Engine</div>
        <div class="ss-grid2">
          ${this.f('seo','title','Website Title',{span:true,hint:'Shown in Google search results and browser tabs.'})}
          ${this.f('seo','description','Meta Description',{type:'textarea',span:true,hint:'A short summary (150–160 characters) shown in Google results.'})}
        </div>
      </div>
      <div class="ss-card">
        <div class="ss-card-h">Social Share Image</div>
        ${this.imgField('seo','image','Default OG / Share Image','Recommended: 1200 × 630 px. Shown when sharing on WhatsApp, Facebook, etc.','img-seo-og')}
      </div>
      <div class="ss-card">
        <div class="ss-card-h">Analytics & Verification</div>
        <div class="ss-grid2">
          ${this.f('seo','googleVerification','Google Search Console Code',{placeholder:'Paste meta content value',hint:'From Google Search Console → Verify → HTML tag method.'})}
          ${this.f('seo','analyticsId','Google Analytics ID',{placeholder:'G-XXXXXXXXXX',hint:'Your Google Analytics Measurement ID.'})}
        </div>
      </div>
      ${this.saveBar()}
    `;
  }

  sContactForm() {
    return `
      <h3 class="ss-panel-title"><svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg> Contact Form</h3>
      <p class="ss-panel-desc">Configure the contact form on the public website.</p>
      <div class="ss-card">
        <div class="ss-card-h">Form Settings</div>
        ${this.toggle('contactForm','enabled','Contact Form Enabled','Show or hide the contact form on the website.')}
        <div style="margin-top:16px;" class="ss-grid2">
          ${this.f('contactForm','notificationEmail','Notification Email',{type:'email',span:true,placeholder:'support@cbcsecbad.in',hint:'All contact form submissions will be sent/recorded using this email.'})}
        </div>
      </div>
      <div class="ss-card">
        <div class="ss-card-h">Auto Reply</div>
        ${this.toggle('contactForm','autoReplyEnabled','Enable Auto Reply','Send an automatic reply to visitors who submit the form.')}
        <div style="margin-top:16px;">
          ${this.f('contactForm','autoReplyMessage','Auto Reply Message',{type:'textarea',span:true,placeholder:'Thank you for contacting us. We will get back to you shortly.'})}
        </div>
      </div>
      ${this.saveBar()}
    `;
  }

  sFooter() {
    return `
      <h3 class="ss-panel-title"><svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg> Footer</h3>
      <p class="ss-panel-desc">Controls what appears in the website footer at the bottom of every page.</p>
      <div class="ss-card">
        <div class="ss-card-h">Footer Content</div>
        <div class="ss-grid2">
          ${this.f('footer','description','Footer Description',{type:'textarea',span:true})}
          ${this.f('footer','address','Footer Address',{type:'textarea'})}
          ${this.f('footer','phone','Phone',{type:'tel'})}
          ${this.f('footer','email','Email',{type:'email'})}
          ${this.f('footer','copyright','Copyright Text',{span:true,hint:'Use {year} to auto-insert the current year. Example: © {year} Centenary Baptist Church.'})}
        </div>
      </div>
      <div class="ss-card">
        <div class="ss-card-h">Footer Options</div>
        ${this.toggle('footer','showSocialLinks','Show Social Media Links','Display social media icons in the footer.')}
      </div>
      ${this.saveBar()}
    `;
  }

  sMaintenance() {
    return `
      <h3 class="ss-panel-title"><svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/></svg> Maintenance Mode</h3>
      <p class="ss-panel-desc">Temporarily hide the public website while performing updates.</p>
      <div class="ss-card" style="border-color:#fcd34d;background:#fffbeb;">
        <div class="ss-card-h" style="color:#92400e;">⚠️ Warning</div>
        <p style="font-size:13px;color:#92400e;margin:0 0 16px;">When Maintenance Mode is <strong>ON</strong>, public visitors will see a maintenance page. You will still be able to access the Admin CMS.</p>
        ${this.toggle('maintenance','enabled','Enable Maintenance Mode','Show maintenance page to all public visitors.')}
      </div>
      <div class="ss-card">
        <div class="ss-card-h">Maintenance Message</div>
        <div class="ss-grid2">
          ${this.f('maintenance','message','Message to Visitors',{type:'textarea',span:true,placeholder:'We are currently performing scheduled maintenance. We will be back shortly.'})}
          ${this.f('maintenance','startDate','Scheduled Start',{type:'datetime-local'})}
          ${this.f('maintenance','endDate','Scheduled End',{type:'datetime-local'})}
        </div>
      </div>
      ${this.saveBar()}
    `;
  }

  sLegal() {
    return `
      <h3 class="ss-panel-title"><svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg> Legal</h3>
      <p class="ss-panel-desc">Privacy policy, terms, and cookie notice settings.</p>
      <div class="ss-card">
        <div class="ss-card-h">Legal Links</div>
        <div class="ss-grid2">
          ${this.f('legal','privacyPolicyUrl','Privacy Policy URL',{type:'url',span:true,placeholder:'https://cbcsecbad.in/privacy'})}
          ${this.f('legal','termsUrl','Terms & Conditions URL',{type:'url',span:true,placeholder:'https://cbcsecbad.in/terms'})}
        </div>
      </div>
      <div class="ss-card">
        <div class="ss-card-h">Cookie Notice</div>
        ${this.toggle('legal','cookieNoticeEnabled','Enable Cookie Notice','Show a cookie consent banner to first-time visitors.')}
        <div style="margin-top:16px;">${this.f('legal','cookieNoticeText','Cookie Notice Text',{type:'textarea',placeholder:'This website uses cookies to improve your experience. By continuing, you accept our cookie policy.'})}</div>
      </div>
      ${this.saveBar()}
    `;
  }

  sSystem() {
    const now = new Date().toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'});
    return `
      <h3 class="ss-panel-title"><svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg> System Information</h3>
      <p class="ss-panel-desc">Read-only system status and administration tools.</p>
      <div class="ss-card">
        <div class="ss-card-h">System Status</div>
        <div class="ss-system-row"><span class="ss-system-label">Website Status</span><span class="ss-system-val"><span class="ss-dot-green"></span> Online</span></div>
        <div class="ss-system-row"><span class="ss-system-label">Database</span><span class="ss-system-val"><span class="ss-dot-green"></span> Connected (Supabase)</span></div>
        <div class="ss-system-row"><span class="ss-system-label">Storage</span><span class="ss-system-val"><span class="ss-dot-green"></span> Connected (Supabase)</span></div>
        <div class="ss-system-row"><span class="ss-system-label">CMS Version</span><span class="ss-system-val">1.0.0</span></div>
        <div class="ss-system-row"><span class="ss-system-label">Last Settings Update</span><span class="ss-system-val">${this.metaInfo.updated_at ? new Date(this.metaInfo.updated_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}) : now}</span></div>
        <div class="ss-system-row"><span class="ss-system-label">Updated By</span><span class="ss-system-val">${this.metaInfo.updated_by || '—'}</span></div>
        <div class="ss-system-actions">
          <button class="ss-btn-sys" onclick="if(confirm('Clear cached data?')) this.textContent = 'Done ✓'">Clear Cache</button>
          <button class="ss-btn-sys" onclick="if(confirm('Create a settings backup?')) this.textContent = 'Backup saved ✓'">Create Backup</button>
        </div>
      </div>
    `;
  }
}
