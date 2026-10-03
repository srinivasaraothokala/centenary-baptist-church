import { API_BASE } from '../apiConfig.js';
import { supabaseClient } from '../supabaseFrontendClient.js';
import { AdminLayout } from './AdminLayout.js';

// HTML escape helper — prevents XSS when injecting user-controlled data into innerHTML
const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

export class AdminMedia {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.files = [];
    this.filtered = [];
    this.usageMap = {}; // url -> [{ module, label }]
    this.searchQuery = '';
    this.sortMode = 'newest';
    this.filterType = 'all';
    this.previewFile = null;
    this.API_URL = `${API_BASE}/media`;
  }

  // ─── Auth ──────────────────────────────────────────────────────────────────

  async authHeaders() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    return { Authorization: `Bearer ${session?.access_token}` };
  }

  // ─── Toast ─────────────────────────────────────────────────────────────────

  showToast(msg, type = 'success') {
    const t = document.getElementById('ml-toast');
    if (!t) return;
    t.textContent = msg;
    t.className = `ml-toast ml-toast-${type} show`;
    setTimeout(() => t.classList.remove('show'), 3200);
  }

  // ─── Data ──────────────────────────────────────────────────────────────────

  async fetchAll() {
    this.setGridLoading(true);
    try {
      const headers = await this.authHeaders();
      const [filesRes, usageRes] = await Promise.allSettled([
        fetch(this.API_URL, { headers }),
        fetch(`${this.API_URL}/usage`, { headers })
      ]);

      if (filesRes.status === 'fulfilled' && filesRes.value.ok) {
        this.files = await filesRes.value.json();
      } else {
        this.files = [];
      }

      if (usageRes.status === 'fulfilled' && usageRes.value.ok) {
        this.usageMap = await usageRes.value.json();
      } else {
        this.usageMap = {};
      }

      this.applyFilters();
    } catch (err) {
      console.error(err);
      this.showToast('Failed to load media files.', 'error');
      this.setGridLoading(false, true);
    }
  }

  setGridLoading(loading, error = false) {
    const grid = document.getElementById('ml-grid');
    if (!grid) return;
    if (loading) {
      grid.innerHTML = `<div class="ml-empty"><div class="ml-empty-icon">⏳</div><div>Loading media files…</div></div>`;
    } else if (error) {
      grid.innerHTML = `<div class="ml-empty" style="color:#dc2626;"><div class="ml-empty-icon">⚠️</div><div>Failed to load. Check server connection.</div></div>`;
    }
  }

  // ─── Filters / Sort ────────────────────────────────────────────────────────

  applyFilters() {
    let list = [...this.files];

    // Type filter
    if (this.filterType === 'images') {
      list = list.filter(f => f.mimetype?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(f.name));
    } else if (this.filterType === 'other') {
      list = list.filter(f => !f.mimetype?.startsWith('image/') && !/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(f.name));
    }

    // Search
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(f => f.name.toLowerCase().includes(q));
    }

    // Sort
    if (this.sortMode === 'newest') list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    else if (this.sortMode === 'oldest') list.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    else if (this.sortMode === 'largest') list.sort((a, b) => (b.size || 0) - (a.size || 0));
    else if (this.sortMode === 'smallest') list.sort((a, b) => (a.size || 0) - (b.size || 0));
    else if (this.sortMode === 'az') list.sort((a, b) => a.name.localeCompare(b.name));
    else if (this.sortMode === 'za') list.sort((a, b) => b.name.localeCompare(a.name));

    this.filtered = list;
    this.renderGrid();
    this.renderStats();
    this.updateCountLabel(); // BUG-02/06: always sync count label after any filter/sort/load
  }

  // ─── Stats ─────────────────────────────────────────────────────────────────

  renderStats() {
    const total = this.files.length;
    const usedCount = this.files.filter(f => (this.usageMap[f.url] || []).length > 0).length;
    const unused = total - usedCount;
    const totalSize = this.files.reduce((sum, f) => sum + (f.size || 0), 0);
    const sizeLabel = totalSize > 1024 * 1024
      ? (totalSize / (1024 * 1024)).toFixed(1) + ' MB'
      : (totalSize / 1024).toFixed(0) + ' KB';

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('ml-stat-total', total);
    set('ml-stat-size', sizeLabel);
    set('ml-stat-used', usedCount);
    set('ml-stat-unused', unused);
    // ml-stat-shown removed — no such element exists in the HTML (BUG-02 fix)
  }

  // ─── Grid ──────────────────────────────────────────────────────────────────

  renderGrid() {
    const grid = document.getElementById('ml-grid');
    if (!grid) return;

    if (!this.filtered.length) {
      grid.innerHTML = `
        <div class="ml-empty">
          <div class="ml-empty-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          </div>
          <div class="ml-empty-title">${this.searchQuery ? 'No files match your search' : 'No media files uploaded yet'}</div>
          <div class="ml-empty-sub">${this.searchQuery ? 'Try a different search term or clear the filter.' : 'Upload your first image using the button above.'}</div>
        </div>`;
      return;
    }

    grid.innerHTML = this.filtered.map(f => {
      const isImage = f.mimetype?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(f.name);
      const ext = f.name.split('.').pop()?.toUpperCase() || 'FILE';
      const usages = this.usageMap[f.url] || [];
      const isUsed = usages.length > 0;
      const sizeLabel = f.size > 1024 * 1024
        ? (f.size / (1024 * 1024)).toFixed(1) + ' MB'
        : f.size > 1024 ? (f.size / 1024).toFixed(0) + ' KB' : (f.size || '?') + ' B';
      const displayName = f.name.length > 26 ? '…' + f.name.slice(-22) : f.name;

      return `
        <div class="ml-card" data-filename="${f.name}" data-url="${f.url}">
          <div class="ml-thumb" data-preview="${f.name}">
            ${isImage
              ? `<img src="${f.url}" alt="${f.name}" loading="lazy" onerror="this.closest('.ml-thumb').innerHTML='<div class=\\'ml-thumb-icon\\'>📄</div>'">`
              : `<div class="ml-thumb-icon">📄</div>`
            }
            <div class="ml-thumb-overlay">
              <button class="ml-btn-preview" data-filename="${f.name}" title="Preview">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
            </div>
          </div>
          <div class="ml-card-body">
            <div class="ml-card-name" title="${f.name}">${displayName}</div>
            <div class="ml-card-meta">${ext} &bull; ${sizeLabel}</div>
            ${isUsed
              ? `<div class="ml-badge ml-badge-used">Used in ${usages.length} place${usages.length > 1 ? 's' : ''}</div>`
              : `<div class="ml-badge ml-badge-unused">Unused</div>`
            }
          </div>
          <div class="ml-card-actions">
            <button class="ml-btn-copy" data-url="${f.url}" title="Copy URL">Copy URL</button>
            <button class="ml-btn-delete" data-filename="${f.name}" title="Delete" ${isUsed ? 'data-used="true"' : ''}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
            </button>
          </div>
        </div>`;
    }).join('');

    // Bind
    grid.querySelectorAll('.ml-btn-copy').forEach(btn =>
      btn.addEventListener('click', e => { e.stopPropagation(); this.copyUrl(btn.dataset.url, btn); })
    );
    grid.querySelectorAll('.ml-btn-delete').forEach(btn =>
      btn.addEventListener('click', e => { e.stopPropagation(); this.showDeleteModal(btn.dataset.filename); })
    );
    grid.querySelectorAll('.ml-btn-preview').forEach(btn =>
      btn.addEventListener('click', e => { e.stopPropagation(); this.showPreviewModal(btn.dataset.filename); })
    );
  }

  // ─── Copy URL ──────────────────────────────────────────────────────────────

  async copyUrl(url, btn) {
    try {
      await navigator.clipboard.writeText(url);
      const orig = btn.textContent;
      btn.textContent = '✓ Copied!';
      btn.classList.add('ml-btn-copy-success');
      setTimeout(() => { btn.textContent = orig; btn.classList.remove('ml-btn-copy-success'); }, 2000);
    } catch {
      this.showToast('Copy failed — select the URL and copy manually.', 'error');
    }
  }

  // ─── Preview Modal ─────────────────────────────────────────────────────────

  showPreviewModal(filename) {
    const f = this.files.find(x => x.name === filename);
    if (!f) return;
    const usages = this.usageMap[f.url] || [];
    const isUsed = usages.length > 0;
    const ext = f.name.split('.').pop()?.toUpperCase() || '';
    const sizeLabel = f.size > 1024 * 1024
      ? (f.size / (1024 * 1024)).toFixed(1) + ' MB'
      : f.size > 1024 ? (f.size / 1024).toFixed(0) + ' KB' : (f.size || '?') + ' B';
    const dateLabel = f.created_at ? new Date(f.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

    const modal = document.getElementById('ml-preview-modal');
    modal.querySelector('#ml-pm-img').src = f.url;
    modal.querySelector('#ml-pm-img').alt = f.name;
    modal.querySelector('#ml-pm-name').textContent = f.name;
    modal.querySelector('#ml-pm-meta').textContent = `${ext} • ${sizeLabel} • Uploaded ${dateLabel}`;

    const usageSection = modal.querySelector('#ml-pm-usage');
    if (isUsed) {
      usageSection.innerHTML = `
        <div class="ml-pm-usage-label">Used in ${usages.length} place${usages.length > 1 ? 's' : ''}:</div>
        <ul class="ml-pm-usage-list">
          ${usages.map(u => `<li><strong>${esc(u.module)}</strong> — ${esc(u.label)}</li>`).join('')}
        </ul>`;
    } else {
      usageSection.innerHTML = `<div class="ml-pm-unused">Not currently used anywhere.</div>`;
    }

    modal.querySelector('#ml-pm-copy').onclick = () => this.copyUrl(f.url, modal.querySelector('#ml-pm-copy'));
    modal.style.display = 'flex';
  }

  // ─── Delete Modal ──────────────────────────────────────────────────────────

  showDeleteModal(filename) {
    const f = this.files.find(x => x.name === filename);
    if (!f) return;

    // BUG-04 FIX: always derive from LIVE usageMap — never from stale card data-used attribute
    const usages = this.usageMap[f.url] || [];
    const isCurrentlyUsed = usages.length > 0;

    const modal = document.getElementById('ml-delete-modal');
    const warnEl = modal.querySelector('#ml-dm-warning');
    const usageEl = modal.querySelector('#ml-dm-usages');
    const confirmBtn = modal.querySelector('#ml-dm-confirm');

    // ── RESET to clean state before every open — prevents stale state leaking between files ──
    confirmBtn.style.display = 'none';
    confirmBtn.onclick = null;
    warnEl.style.display = 'none';
    usageEl.innerHTML = '';

    // ── Populate file info ──
    const img = modal.querySelector('#ml-dm-img');
    img.src = f.url;
    img.alt = f.name;
    modal.querySelector('#ml-dm-name').textContent = f.name;

    if (isCurrentlyUsed) {
      warnEl.style.display = 'block';
      usageEl.innerHTML = `<ul class="ml-dm-usage-list">
        ${usages.map(u => `<li><strong>${esc(u.module)}</strong> — ${esc(u.label)}</li>`).join('')}
      </ul>`;
      // confirmBtn stays hidden — deletion is blocked for used assets
    } else {
      usageEl.innerHTML = `<div class="ml-dm-safe">This file is not currently used anywhere.</div>`;
      confirmBtn.style.display = 'inline-flex';
      confirmBtn.onclick = () => this.executeDelete(filename, modal);
    }

    modal.querySelector('#ml-dm-cancel').onclick = () => { modal.style.display = 'none'; };
    modal.style.display = 'flex';
  }

  async executeDelete(filename, modal) {
    const confirmBtn = modal.querySelector('#ml-dm-confirm');
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Deleting…';

    try {
      const res = await fetch(`${this.API_URL}/${encodeURIComponent(filename)}`, {
        method: 'DELETE',
        headers: await this.authHeaders()
      });

      if (res.status === 409) {
        // Server-side usage check — race condition protection
        const body = await res.json();
        const usageEl = modal.querySelector('#ml-dm-usages');
        usageEl.innerHTML = `<div style="color:#dc2626;font-weight:600;margin-bottom:8px;">Cannot delete — file is currently in use:</div>
          <ul class="ml-dm-usage-list">${(body.usages || []).map(u => `<li><strong>${esc(u.module)}</strong> — ${esc(u.label)}</li>`).join('')}</ul>`;
        modal.querySelector('#ml-dm-warning').style.display = 'block';
        confirmBtn.style.display = 'none';
        return;
      }

      if (!res.ok) throw new Error();

      // BUG-01 FIX: capture file URL BEFORE removing it from this.files
      const deletedFile = this.files.find(f => f.name === filename);
      const deletedUrl  = deletedFile?.url;

      modal.style.display = 'none';
      this.files    = this.files.filter(f => f.name !== filename);
      this.filtered = this.filtered.filter(f => f.name !== filename);
      if (deletedUrl) delete this.usageMap[deletedUrl];
      this.applyFilters();
      this.showToast('File deleted successfully.');
    } catch {
      this.showToast('Failed to delete file.', 'error');
    } finally {
      confirmBtn.disabled = false;
      confirmBtn.textContent = 'Delete Permanently';
    }
  }

  // ─── Upload ────────────────────────────────────────────────────────────────

  async uploadFiles(files) {
    if (!files.length) return;
    const btn = document.getElementById('ml-upload-btn');
    const progress = document.getElementById('ml-upload-progress');
    if (btn) btn.disabled = true;
    if (progress) { progress.textContent = `Uploading 0 / ${files.length}…`; progress.style.display = 'block'; }

    const headers = await this.authHeaders();
    let done = 0;

    for (const file of files) {
      const fd = new FormData();
      fd.append('file', file);
      try {
        const res = await fetch(this.API_URL, { method: 'POST', body: fd, headers });
        if (res.ok) {
          done++;
          if (progress) progress.textContent = `Uploading ${done} / ${files.length}…`;
        } else {
          const body = await res.json().catch(() => ({}));
          this.showToast(body.error || `Failed to upload ${file.name}`, 'error');
        }
      } catch {
        this.showToast(`Upload error: ${file.name}`, 'error');
      }
    }

    if (progress) progress.style.display = 'none';
    if (btn) btn.disabled = false;
    if (done > 0) this.showToast(`${done} file${done > 1 ? 's' : ''} uploaded successfully.`);
    await this.fetchAll();
  }

  // ─── Render Shell ──────────────────────────────────────────────────────────

  render() {
    const content = `
      <style>
        /* ── Toast ─────────────────────────────────────── */
        .ml-toast { position:fixed; bottom:28px; right:28px; padding:12px 22px; border-radius:10px; font-size:14px; font-weight:600; z-index:10000; opacity:0; transform:translateY(12px); transition:all .3s; pointer-events:none; }
        .ml-toast.show { opacity:1; transform:translateY(0); }
        .ml-toast-success { background:#003F3A; color:#fff; }
        .ml-toast-error { background:#dc2626; color:#fff; }

        /* ── Page Layout ────────────────────────────────── */
        .ml-page { max-width: 1400px; }
        .ml-page-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:28px; flex-wrap:wrap; gap:16px; }
        .ml-page-title h2 { font-family:'Playfair Display', serif; font-size:26px; margin:0 0 4px; color:#18201F; font-weight:700; }
        .ml-page-title p { margin:0; color:#66716F; font-size:14px; }

        /* ── Stats ──────────────────────────────────────── */
        .ml-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin-bottom:24px; }
        .ml-stat-card { background:#fff; border:1px solid #E3E7E5; border-radius:12px; padding:18px 20px; position:relative; overflow:hidden; }
        .ml-stat-card::before { content:''; position:absolute; top:0; left:0; width:3px; height:100%; }
        .ml-stat-card:nth-child(1)::before { background:#9B1023; }
        .ml-stat-card:nth-child(2)::before { background:#003F3A; }
        .ml-stat-card:nth-child(3)::before { background:#16805B; }
        .ml-stat-card:nth-child(4)::before { background:#6366f1; }
        .ml-stat-icon { width:34px; height:34px; border-radius:8px; display:flex; align-items:center; justify-content:center; margin-bottom:12px; }
        .ml-stat-num { font-size:32px; font-weight:800; color:#18201F; line-height:1; margin-bottom:4px; letter-spacing:-1px; }
        .ml-stat-label { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:#66716F; }
        @media(max-width:900px){.ml-stats{grid-template-columns:repeat(2,1fr);}}
        @media(max-width:500px){.ml-stats{grid-template-columns:1fr;}}

        /* ── Toolbar ─────────────────────────────────────── */
        .ml-toolbar { background:#fff; border:1px solid #E3E7E5; border-radius:12px; padding:16px 20px; margin-bottom:20px; display:flex; align-items:center; gap:12px; flex-wrap:wrap; }
        .ml-search-wrap { position:relative; flex:1; min-width:200px; }
        .ml-search-wrap svg { position:absolute; left:11px; top:50%; transform:translateY(-50%); color:#9ca3af; pointer-events:none; }
        .ml-search-wrap input { width:100%; padding:9px 14px 9px 34px; border:1.5px solid #E3E7E5; border-radius:8px; font-size:13px; font-family:inherit; color:#18201F; transition:border-color .2s; box-sizing:border-box; }
        .ml-search-wrap input:focus { outline:none; border-color:#003F3A; }
        .ml-toolbar select { padding:9px 12px; border:1.5px solid #E3E7E5; border-radius:8px; font-size:13px; font-family:inherit; background:#fff; color:#18201F; cursor:pointer; }
        .ml-toolbar select:focus { outline:none; border-color:#003F3A; }
        .ml-btn-reset { padding:9px 16px; border:1.5px solid #E3E7E5; border-radius:8px; background:#fff; font-size:13px; font-weight:600; color:#66716F; cursor:pointer; transition:.2s; white-space:nowrap; }
        .ml-btn-reset:hover { border-color:#9B1023; color:#9B1023; }
        .ml-toolbar-right { display:flex; align-items:center; gap:8px; margin-left:auto; }
        .ml-count-label { font-size:12px; color:#66716F; white-space:nowrap; }

        /* ── Upload zone ─────────────────────────────────── */
        .ml-upload-zone { background:#fff; border:1px solid #E3E7E5; border-radius:12px; margin-bottom:20px; overflow:hidden; }
        .ml-upload-zone-header { display:flex; align-items:center; justify-content:space-between; padding:14px 20px; border-bottom:1px solid #E3E7E5; }
        .ml-upload-zone-header h3 { margin:0; font-size:15px; font-weight:700; color:#18201F; }
        .ml-dropzone { border:2px dashed #cbd5e1; border-radius:10px; padding:28px 20px; text-align:center; cursor:pointer; transition:border-color .2s, background .2s; margin:16px; }
        .ml-dropzone:hover, .ml-dropzone.drag-over { border-color:#003F3A; background:#f0fdf8; }
        .ml-dropzone-icon { font-size:32px; margin-bottom:10px; }
        .ml-dropzone h4 { margin:0 0 4px; font-size:15px; color:#1e293b; font-weight:700; }
        .ml-dropzone p { margin:0 0 14px; font-size:12px; color:#64748b; }
        #ml-file-input { display:none; }
        #ml-upload-btn { padding:9px 22px; background:#9B1023; color:#fff; border:none; border-radius:8px; font-size:13px; font-weight:700; cursor:pointer; transition:background .2s; }
        #ml-upload-btn:hover { background:#7A0C1C; }
        #ml-upload-btn:disabled { opacity:.6; cursor:not-allowed; }
        #ml-upload-progress { display:none; margin-top:10px; font-size:13px; color:#64748b; font-weight:600; }

        /* ── Grid ────────────────────────────────────────── */
        .ml-grid-wrap { background:#fff; border:1px solid #E3E7E5; border-radius:12px; overflow:hidden; }
        .ml-grid-header { display:flex; align-items:center; justify-content:space-between; padding:14px 20px; border-bottom:1px solid #E3E7E5; }
        .ml-grid-header h3 { margin:0; font-size:15px; font-weight:700; color:#18201F; }
        .ml-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(175px,1fr)); gap:12px; padding:16px; }

        /* ── Card ────────────────────────────────────────── */
        .ml-card { background:#fff; border:1px solid #f1f5f9; border-radius:10px; overflow:hidden; transition:box-shadow .2s, transform .15s; display:flex; flex-direction:column; }
        .ml-card:hover { box-shadow:0 4px 16px rgba(0,0,0,0.1); transform:translateY(-2px); }
        .ml-thumb { height:110px; background:#f8fafc; display:flex; align-items:center; justify-content:center; overflow:hidden; position:relative; cursor:pointer; }
        .ml-thumb img { width:100%; height:100%; object-fit:cover; display:block; }
        .ml-thumb-icon { font-size:32px; }
        .ml-thumb-overlay { position:absolute; inset:0; background:rgba(0,0,0,0); display:flex; align-items:center; justify-content:center; transition:background .2s; }
        .ml-card:hover .ml-thumb-overlay { background:rgba(0,0,0,0.35); }
        .ml-btn-preview { opacity:0; background:rgba(255,255,255,0.95); border:none; border-radius:8px; padding:7px 10px; cursor:pointer; color:#18201F; transition:opacity .2s; display:flex; align-items:center; gap:4px; font-size:12px; font-weight:600; }
        .ml-card:hover .ml-btn-preview { opacity:1; }
        .ml-card-body { padding:10px 12px 6px; flex:1; }
        .ml-card-name { font-size:11px; color:#374151; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-bottom:3px; }
        .ml-card-meta { font-size:10px; color:#94a3b8; margin-bottom:6px; }
        .ml-badge { display:inline-block; padding:2px 8px; border-radius:20px; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.04em; }
        .ml-badge-used { background:#dcfce7; color:#15803d; }
        .ml-badge-unused { background:#f1f5f9; color:#64748b; }
        .ml-card-actions { display:flex; gap:6px; padding:8px 10px 10px; }
        .ml-btn-copy { flex:1; padding:5px 8px; border:none; border-radius:6px; background:#f0f0ff; color:#6366f1; font-size:11px; font-weight:700; cursor:pointer; transition:background .2s; }
        .ml-btn-copy:hover { background:#e0e0ff; }
        .ml-btn-copy-success { background:#dcfce7 !important; color:#16a34a !important; }
        .ml-btn-delete { padding:5px 8px; border:none; border-radius:6px; background:#fef2f2; color:#dc2626; cursor:pointer; transition:background .2s; display:flex; align-items:center; justify-content:center; }
        .ml-btn-delete:hover { background:#fee2e2; }

        /* ── Empty state ─────────────────────────────────── */
        .ml-empty { grid-column:1/-1; text-align:center; padding:60px 20px; color:#94a3b8; }
        .ml-empty-icon { margin-bottom:14px; display:flex; justify-content:center; }
        .ml-empty-title { font-size:16px; font-weight:700; color:#374151; margin-bottom:6px; }
        .ml-empty-sub { font-size:13px; }

        /* ── Upload button ───────────────────────────────── */
        .ml-btn-primary { padding:10px 20px; background:#9B1023; color:#fff; border:none; border-radius:8px; font-size:14px; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; gap:8px; transition:background .2s; }
        .ml-btn-primary:hover { background:#7A0C1C; }

        /* ── Refresh btn ─────────────────────────────────── */
        .ml-btn-refresh { padding:8px 14px; border:1.5px solid #E3E7E5; border-radius:8px; background:#fff; font-size:13px; font-weight:600; color:#66716F; cursor:pointer; transition:.2s; display:inline-flex; align-items:center; gap:6px; }
        .ml-btn-refresh:hover { border-color:#003F3A; color:#003F3A; }

        /* ── Preview Modal ───────────────────────────────── */
        .ml-modal-bg { display:none; position:fixed; inset:0; background:rgba(0,0,0,0.55); z-index:9000; align-items:center; justify-content:center; padding:20px; }
        .ml-modal { background:#fff; border-radius:16px; max-width:620px; width:100%; max-height:90vh; overflow-y:auto; box-shadow:0 24px 64px rgba(0,0,0,0.25); }
        .ml-modal-header { display:flex; align-items:center; justify-content:space-between; padding:18px 22px 14px; border-bottom:1px solid #E3E7E5; }
        .ml-modal-header h3 { margin:0; font-size:17px; font-weight:700; color:#18201F; }
        .ml-modal-close { width:32px; height:32px; border:none; background:#f1f5f9; border-radius:8px; cursor:pointer; color:#64748b; display:flex; align-items:center; justify-content:center; font-size:18px; line-height:1; }
        .ml-modal-close:hover { background:#e2e8f0; }
        .ml-modal-body { padding:20px 22px; }
        .ml-pm-img-wrap { border-radius:10px; overflow:hidden; margin-bottom:18px; background:#f8fafc; max-height:340px; display:flex; align-items:center; justify-content:center; }
        .ml-pm-img-wrap img { width:100%; height:auto; max-height:340px; object-fit:contain; display:block; }
        .ml-pm-filename { font-size:15px; font-weight:700; color:#18201F; margin-bottom:4px; word-break:break-all; }
        .ml-pm-meta { font-size:13px; color:#66716F; margin-bottom:16px; }
        .ml-pm-usage-label { font-size:13px; font-weight:700; color:#18201F; margin-bottom:8px; }
        .ml-pm-usage-list { margin:0; padding:0 0 0 18px; }
        .ml-pm-usage-list li { font-size:13px; color:#374151; margin-bottom:4px; }
        .ml-pm-unused { font-size:13px; color:#64748b; padding:10px 14px; background:#f8fafc; border-radius:8px; }
        .ml-modal-footer { padding:14px 22px 18px; border-top:1px solid #E3E7E5; display:flex; gap:10px; justify-content:flex-end; }

        /* ── Delete Modal ────────────────────────────────── */
        .ml-dm-thumb { width:80px; height:60px; border-radius:8px; overflow:hidden; background:#f8fafc; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .ml-dm-thumb img { width:100%; height:100%; object-fit:cover; }
        .ml-dm-header-row { display:flex; gap:14px; align-items:flex-start; margin-bottom:16px; }
        .ml-dm-info { flex:1; min-width:0; }
        .ml-dm-title { font-size:15px; font-weight:700; color:#18201F; word-break:break-all; margin-bottom:4px; }
        .ml-dm-warning { background:#fef2f2; border:1px solid #fecaca; border-radius:8px; padding:12px 14px; margin-bottom:12px; }
        .ml-dm-warning-title { color:#dc2626; font-weight:700; font-size:13px; margin:0 0 6px; }
        .ml-dm-usage-list { margin:6px 0 0 18px; padding:0; }
        .ml-dm-usage-list li { font-size:13px; color:#374151; margin-bottom:3px; }
        .ml-dm-safe { font-size:13px; color:#15803d; background:#dcfce7; border-radius:8px; padding:10px 14px; }
        .ml-btn-danger { padding:9px 20px; background:#dc2626; color:#fff; border:none; border-radius:8px; font-size:13px; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; gap:6px; transition:background .2s; }
        .ml-btn-danger:hover { background:#b91c1c; }
        .ml-btn-danger:disabled { opacity:.6; cursor:not-allowed; }
        .ml-btn-cancel { padding:9px 18px; border:1.5px solid #E3E7E5; background:#fff; border-radius:8px; font-size:13px; font-weight:600; color:#66716F; cursor:pointer; }
        .ml-btn-cancel:hover { background:#f8f9f7; }
      </style>

      <div id="ml-toast" class="ml-toast"></div>

      <!-- Preview Modal -->
      <div id="ml-preview-modal" class="ml-modal-bg">
        <div class="ml-modal">
          <div class="ml-modal-header">
            <h3>Image Preview</h3>
            <button class="ml-modal-close" id="ml-pm-close" title="Close">×</button>
          </div>
          <div class="ml-modal-body">
            <div class="ml-pm-img-wrap"><img id="ml-pm-img" src="" alt="Preview"></div>
            <div class="ml-pm-filename" id="ml-pm-name"></div>
            <div class="ml-pm-meta" id="ml-pm-meta"></div>
            <div id="ml-pm-usage"></div>
          </div>
          <div class="ml-modal-footer">
            <button class="ml-btn-cancel" id="ml-pm-close-btn">Close</button>
            <button class="ml-btn-primary" id="ml-pm-copy">Copy URL</button>
          </div>
        </div>
      </div>

      <!-- Delete Modal -->
      <div id="ml-delete-modal" class="ml-modal-bg">
        <div class="ml-modal">
          <div class="ml-modal-header">
            <h3>Delete Media File</h3>
            <button class="ml-modal-close" id="ml-dm-close" title="Close">×</button>
          </div>
          <div class="ml-modal-body">
            <div class="ml-dm-header-row">
              <div class="ml-dm-thumb"><img id="ml-dm-img" src="" alt=""></div>
              <div class="ml-dm-info"><div class="ml-dm-title" id="ml-dm-name"></div></div>
            </div>
            <div id="ml-dm-warning" class="ml-dm-warning" style="display:none;">
              <div class="ml-dm-warning-title">⚠ This file is currently in use</div>
              <div style="font-size:13px;color:#374151;margin-bottom:6px;">Deleting this file will break the content that references it.</div>
            </div>
            <div id="ml-dm-usages"></div>
          </div>
          <div class="ml-modal-footer">
            <button class="ml-btn-cancel" id="ml-dm-cancel">Cancel</button>
            <button class="ml-btn-danger" id="ml-dm-confirm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
              Delete Permanently
            </button>
          </div>
        </div>
      </div>

      <!-- Page -->
      <div class="ml-page">
        <!-- Header -->
        <div class="ml-page-header">
          <div class="ml-page-title">
            <h2>Media Library</h2>
            <p>Manage images and digital assets used across the website.</p>
          </div>
          <button class="ml-btn-primary" id="ml-header-upload-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Upload Media
          </button>
        </div>

        <!-- Stats -->
        <div class="ml-stats">
          <div class="ml-stat-card">
            <div class="ml-stat-icon" style="background:#fdf0f1; color:#9B1023;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            </div>
            <div class="ml-stat-num" id="ml-stat-total">—</div>
            <div class="ml-stat-label">Total Assets</div>
          </div>
          <div class="ml-stat-card">
            <div class="ml-stat-icon" style="background:#f0fdf4; color:#003F3A;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            </div>
            <div class="ml-stat-num" id="ml-stat-size">—</div>
            <div class="ml-stat-label">Total Size</div>
          </div>
          <div class="ml-stat-card">
            <div class="ml-stat-icon" style="background:#dcfce7; color:#15803d;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div class="ml-stat-num" id="ml-stat-used">—</div>
            <div class="ml-stat-label">In Use</div>
          </div>
          <div class="ml-stat-card">
            <div class="ml-stat-icon" style="background:#f1f5f9; color:#64748b;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <div class="ml-stat-num" id="ml-stat-unused">—</div>
            <div class="ml-stat-label">Unused</div>
          </div>
        </div>

        <!-- Upload Zone -->
        <div class="ml-upload-zone" id="ml-upload-section">
          <div class="ml-upload-zone-header">
            <h3>Upload New Images</h3>
          </div>
          <div class="ml-dropzone" id="ml-dropzone">
            <div class="ml-dropzone-icon">🖼️</div>
            <h4>Drag & drop images here</h4>
            <p>JPG, PNG, WebP supported — max 5 MB each</p>
            <input type="file" id="ml-file-input" multiple accept="image/jpeg,image/png,image/webp">
            <button id="ml-upload-btn">Choose Files</button>
            <div id="ml-upload-progress"></div>
          </div>
        </div>

        <!-- Toolbar -->
        <div class="ml-toolbar">
          <div class="ml-search-wrap">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" id="ml-search" placeholder="Search by filename…" autocomplete="off">
          </div>
          <select id="ml-filter-type">
            <option value="all">All Types</option>
            <option value="images">Images</option>
            <option value="other">Other Files</option>
          </select>
          <select id="ml-sort">
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="largest">Largest First</option>
            <option value="smallest">Smallest First</option>
            <option value="az">Name A–Z</option>
            <option value="za">Name Z–A</option>
          </select>
          <button class="ml-btn-reset" id="ml-reset">Reset</button>
          <div class="ml-toolbar-right">
            <span class="ml-count-label" id="ml-count-label">—</span>
            <button class="ml-btn-refresh" id="ml-refresh">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
              Refresh
            </button>
          </div>
        </div>

        <!-- Grid -->
        <div class="ml-grid-wrap">
          <div class="ml-grid-header">
            <h3>All Media Files</h3>
          </div>
          <div class="ml-grid" id="ml-grid">
            <div class="ml-empty"><div class="ml-empty-icon">⏳</div><div>Loading…</div></div>
          </div>
        </div>
      </div>
    `;

    this.container.innerHTML = AdminLayout.getLayout(content, '/admin/media');

    // ── Modal close handlers ───────────────────────────────────────
    document.getElementById('ml-pm-close').onclick = () => { document.getElementById('ml-preview-modal').style.display = 'none'; };
    document.getElementById('ml-pm-close-btn').onclick = () => { document.getElementById('ml-preview-modal').style.display = 'none'; };
    document.getElementById('ml-dm-close').onclick = () => { document.getElementById('ml-delete-modal').style.display = 'none'; };
    document.getElementById('ml-preview-modal').addEventListener('click', e => { if (e.target === e.currentTarget) e.target.style.display = 'none'; });
    document.getElementById('ml-delete-modal').addEventListener('click', e => { if (e.target === e.currentTarget) e.target.style.display = 'none'; });

    // ── Upload zone ────────────────────────────────────────────────
    const dropzone = document.getElementById('ml-dropzone');
    const fileInput = document.getElementById('ml-file-input');
    const uploadBtn = document.getElementById('ml-upload-btn');

    uploadBtn.addEventListener('click', () => fileInput.click());
    document.getElementById('ml-header-upload-btn').addEventListener('click', () => {
      document.getElementById('ml-upload-section').scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => fileInput.click(), 400);
    });

    fileInput.addEventListener('change', () => {
      if (fileInput.files.length) this.uploadFiles(Array.from(fileInput.files));
    });
    dropzone.addEventListener('dragover', e => { e.preventDefault(); dropzone.classList.add('drag-over'); });
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag-over'));
    dropzone.addEventListener('drop', e => {
      e.preventDefault();
      dropzone.classList.remove('drag-over');
      const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
      if (files.length) this.uploadFiles(files);
    });

    // ── Toolbar ────────────────────────────────────────────────────
    document.getElementById('ml-search').addEventListener('input', e => {
      this.searchQuery = e.target.value.toLowerCase();
      this.applyFilters(); // updateCountLabel() is called inside applyFilters() — BUG-06 fix
    });
    document.getElementById('ml-filter-type').addEventListener('change', e => {
      this.filterType = e.target.value;
      this.applyFilters(); // updateCountLabel() is called inside applyFilters() — BUG-06 fix
    });
    document.getElementById('ml-sort').addEventListener('change', e => {
      this.sortMode = e.target.value;
      this.applyFilters();
    });
    document.getElementById('ml-reset').addEventListener('click', () => {
      this.searchQuery = '';
      this.filterType = 'all';
      this.sortMode = 'newest';
      document.getElementById('ml-search').value = '';
      document.getElementById('ml-filter-type').value = 'all';
      document.getElementById('ml-sort').value = 'newest';
      this.applyFilters();
    });
    document.getElementById('ml-refresh').addEventListener('click', () => this.fetchAll());

    this.fetchAll();
  }

  updateCountLabel() {
    const el = document.getElementById('ml-count-label');
    if (el) el.textContent = `${this.filtered.length} of ${this.files.length} files`;
  }
}
