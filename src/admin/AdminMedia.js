import { API_BASE } from '../apiConfig.js';
import { supabaseClient } from '../supabaseFrontendClient.js';
import { AdminLayout } from './AdminLayout.js';

export class AdminMedia {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.files = [];
    this.filtered = [];
    this.searchQuery = '';
    this.API_URL = `${API_BASE}/media`;
  }
  async authHeaders(isFormData = false) {
    const { data: { session } } = await supabaseClient.auth.getSession();
    const headers = { Authorization: `Bearer ${session?.access_token}` };
    if (!isFormData) headers['Content-Type'] = 'application/json';
    return headers;
  }


  // ─── Data ─────────────────────────────────────────────────────────────────

  async fetchFiles() {
    const grid = document.getElementById('aml-grid');
    if (grid) grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px;color:#94a3b8;">Loading media files…</div>`;

    try {
      const res = await fetch(this.API_URL);
      if (!res.ok) throw new Error('Failed');
      this.files = await res.json();
      this.filtered = [...this.files];
      this.renderGrid();
      this.updateStats();
    } catch {
      this.showToast('Failed to load media files.', 'error');
      if (grid) grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px;color:#ef4444;">Failed to load. Check that the server is running.</div>`;
    }
  }

  // ─── Toast ────────────────────────────────────────────────────────────────

  showToast(msg, type = 'success') {
    const t = document.getElementById('aml-toast');
    if (!t) return;
    t.textContent = msg;
    t.className = `aml-toast aml-toast-${type} show`;
    setTimeout(() => t.classList.remove('show'), 3200);
  }

  // ─── Stats ────────────────────────────────────────────────────────────────

  updateStats() {
    const total = this.files.length;
    const totalSize = this.files.reduce((sum, f) => sum + (f.size || 0), 0);
    const sizeLabel = totalSize > 1024 * 1024
      ? (totalSize / (1024 * 1024)).toFixed(1) + ' MB'
      : (totalSize / 1024).toFixed(0) + ' KB';

    const s = id => document.getElementById(id);
    if (s('aml-stat-total')) s('aml-stat-total').textContent = total;
    if (s('aml-stat-size'))  s('aml-stat-size').textContent  = sizeLabel;
    if (s('aml-stat-shown')) s('aml-stat-shown').textContent = this.filtered.length;
  }

  // ─── Search ───────────────────────────────────────────────────────────────

  applySearch(query) {
    this.searchQuery = query.toLowerCase();
    this.filtered = this.files.filter(f =>
      !this.searchQuery || f.name.toLowerCase().includes(this.searchQuery)
    );
    this.renderGrid();
    this.updateStats();
  }

  // ─── Copy URL ─────────────────────────────────────────────────────────────

  async copyUrl(url, btn) {
    try {
      await navigator.clipboard.writeText(url);
      const orig = btn.textContent;
      btn.textContent = '✓ Copied!';
      btn.style.background = '#dcfce7';
      btn.style.color = '#16a34a';
      setTimeout(() => {
        btn.textContent = orig;
        btn.style.background = '';
        btn.style.color = '';
      }, 2000);
    } catch {
      this.showToast('Copy failed — select and copy manually.', 'error');
    }
  }

  // ─── Delete ───────────────────────────────────────────────────────────────

  async deleteFile(filename, card) {
    if (!confirm(`Delete "${filename}"?\n\nThis removes the file permanently from storage. Any page using this image will break.`)) return;

    card.style.opacity = '0.4';
    card.style.pointerEvents = 'none';

    try {
      const res = await fetch(`${this.API_URL}/${encodeURIComponent(filename)}`, { method: 'DELETE', headers: await this.authHeaders() });
      if (!res.ok) throw new Error();
      this.files = this.files.filter(f => f.name !== filename);
      this.filtered = this.filtered.filter(f => f.name !== filename);
      card.remove();
      this.updateStats();
      this.showToast('File deleted.');
    } catch {
      card.style.opacity = '';
      card.style.pointerEvents = '';
      this.showToast('Failed to delete file.', 'error');
    }
  }

  // ─── Upload ───────────────────────────────────────────────────────────────

  async uploadFiles(files) {
    if (!files.length) return;
    const btn = document.getElementById('aml-upload-btn');
    const progress = document.getElementById('aml-upload-progress');
    btn.disabled = true;
    progress.textContent = `Uploading 0 / ${files.length}…`;
    progress.style.display = 'block';

    let done = 0;
    for (const file of files) {
      const fd = new FormData();
      fd.append('file', file);
      try {
        await fetch(this.API_URL, { method: 'POST', body: fd, headers: await this.authHeaders(true) });
        done++;
        progress.textContent = `Uploading ${done} / ${files.length}…`;
      } catch {
        this.showToast(`Failed to upload ${file.name}.`, 'error');
      }
    }

    progress.style.display = 'none';
    btn.disabled = false;
    this.showToast(`${done} file(s) uploaded!`);
    await this.fetchFiles();
  }

  // ─── Grid ─────────────────────────────────────────────────────────────────

  renderGrid() {
    const grid = document.getElementById('aml-grid');
    if (!grid) return;

    if (!this.filtered.length) {
      grid.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:#94a3b8;">
          <div style="font-size:48px;margin-bottom:16px;">📂</div>
          <div style="font-size:16px;font-weight:600;">${this.searchQuery ? 'No files match your search.' : 'No files uploaded yet.'}</div>
          <div style="font-size:13px;margin-top:6px;">${this.searchQuery ? '' : 'Upload your first image above.'}</div>
        </div>`;
      return;
    }

    grid.innerHTML = this.filtered.map(f => {
      const isImage = f.mimetype?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(f.name);
      const shortName = f.name.length > 28 ? '…' + f.name.slice(-24) : f.name;
      const sizeLabel = f.size > 1024 * 1024
        ? (f.size / (1024 * 1024)).toFixed(1) + ' MB'
        : f.size > 1024 ? (f.size / 1024).toFixed(0) + ' KB' : (f.size || '?') + ' B';

      return `
        <div class="aml-card" data-filename="${f.name}">
          <div class="aml-thumb">
            ${isImage
              ? `<img src="${f.url}" alt="${f.name}" loading="lazy" onerror="this.parentElement.innerHTML='<div style=\\'font-size:36px;\\'>📄</div>'">`
              : `<div style="font-size:36px;">📄</div>`
            }
          </div>
          <div class="aml-card-info">
            <div class="aml-fname" title="${f.name}">${shortName}</div>
            <div class="aml-fsize">${sizeLabel}</div>
          </div>
          <div class="aml-card-actions">
            <button class="aml-copy-btn" data-url="${f.url}" title="Copy URL">Copy URL</button>
            <button class="aml-del-btn" data-name="${f.name}" title="Delete">🗑</button>
          </div>
        </div>
      `;
    }).join('');

    // Bind actions
    grid.querySelectorAll('.aml-copy-btn').forEach(btn =>
      btn.addEventListener('click', () => this.copyUrl(btn.dataset.url, btn))
    );
    grid.querySelectorAll('.aml-del-btn').forEach(btn =>
      btn.addEventListener('click', () => {
        const card = btn.closest('.aml-card');
        this.deleteFile(btn.dataset.name, card);
      })
    );
  }

  // ─── Render Shell ─────────────────────────────────────────────────────────

  render() {
    const content = `
      <style>
        .aml-toast{position:fixed;bottom:28px;right:28px;padding:12px 22px;border-radius:10px;font-size:14px;font-weight:600;z-index:9999;opacity:0;transform:translateY(12px);transition:all .3s;pointer-events:none;}
        .aml-toast.show{opacity:1;transform:translateY(0);}
        .aml-toast-success{background:#003F3A;color:#fff;}
        .aml-toast-error{background:#dc2626;color:#fff;}

        /* Upload zone */
        .aml-dropzone{border:2px dashed #cbd5e1;border-radius:14px;padding:36px 24px;text-align:center;cursor:pointer;transition:border-color .2s,background .2s;background:#fafbfc;margin-bottom:24px;}
        .aml-dropzone:hover,.aml-dropzone.drag-over{border-color:#003F3A;background:#f0fdf8;}
        .aml-dropzone-icon{font-size:36px;margin-bottom:12px;}
        .aml-dropzone h4{margin:0 0 6px;font-size:16px;color:#1e293b;font-weight:700;}
        .aml-dropzone p{margin:0 0 16px;font-size:13px;color:#64748b;}
        #aml-file-input{display:none;}
        #aml-upload-btn{padding:10px 24px;background:#003F3A;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;transition:background .2s;}
        #aml-upload-btn:hover{background:#005F58;}
        #aml-upload-btn:disabled{opacity:.6;cursor:not-allowed;}
        #aml-upload-progress{display:none;margin-top:12px;font-size:13px;color:#64748b;font-weight:600;}

        /* Search */
        .aml-search-bar{display:flex;align-items:center;gap:12px;margin-bottom:20px;}
        .aml-search-bar input{flex:1;padding:10px 16px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:14px;font-family:inherit;color:#1e293b;transition:border-color .2s;}
        .aml-search-bar input:focus{outline:none;border-color:#003F3A;}

        /* Grid */
        .aml-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:14px;}
        .aml-card{background:#fff;border:1px solid #f1f5f9;border-radius:12px;overflow:hidden;transition:box-shadow .2s,transform .15s;}
        .aml-card:hover{box-shadow:0 4px 20px rgba(0,0,0,0.1);transform:translateY(-2px);}
        .aml-thumb{height:120px;background:#f8fafc;display:flex;align-items:center;justify-content:center;overflow:hidden;}
        .aml-thumb img{width:100%;height:100%;object-fit:cover;}
        .aml-card-info{padding:8px 10px 4px;}
        .aml-fname{font-size:11px;color:#374151;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .aml-fsize{font-size:10px;color:#94a3b8;margin-top:2px;}
        .aml-card-actions{display:flex;gap:4px;padding:6px 8px 10px;}
        .aml-copy-btn{flex:1;padding:5px 8px;border:none;border-radius:6px;background:#eff6ff;color:#2563eb;font-size:11px;font-weight:700;cursor:pointer;transition:background .2s;}
        .aml-copy-btn:hover{background:#dbeafe;}
        .aml-del-btn{padding:5px 8px;border:none;border-radius:6px;background:#fee2e2;color:#dc2626;font-size:12px;cursor:pointer;transition:background .2s;}
        .aml-del-btn:hover{background:#fecaca;}
      </style>

      <div id="aml-toast" class="aml-toast"></div>

      <!-- Page Header -->
      <div class="admin-header">
        <h2>Media Library</h2>
        <p>All uploaded images stored in Supabase Storage. Copy URLs to use in ministries, campus, sermons, and more.</p>
      </div>

      <!-- Stats -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:16px;margin-bottom:28px;">
        <div style="background:#fff;border-radius:12px;padding:20px 24px;box-shadow:0 1px 4px rgba(0,0,0,0.06);border:1px solid #f1f5f9;">
          <div style="font-size:30px;font-weight:800;color:#1e293b;" id="aml-stat-total">—</div>
          <div style="font-size:12px;color:#64748b;font-weight:600;margin-top:4px;text-transform:uppercase;letter-spacing:.5px;">Total Files</div>
        </div>
        <div style="background:#fff;border-radius:12px;padding:20px 24px;box-shadow:0 1px 4px rgba(0,0,0,0.06);border:1px solid #f1f5f9;">
          <div style="font-size:30px;font-weight:800;color:#003F3A;" id="aml-stat-size">—</div>
          <div style="font-size:12px;color:#64748b;font-weight:600;margin-top:4px;text-transform:uppercase;letter-spacing:.5px;">Total Size</div>
        </div>
        <div style="background:#fff;border-radius:12px;padding:20px 24px;box-shadow:0 1px 4px rgba(0,0,0,0.06);border:1px solid #f1f5f9;">
          <div style="font-size:30px;font-weight:800;color:#64748b;" id="aml-stat-shown">—</div>
          <div style="font-size:12px;color:#64748b;font-weight:600;margin-top:4px;text-transform:uppercase;letter-spacing:.5px;">Showing</div>
        </div>
      </div>

      <!-- Upload Zone -->
      <div class="admin-card" style="margin-bottom:24px;">
        <div class="admin-card-header"><h3>Upload New Images</h3></div>
        <div class="aml-dropzone" id="aml-dropzone">
          <div class="aml-dropzone-icon">🖼️</div>
          <h4>Drag & drop images here</h4>
          <p>or click to browse — JPG, PNG, WebP, SVG supported</p>
          <input type="file" id="aml-file-input" multiple accept="image/*">
          <button id="aml-upload-btn">Choose Files</button>
          <div id="aml-upload-progress"></div>
        </div>
      </div>

      <!-- Media Grid -->
      <div class="admin-card">
        <div class="admin-card-header" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">
          <h3>All Media Files</h3>
          <button onclick="document.getElementById('aml-grid-container').querySelector('[data-action=refresh]').click()" 
            id="aml-refresh-btn" 
            style="padding:8px 16px;border:1.5px solid #e2e8f0;border-radius:8px;background:#fff;font-size:13px;font-weight:600;color:#64748b;cursor:pointer;display:inline-flex;align-items:center;gap:6px;">
            ↻ Refresh
          </button>
        </div>

        <!-- Search -->
        <div class="aml-search-bar" style="padding:0 0 16px;">
          <input type="text" id="aml-search" placeholder="Search by filename…">
        </div>

        <div id="aml-grid-container">
          <span data-action="refresh" style="display:none;"></span>
          <div class="aml-grid" id="aml-grid">
            <div style="grid-column:1/-1;text-align:center;padding:60px;color:#94a3b8;">Loading…</div>
          </div>
        </div>
      </div>
    `;

    this.container.innerHTML = AdminLayout.getLayout(content, '/admin/media');

    // ── Upload zone bindings ──────────────────────────────────────────────────
    const dropzone   = document.getElementById('aml-dropzone');
    const fileInput  = document.getElementById('aml-file-input');
    const uploadBtn  = document.getElementById('aml-upload-btn');
    const refreshBtn = document.getElementById('aml-refresh-btn');

    uploadBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', () => {
      if (fileInput.files.length) this.uploadFiles(Array.from(fileInput.files));
    });

    // Drag and drop
    dropzone.addEventListener('dragover', e => { e.preventDefault(); dropzone.classList.add('drag-over'); });
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag-over'));
    dropzone.addEventListener('drop', e => {
      e.preventDefault();
      dropzone.classList.remove('drag-over');
      const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
      if (files.length) this.uploadFiles(files);
    });

    // Search
    document.getElementById('aml-search').addEventListener('input', e => this.applySearch(e.target.value));

    // Refresh
    refreshBtn.addEventListener('click', () => this.fetchFiles());

    this.fetchFiles();
  }
}
