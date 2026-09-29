import { API_BASE } from '../apiConfig.js';
import { supabaseClient } from '../supabaseFrontendClient.js';

export class AdminSermons {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;
    this.sermons = [];
    this.API_URL = `${API_BASE}/sermons`;
    
    // Drawer state
    this.isDrawerOpen = false;
    this.editingId = null;
    this.activeTab = 'info'; // 'info', 'media', 'publishing'
    
    // Filter state
    this.searchQuery = '';
    this.categoryFilter = 'All';
    this.statusFilter = 'All';
    
    // Upload state
    this.uploadedThumbnailUrl = '';
    // NOTE: Do NOT call this.init() here — only render when router calls render()
  }

  async init() {
    this.renderBaseLayout();
    this.bindGlobalEvents();
    await this.fetchSermons();
  }

  render() {
    // Reset state
    this.sermons = [];
    this.isDrawerOpen = false;
    this.editingId = null;
    this.activeTab = 'info';
    this.searchQuery = '';
    this.categoryFilter = 'All';
    this.statusFilter = 'All';
    this.uploadedThumbnailUrl = '';
    this.init();
  }

  async fetchSermons() {
    try {
      const res = await fetch(this.API_URL);
      if (res.ok) {
        this.sermons = await res.json();
      } else {
        console.error('Failed to fetch sermons');
      }
    } catch (err) {
      console.error(err);
    }
    this.renderTable();
    this.renderStats();
  }

  extractYouTubeId(url) {
    if (!url) return null;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&]{11})/);
    return match ? match[1] : null;
  }

  showToast(msg) {
    const toast = document.getElementById('admin-toast');
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
  }

  openDrawer(sermon = null) {
    this.isDrawerOpen = true;
    this.editingId = sermon ? sermon.id : null;
    this.activeTab = 'info';
    this.uploadedThumbnailUrl = sermon ? (sermon.thumbnail_url || '') : '';
    
    const drawer = document.getElementById('video-drawer');
    const overlay = document.getElementById('drawer-overlay');
    const title = document.getElementById('drawer-title');
    const form = document.getElementById('video-form');
    
    drawer.classList.add('open');
    overlay.classList.add('open');
    title.textContent = sermon ? 'Edit Video' : 'Add New Video';
    
    this.updateDrawerTabs();
    
    if (sermon) {
      form.title.value = sermon.title || '';
      form.video_url.value = sermon.video_url || '';
      form.speaker.value = sermon.speaker || '';
      form.date.value = sermon.date ? sermon.date.split('T')[0] : '';
      form.category.value = sermon.category || 'Sunday Worship';
      form.description.value = sermon.description || '';
      document.getElementById('yt-id-display').value = this.extractYouTubeId(sermon.video_url) || 'Will be extracted automatically';
      document.getElementById('toggle-featured').checked = !!sermon.featured;
      document.getElementById('toggle-published').checked = sermon.published !== false; // Default true if undefined/old schema
      form.sortOrder.value = sermon.sortOrder || 0;
    } else {
      form.reset();
      document.getElementById('yt-id-display').value = 'Will be extracted automatically';
      form.category.value = 'Sunday Worship';
      document.getElementById('toggle-featured').checked = false;
      document.getElementById('toggle-published').checked = true;
      form.sortOrder.value = 0;
    }
    
    this.renderThumbnailPreview();
  }

  closeDrawer() {
    this.isDrawerOpen = false;
    this.editingId = null;
    document.getElementById('video-drawer').classList.remove('open');
    document.getElementById('drawer-overlay').classList.remove('open');
  }

  switchTab(tab) {
    this.activeTab = tab;
    this.updateDrawerTabs();
  }

  updateDrawerTabs() {
    ['info', 'media', 'publishing'].forEach(t => {
      const btn = document.getElementById(`tab-btn-${t}`);
      const content = document.getElementById(`tab-content-${t}`);
      if (t === this.activeTab) {
        btn.classList.add('active');
        content.classList.add('active');
      } else {
        btn.classList.remove('active');
        content.classList.remove('active');
      }
    });
  }

  async handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    try {
      const uploadRes = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData
      });
      if (uploadRes.ok) {
        const uploadData = await uploadRes.json();
        this.uploadedThumbnailUrl = uploadData.url;
        this.renderThumbnailPreview();
      } else {
        alert('Image upload failed');
      }
    } catch (err) {
      console.error(err);
      alert('Upload error');
    }
  }

  renderThumbnailPreview() {
    const previewContainer = document.getElementById('thumbnail-preview-container');
    const uploadPrompt = document.getElementById('thumbnail-upload-prompt');
    
    if (this.uploadedThumbnailUrl) {
      uploadPrompt.style.display = 'none';
      previewContainer.style.display = 'block';
      previewContainer.innerHTML = `
        <img src="${this.uploadedThumbnailUrl}" style="width: 100%; height: auto; border-radius: 8px; margin-bottom: 8px;">
        <div style="display: flex; gap: 8px;">
          <button type="button" class="btn-secondary btn-small" onclick="document.getElementById('image-upload-input').click()">Replace Image</button>
          <button type="button" class="btn-danger btn-small" id="btn-remove-image">Remove Image</button>
        </div>
      `;
      document.getElementById('btn-remove-image').addEventListener('click', () => {
        this.uploadedThumbnailUrl = '';
        this.renderThumbnailPreview();
        document.getElementById('image-upload-input').value = '';
      });
    } else {
      uploadPrompt.style.display = 'flex';
      previewContainer.style.display = 'none';
      previewContainer.innerHTML = '';
    }
  }

  async saveVideo(e) {
    e.preventDefault();
    const form = e.target;
    const submitBtn = document.getElementById('save-video-btn');
    const ytUrl = form.video_url.value;
    const title = form.title.value;
    
    if (!title || !ytUrl) {
      alert('Title and YouTube URL are required.');
      this.switchTab('info');
      return;
    }
    if (!this.uploadedThumbnailUrl) {
      alert('Featured Image is required.');
      this.switchTab('media');
      return;
    }

    submitBtn.innerHTML = 'Saving...';
    submitBtn.disabled = true;

    const isFeatured = document.getElementById('toggle-featured').checked;
    
    if (isFeatured) {
      // Check if another video is featured
      const existingFeatured = this.sermons.find(s => s.featured && s.id !== this.editingId);
      if (existingFeatured) {
        const confirmFeatured = confirm('Another video is currently featured. Make this video the featured video instead?');
        if (!confirmFeatured) {
          document.getElementById('toggle-featured').checked = false;
          submitBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg> Save Video';
          submitBtn.disabled = false;
          return;
        } else {
          // In a real app we'd batch update, but we'll assume backend handles or we just overwrite it locally for demo
        }
      }
    }

    const data = {
      title: title,
      video_url: ytUrl,
      youtube_video_id: this.extractYouTubeId(ytUrl),
      speaker: form.speaker.value,
      date: form.date.value || new Date().toISOString().split('T')[0],
      category: form.category.value,
      description: form.description.value,
      thumbnail_url: this.uploadedThumbnailUrl,
      featured: isFeatured,
      published: document.getElementById('toggle-published').checked,
      sort_order: parseInt(form.sortOrder.value) || 0
    };

    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      const token = session?.access_token;

      const url = this.editingId ? `${this.API_URL}/${this.editingId}` : this.API_URL;
      const method = this.editingId ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method: method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(this.editingId ? {...data, id: this.editingId} : data)
      });
      
      if (res.ok) {
        this.showToast(this.editingId ? 'Video updated successfully.' : 'Video saved successfully.');
        this.closeDrawer();
        await this.fetchSermons();
      } else {
        alert('Failed to save video.');
      }
    } catch (err) {
      console.error(err);
      alert('Error saving video.');
    } finally {
      submitBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg> Save Video';
      submitBtn.disabled = false;
    }
  }

  async deleteSermon(id) {
    if (!confirm('Are you sure you want to delete this video? This action cannot be undone.')) return;
    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      const token = session?.access_token;
      
      const res = await fetch(`${this.API_URL}/${id}`, { 
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        this.showToast('Video deleted successfully.');
        await this.fetchSermons();
      } else {
        alert('Failed to delete video.');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting video.');
    }
  }

  getFilteredSermons() {
    let filtered = [...this.sermons];
    if (this.categoryFilter !== 'All') {
      filtered = filtered.filter(s => s.category === this.categoryFilter);
    }
    if (this.statusFilter !== 'All') {
      const wantPublished = this.statusFilter === 'Published';
      filtered = filtered.filter(s => (s.published !== false) === wantPublished);
    }
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      filtered = filtered.filter(s => 
        (s.title && s.title.toLowerCase().includes(q)) || 
        (s.speaker && s.speaker.toLowerCase().includes(q)) ||
        (s.category && s.category.toLowerCase().includes(q))
      );
    }
    return filtered;
  }

  renderStats() {
    const total = this.sermons.length;
    const published = this.sermons.filter(s => s.published !== false).length;
    const featured = this.sermons.filter(s => s.featured).length;
    const drafts = total - published;
    
    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-published').textContent = published;
    document.getElementById('stat-featured').textContent = featured;
    document.getElementById('stat-drafts').textContent = drafts;
  }

  renderTable() {
    const list = document.getElementById('video-table-body');
    const filtered = this.getFilteredSermons();
    
    if (!Array.isArray(this.sermons)) {
      list.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 40px; color: red;">Database connection error or table missing.</td></tr>`;
      return;
    }

    if (filtered.length === 0) {
      list.innerHTML = `
        <tr>
          <td colspan="8">
            <div class="empty-state">
              <div class="empty-icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg></div>
              <h3>No sermons or videos yet</h3>
              <p>Add your first sermon or worship video to publish it on the church website.</p>
              <button class="btn-primary" id="empty-add-btn">+ Add Video</button>
            </div>
          </td>
        </tr>
      `;
      setTimeout(() => {
        const btn = document.getElementById('empty-add-btn');
        if (btn) btn.addEventListener('click', () => this.openDrawer());
      }, 0);
      return;
    }

    list.innerHTML = filtered.map(sermon => {
      const dateStr = sermon.date ? new Date(sermon.date).toLocaleDateString('en-GB', {day: 'numeric', month: 'short', year: 'numeric'}) : '-';
      const isPublished = sermon.published !== false;
      const statusBadge = isPublished ? `<span class="badge badge-success">Published</span>` : `<span class="badge badge-draft">Draft</span>`;
      const featuredBadge = sermon.featured 
        ? `<span class="badge badge-gold">★ Yes</span>` 
        : `<span class="badge badge-grey">☆ No</span>`;
      
      const catColorMap = {
        'Sunday Worship': 'rgba(239, 68, 68, 0.1)',
        'Sermon': 'rgba(16, 185, 129, 0.1)',
        'Bible Study': 'rgba(59, 130, 246, 0.1)',
        'Youth': 'rgba(139, 92, 246, 0.1)',
        'Special Service': 'rgba(245, 158, 11, 0.1)',
        'Worship': 'rgba(236, 72, 153, 0.1)'
      };
      const catTextColorMap = {
        'Sunday Worship': '#b91c1c',
        'Sermon': '#047857',
        'Bible Study': '#1d4ed8',
        'Youth': '#6d28d9',
        'Special Service': '#b45309',
        'Worship': '#be185d'
      };
      const bg = catColorMap[sermon.category] || '#f3f4f6';
      const color = catTextColorMap[sermon.category] || '#4b5563';

      return `
        <tr>
          <td><input type="checkbox" class="row-checkbox"></td>
          <td>
            <div class="td-thumbnail">
              ${sermon.thumbnail_url ? `<img src="${sermon.thumbnail_url}">` : `<div class="no-img">No Img</div>`}
              <div class="td-duration">${sermon.duration || '00:00'}</div>
            </div>
          </td>
          <td>
            <div class="td-title">${sermon.title}</div>
            <div class="td-speaker">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              ${sermon.speaker || 'Unknown'}
            </div>
            <div class="td-desc">${sermon.description ? sermon.description.substring(0, 50) + '...' : ''}</div>
          </td>
          <td>
            <span class="badge" style="background: ${bg}; color: ${color};">${sermon.category}</span>
          </td>
          <td>
            <div class="td-date">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              ${dateStr}
            </div>
          </td>
          <td>${statusBadge}</td>
          <td>${featuredBadge}</td>
          <td>
            <div class="action-btns">
              <button class="btn-icon btn-edit" data-id="${sermon.id}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
              </button>
              <button class="btn-icon btn-delete" data-id="${sermon.id}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Bind edit/delete
    list.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        const sermon = this.sermons.find(s => s.id === id);
        if (sermon) this.openDrawer(sermon);
      });
    });
    list.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', (e) => this.deleteSermon(e.currentTarget.dataset.id));
    });
  }

  bindGlobalEvents() {
    document.getElementById('btn-add-video').addEventListener('click', () => this.openDrawer());
    document.getElementById('btn-close-drawer').addEventListener('click', () => this.closeDrawer());
    document.getElementById('drawer-overlay').addEventListener('click', () => this.closeDrawer());
    document.getElementById('btn-cancel-drawer').addEventListener('click', () => this.closeDrawer());
    
    document.getElementById('tab-btn-info').addEventListener('click', () => this.switchTab('info'));
    document.getElementById('tab-btn-media').addEventListener('click', () => this.switchTab('media'));
    document.getElementById('tab-btn-publishing').addEventListener('click', () => this.switchTab('publishing'));
    
    document.getElementById('video-drawer').addEventListener('submit', (e) => this.saveVideo(e));
    
    const ytInput = document.getElementById('yt-url-input');
    const ytIdDisplay = document.getElementById('yt-id-display');
    ytInput.addEventListener('input', (e) => {
      const id = this.extractYouTubeId(e.target.value);
      ytIdDisplay.value = id || 'Will be extracted automatically';
    });
    document.getElementById('btn-preview-yt').addEventListener('click', () => {
      if (ytInput.value) window.open(ytInput.value, '_blank');
    });

    document.getElementById('image-upload-input').addEventListener('change', (e) => this.handleImageUpload(e));
    
    // Filters
    const searchInput = document.getElementById('filter-search');
    const catSelect = document.getElementById('filter-category');
    const statSelect = document.getElementById('filter-status');
    const resetBtn = document.getElementById('filter-reset');

    searchInput.addEventListener('input', (e) => { this.searchQuery = e.target.value; this.renderTable(); });
    catSelect.addEventListener('change', (e) => { this.categoryFilter = e.target.value; this.renderTable(); });
    statSelect.addEventListener('change', (e) => { this.statusFilter = e.target.value; this.renderTable(); });
    resetBtn.addEventListener('click', () => {
      searchInput.value = '';
      catSelect.value = 'All Categories';
      statSelect.value = 'All Status';
      this.searchQuery = '';
      this.categoryFilter = 'All';
      this.statusFilter = 'All';
      this.renderTable();
    });
  }

  renderBaseLayout() {
    this.container.innerHTML = `
      <style>
        :root {
          --sidebar-bg: #003F3A;
          --sidebar-active: #D99A20;
          --burgundy: #9B1023;
          --bg-color: #F8F9F7;
          --text-main: #18201F;
          --text-sec: #66716F;
          --border: #E3E7E5;
          --success: #16805B;
        }
        * { box-sizing: border-box; }
        body { margin: 0; font-family: 'Inter', sans-serif; background: var(--bg-color); color: var(--text-main); }
        
        .cms-layout { display: flex; height: 100vh; overflow: hidden; }
        
        /* Sidebar */
        .cms-sidebar {
          width: 240px;
          background: var(--sidebar-bg);
          color: white;
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
        }
        .cms-sidebar-header {
          padding: 24px 20px;
          display: flex;
          align-items: center;
          gap: 12px;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .cms-sidebar-header img { width: 40px; height: 40px; border-radius: 50%; }
        .cms-sidebar-header h1 { font-size: 15px; margin: 0 0 2px 0; font-weight: 600; line-height: 1.2; }
        .cms-sidebar-header span { font-size: 11px; opacity: 0.7; }
        
        .cms-nav { padding: 20px 12px; flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; }
        .cms-nav a {
          display: flex; align-items: center; gap: 12px; padding: 10px 16px; 
          color: rgba(255,255,255,0.7); text-decoration: none; font-size: 14px; font-weight: 500;
          border-radius: 8px; transition: all 0.2s;
        }
        .cms-nav a:hover { color: white; background: rgba(255,255,255,0.1); }
        .cms-nav a.active { background: var(--sidebar-active); color: white; }
        
        .cms-sidebar-footer {
          padding: 20px; border-top: 1px solid rgba(255,255,255,0.1);
          display: flex; align-items: center; gap: 12px;
        }
        .user-avatar { width: 32px; height: 32px; border-radius: 50%; background: #D99A20; color: white; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 14px; }
        .user-meta h4 { margin: 0; font-size: 13px; font-weight: 600; }
        .user-meta span { font-size: 11px; opacity: 0.7; }
        
        /* Main Content */
        .cms-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
        
        /* Header */
        .cms-header {
          height: 64px; background: white; border-bottom: 1px solid var(--border);
          display: flex; align-items: center; justify-content: space-between; padding: 0 32px;
        }
        .search-bar { display: flex; align-items: center; background: #f1f3f2; padding: 8px 16px; border-radius: 20px; width: 300px; gap: 8px; }
        .search-bar input { border: none; background: transparent; outline: none; font-size: 13px; width: 100%; font-family: inherit; }
        .header-actions { display: flex; align-items: center; gap: 20px; }
        .notify-icon { position: relative; color: var(--text-sec); cursor: pointer; }
        .notify-badge { position: absolute; top: -2px; right: -2px; width: 8px; height: 8px; background: #ef4444; border-radius: 50%; border: 2px solid white; }
        .header-profile { display: flex; align-items: center; gap: 12px; }
        
        /* Page Content */
        .cms-content { flex: 1; overflow-y: auto; padding: 32px; }
        .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; }
        .page-title-row { display: flex; align-items: center; gap: 16px; }
        .page-icon { width: 40px; height: 40px; background: #faeacc; color: var(--burgundy); border-radius: 8px; display: flex; align-items: center; justify-content: center; }
        .page-title h2 { font-family: 'Playfair Display', serif; font-size: 28px; margin: 0 0 4px 0; color: var(--text-main); }
        .page-title p { margin: 0; color: var(--text-sec); font-size: 14px; }
        
        .btn-primary { background: var(--burgundy); color: white; border: none; padding: 10px 20px; border-radius: 6px; font-weight: 600; font-size: 14px; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; transition: 0.2s; }
        .btn-primary:hover { background: #7A0C1C; }
        .btn-secondary { background: white; color: var(--text-main); border: 1px solid var(--border); padding: 8px 16px; border-radius: 6px; font-weight: 600; font-size: 13px; cursor: pointer; transition: 0.2s; }
        .btn-secondary:hover { background: #f9f9f9; }
        .btn-danger { background: #fee2e2; color: #b91c1c; border: 1px solid #fecaca; padding: 8px 16px; border-radius: 6px; font-weight: 600; font-size: 13px; cursor: pointer; transition: 0.2s; }
        .btn-danger:hover { background: #fecaca; }

        /* Stats */
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; margin-bottom: 32px; }
        .stat-card { background: white; border: 1px solid var(--border); border-radius: 12px; padding: 24px; display: flex; align-items: center; gap: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
        .stat-icon { width: 48px; height: 48px; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
        .stat-num { font-size: 28px; font-weight: 700; color: var(--text-main); line-height: 1; margin-bottom: 4px; }
        .stat-label { font-size: 13px; color: var(--text-sec); font-weight: 500; }

        /* Filters */
        .filter-bar { display: flex; gap: 16px; margin-bottom: 24px; }
        .filter-input { flex: 1; max-width: 300px; padding: 10px 16px; border: 1px solid var(--border); border-radius: 6px; font-size: 13px; outline: none; }
        .filter-select { padding: 10px 16px; border: 1px solid var(--border); border-radius: 6px; font-size: 13px; background: white; outline: none; cursor: pointer; }
        
        /* Table */
        .table-card { background: white; border: 1px solid var(--border); border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.02); overflow: hidden; }
        table { width: 100%; border-collapse: collapse; text-align: left; }
        th { padding: 16px 20px; font-size: 12px; font-weight: 600; color: var(--text-sec); border-bottom: 1px solid var(--border); text-transform: uppercase; letter-spacing: 0.5px; }
        td { padding: 16px 20px; border-bottom: 1px solid var(--border); vertical-align: top; }
        tr:last-child td { border-bottom: none; }
        
        .td-thumbnail { position: relative; width: 115px; height: 65px; border-radius: 6px; overflow: hidden; background: #f3f4f6; }
        .td-thumbnail img { width: 100%; height: 100%; object-fit: cover; }
        .td-duration { position: absolute; bottom: 4px; right: 4px; background: rgba(0,0,0,0.8); color: white; padding: 2px 4px; border-radius: 4px; font-size: 10px; font-weight: 600; }
        .no-img { display: flex; align-items: center; justify-content: center; height: 100%; font-size: 11px; color: #9ca3af; }

        .td-title { font-weight: 600; font-size: 14px; color: var(--text-main); margin-bottom: 4px; }
        .td-speaker { font-size: 12px; color: var(--text-sec); margin-bottom: 6px; display: flex; align-items: center; gap: 4px; }
        .td-desc { font-size: 12px; color: #888; line-height: 1.4; }
        .td-date { font-size: 13px; color: var(--text-sec); display: flex; align-items: center; gap: 6px; white-space: nowrap; }

        .badge { display: inline-flex; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; white-space: nowrap; align-items: center; gap: 4px; }
        .badge-success { background: #e6f6ee; color: var(--success); }
        .badge-draft { background: #f1f3f2; color: #666; }
        .badge-gold { background: #fdf5e6; color: #b47a18; }
        .badge-grey { background: #f3f4f6; color: #9ca3af; font-weight: 500; }

        .action-btns { display: flex; gap: 8px; }
        .btn-icon { width: 32px; height: 32px; border-radius: 6px; border: 1px solid var(--border); background: white; color: var(--text-sec); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; }
        .btn-edit:hover { background: #f1f3f2; color: var(--text-main); }
        .btn-delete:hover { background: #fee2e2; border-color: #fca5a5; color: #dc2626; }

        .empty-state { text-align: center; padding: 60px 20px; }
        .empty-icon { width: 64px; height: 64px; background: #faeacc; color: var(--burgundy); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; }
        .empty-state h3 { font-size: 18px; margin: 0 0 8px 0; }
        .empty-state p { color: var(--text-sec); font-size: 14px; margin: 0 0 24px 0; }

        /* Drawer */
        .drawer-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 999; opacity: 0; pointer-events: none; transition: 0.3s; }
        .drawer-overlay.open { opacity: 1; pointer-events: auto; }
        .drawer { position: fixed; top: 0; right: 0; height: 100vh; width: 430px; background: white; z-index: 1000; box-shadow: -4px 0 24px rgba(0,0,0,0.1); transform: translateX(100%); transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); display: flex; flex-direction: column; }
        .drawer.open { transform: translateX(0); }
        
        .drawer-header { padding: 24px 32px 0; border-bottom: 1px solid var(--border); }
        .drawer-title-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
        .drawer-title-row h3 { font-family: 'Playfair Display', serif; font-size: 24px; margin: 0; }
        .btn-close { background: none; border: none; color: var(--text-sec); cursor: pointer; padding: 4px; }
        .btn-close:hover { color: black; }
        
        .drawer-tabs { display: flex; gap: 24px; }
        .tab-btn { background: none; border: none; border-bottom: 2px solid transparent; padding: 0 0 12px 0; font-size: 13px; font-weight: 600; color: var(--text-sec); cursor: pointer; transition: 0.2s; }
        .tab-btn.active { color: var(--sidebar-bg); border-bottom-color: var(--sidebar-bg); }
        
        .drawer-body { flex: 1; overflow-y: auto; padding: 32px; }
        .tab-content { display: none; }
        .tab-content.active { display: block; }
        
        .form-group { margin-bottom: 24px; }
        .form-label { display: block; font-size: 13px; font-weight: 600; color: var(--text-main); margin-bottom: 8px; }
        .form-label span { color: #dc2626; }
        .form-input, .form-select, .form-textarea { width: 100%; padding: 10px 14px; border: 1px solid var(--border); border-radius: 6px; font-size: 14px; font-family: inherit; outline: none; transition: 0.2s; }
        .form-input:focus, .form-select:focus, .form-textarea:focus { border-color: var(--sidebar-bg); box-shadow: 0 0 0 3px rgba(0,63,58,0.1); }
        .form-textarea { resize: vertical; min-height: 100px; }
        .form-help { font-size: 11px; color: var(--text-sec); margin-top: 6px; display: block; }
        
        .input-group { display: flex; gap: 8px; }
        .input-group .form-input { flex: 1; background: #f9f9f9; color: #888; }
        
        .upload-box { border: 2px dashed var(--border); border-radius: 8px; padding: 32px 20px; text-align: center; cursor: pointer; transition: 0.2s; background: #fafafa; }
        .upload-box:hover { border-color: var(--sidebar-bg); background: #f0f4f4; }
        .upload-icon { color: var(--text-sec); margin-bottom: 12px; }
        
        .toggle-group { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 24px; }
        .toggle-switch { position: relative; display: inline-block; width: 40px; height: 24px; flex-shrink: 0; }
        .toggle-switch input { opacity: 0; width: 0; height: 0; }
        .slider { position: absolute; cursor: pointer; inset: 0; background-color: #ccc; transition: .2s; border-radius: 24px; }
        .slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .2s; border-radius: 50%; }
        input:checked + .slider { background-color: var(--sidebar-bg); }
        input:checked + .slider:before { transform: translateX(16px); }
        .toggle-text { font-size: 13px; }
        .toggle-text strong { display: block; margin-bottom: 2px; }
        .toggle-text span { color: var(--text-sec); font-size: 12px; }

        .drawer-footer { padding: 24px 32px; border-top: 1px solid var(--border); display: flex; justify-content: space-between; background: white; }
        
        .toast { position: fixed; bottom: 24px; right: 24px; background: #1f2937; color: white; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 500; transform: translateY(100px); opacity: 0; transition: 0.3s; z-index: 2000; box-shadow: 0 10px 25px rgba(0,0,0,0.2); }
        .toast.show { transform: translateY(0); opacity: 1; }

        @media (max-width: 768px) {
          .cms-sidebar { width: 60px; }
          .cms-sidebar-header h1, .cms-sidebar-header span, .cms-nav a text, .user-meta, .cms-sidebar-footer { display: none; }
          .cms-nav a { justify-content: center; padding: 12px; }
          .page-title h2 { font-size: 24px; }
          .stats-grid { grid-template-columns: 1fr 1fr; }
          .drawer { width: 100%; }
        }
      </style>

      <div class="cms-layout">
        <!-- Sidebar -->
        <aside class="cms-sidebar">
          <div class="cms-sidebar-header">
            <img src="/images/cbc-logo.jpg" alt="Logo" onerror="this.src='https://via.placeholder.com/40'">
            <div>
              <h1>Centenary Admin</h1>
              <span>Content Management System</span>
            </div>
          </div>
          <nav class="cms-nav">
            <a href="#/admin"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg> Dashboard</a>
            <a href="#/admin/events"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg> Events</a>
            <a href="#/admin/sermons" class="active"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg> Sermons & Videos</a>
            <a href="#/admin/ministries"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg> Ministries</a>
            <a href="#/admin/campus"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg> Campus</a>
            <a href="#/admin/donations"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg> Donations</a>
            <a href="#/admin/contacts"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg> Form Submissions</a>
            <a href="#/admin/media"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg> Media Library</a>
            <a href="#/admin/settings"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg> Site Settings</a>
            <a href="#/admin/users"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg> Admin Users</a>
            <a href="#/admin/logs"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg> Audit Logs</a>
          </nav>
          <div class="cms-sidebar-footer">
            <div class="user-avatar">A</div>
            <div class="user-meta">
              <h4>Admin User</h4>
              <span>Administrator</span>
            </div>
            <svg style="margin-left:auto; color:rgba(255,255,255,0.5); cursor:pointer;" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          </div>
        </aside>

        <!-- Main Content -->
        <main class="cms-main">
          <header class="cms-header">
            <div class="search-bar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input type="text" placeholder="Search sermons, videos...">
            </div>
            <div class="header-actions">
              <div class="notify-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                <div class="notify-badge"></div>
              </div>
              <div class="header-profile">
                <div class="user-avatar" style="width:36px; height:36px;">A</div>
                <div class="user-meta" style="color:var(--text-main);">
                  <h4>Admin User</h4>
                  <span>Administrator</span>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </div>
            </div>
          </header>

          <div class="cms-content">
            <div class="page-header">
              <div class="page-title-row">
                <div class="page-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                </div>
                <div class="page-title">
                  <h2>Sermons & Videos</h2>
                  <p>Manage sermons, messages, worship videos, and other YouTube content.</p>
                </div>
              </div>
              <button class="btn-primary" id="btn-add-video">+ Add Video</button>
            </div>

            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-icon" style="background: #fdf2f2; color: #ef4444;"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg></div>
                <div><div class="stat-num" id="stat-total">0</div><div class="stat-label">Total Videos</div></div>
              </div>
              <div class="stat-card">
                <div class="stat-icon" style="background: #e6f6ee; color: #16805B;"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg></div>
                <div><div class="stat-num" id="stat-published">0</div><div class="stat-label">Published</div></div>
              </div>
              <div class="stat-card">
                <div class="stat-icon" style="background: #fdf5e6; color: #b47a18;"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg></div>
                <div><div class="stat-num" id="stat-featured">0</div><div class="stat-label">Featured</div></div>
              </div>
              <div class="stat-card">
                <div class="stat-icon" style="background: #eff6ff; color: #3b82f6;"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg></div>
                <div><div class="stat-num" id="stat-drafts">0</div><div class="stat-label">Drafts</div></div>
              </div>
            </div>

            <div class="filter-bar">
              <div style="position:relative; flex:1; max-width:300px;">
                <svg style="position:absolute; left:10px; top:11px; color:#9ca3af;" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                <input type="text" class="filter-input" id="filter-search" placeholder="Search by title, speaker, or category..." style="padding-left: 32px; width:100%;">
              </div>
              <select class="filter-select" id="filter-category">
                <option value="All Categories">All Categories</option>
                <option value="Sunday Worship">Sunday Worship</option>
                <option value="Sermon">Sermon</option>
                <option value="Bible Study">Bible Study</option>
                <option value="Youth">Youth</option>
                <option value="Special Service">Special Service</option>
                <option value="Worship">Worship</option>
              </select>
              <select class="filter-select" id="filter-status">
                <option value="All Status">All Status</option>
                <option value="Published">Published</option>
                <option value="Draft">Draft</option>
              </select>
              <select class="filter-select">
                <option>All Time</option>
              </select>
              <button class="btn-secondary" id="filter-reset">Reset</button>
            </div>

            <div class="table-card">
              <table>
                <thead>
                  <tr>
                    <th style="width:40px;"><input type="checkbox"></th>
                    <th style="width:130px;">Thumbnail</th>
                    <th>Title & Details</th>
                    <th>Category</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Featured</th>
                    <th style="text-align:right;">Actions</th>
                  </tr>
                </thead>
                <tbody id="video-table-body">
                  <!-- JS rows -->
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      <!-- Drawer Overlay -->
      <div class="drawer-overlay" id="drawer-overlay"></div>

      <!-- Right Drawer -->
      <form class="drawer" id="video-drawer">
        <div class="drawer-header">
          <div class="drawer-title-row">
            <h3 id="drawer-title">Add New Video</h3>
            <button type="button" class="btn-close" id="btn-close-drawer">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
          <div class="drawer-tabs">
            <button type="button" class="tab-btn active" id="tab-btn-info">Video Information</button>
            <button type="button" class="tab-btn" id="tab-btn-media">Media</button>
            <button type="button" class="tab-btn" id="tab-btn-publishing">Publishing</button>
          </div>
        </div>
        
        <div class="drawer-body" id="video-form">
          <!-- Tab Info -->
          <div class="tab-content active" id="tab-content-info">
            <div class="form-group">
              <label class="form-label">Video Title <span>*</span></label>
              <input type="text" name="title" class="form-input" placeholder="Enter video title (e.g., Sunday Worship Service)" required>
            </div>
            
            <div class="form-group">
              <label class="form-label">YouTube URL <span>*</span></label>
              <input type="url" name="video_url" id="yt-url-input" class="form-input" placeholder="https://www.youtube.com/watch?v=..." required>
              <span class="form-help">Paste YouTube URL (youtube.com or youtu.be)</span>
            </div>

            <div class="form-group">
              <label class="form-label">YouTube Video ID</label>
              <div class="input-group">
                <input type="text" id="yt-id-display" class="form-input" value="Will be extracted automatically" readonly>
                <button type="button" class="btn-secondary" id="btn-preview-yt" style="display:flex; align-items:center; gap:6px;">
                  Preview <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                </button>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Speaker / Pastor</label>
              <input type="text" name="speaker" class="form-input" placeholder="e.g., Rev. John Matthew">
            </div>

            <div class="form-group">
              <label class="form-label">Date</label>
              <input type="date" name="date" class="form-input">
            </div>

            <div class="form-group">
              <label class="form-label">Category</label>
              <select name="category" class="form-select">
                <option value="Sunday Worship">Sunday Worship</option>
                <option value="Sermon">Sermon</option>
                <option value="Bible Study">Bible Study</option>
                <option value="Youth">Youth</option>
                <option value="Special Service">Special Service</option>
                <option value="Testimony">Testimony</option>
                <option value="Worship">Worship</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Description</label>
              <textarea name="description" class="form-textarea" placeholder="Enter a brief description of this video..."></textarea>
            </div>
          </div>

          <!-- Tab Media -->
          <div class="tab-content" id="tab-content-media">
            <div class="form-group">
              <label class="form-label">Featured Image (Thumbnail) <span>*</span></label>
              
              <div id="thumbnail-preview-container" style="display:none; margin-bottom: 16px;"></div>
              
              <div class="upload-box" id="thumbnail-upload-prompt" onclick="document.getElementById('image-upload-input').click()">
                <div class="upload-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                </div>
                <div style="font-size: 14px; font-weight: 600; color: var(--text-main); margin-bottom: 4px;">Click to upload or drag and drop</div>
                <div style="font-size: 12px; color: var(--text-sec); margin-bottom: 4px;">PNG, JPG, WEBP (Max 5MB)</div>
                <div style="font-size: 11px; color: #888;">Recommended: 1280 × 720 (16:9)</div>
              </div>
              <input type="file" id="image-upload-input" accept="image/*" style="display: none;">
            </div>
          </div>

          <!-- Tab Publishing -->
          <div class="tab-content" id="tab-content-publishing">
            <div class="toggle-group">
              <label class="toggle-switch">
                <input type="checkbox" id="toggle-featured">
                <span class="slider"></span>
              </label>
              <div class="toggle-text">
                <strong>Featured Video</strong>
                <span>Show this video as featured on the website</span>
              </div>
            </div>

            <div class="toggle-group">
              <label class="toggle-switch">
                <input type="checkbox" id="toggle-published" checked>
                <span class="slider"></span>
              </label>
              <div class="toggle-text">
                <strong>Published</strong>
                <span>Make this video visible on the website</span>
              </div>
            </div>

            <div class="form-group" style="margin-top: 32px;">
              <label class="form-label">Sort Order</label>
              <input type="number" name="sortOrder" class="form-input" value="0">
              <span class="form-help">Lower numbers appear first</span>
            </div>
          </div>
        </div>
        
        <div class="drawer-footer">
          <button type="button" class="btn-secondary" id="btn-cancel-drawer">Cancel</button>
          <button type="submit" class="btn-primary" style="background: var(--sidebar-bg);" id="save-video-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
            Save Video
          </button>
        </div>
      </form>

      <!-- Toast -->
      <div class="toast" id="admin-toast">Video saved successfully.</div>
    `;
  }
}
