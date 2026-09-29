import { API_BASE } from '../apiConfig.js';
import { supabaseClient } from '../supabaseFrontendClient.js';
import './admin.css';
import { AdminLayout } from './AdminLayout.js';

export class AdminGallery {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.images = [];
    this.API_URL = `${API_BASE}/gallery`;
  }
  async authHeaders(isFormData = false) {
    const { data: { session } } = await supabaseClient.auth.getSession();
    const headers = { Authorization: `Bearer ${session?.access_token}` };
    if (!isFormData) headers['Content-Type'] = 'application/json';
    return headers;
  }


  async fetchGallery() {
    try {
      const res = await fetch(this.API_URL);
      this.images = await res.json();
      this.renderUI();
    } catch (err) {
      console.error(err);
    }
  }

  async deleteImage(id) {
    if (!confirm('Are you sure you want to delete this image?')) return;
    try {
      await fetch(`${this.API_URL}/${id}`, { method: 'DELETE', headers: await this.authHeaders() });
      await this.fetchGallery();
    } catch (err) {
      console.error(err);
      alert('Failed to delete.');
    }
  }

  async saveImage(e) {
    e.preventDefault();
    const form = e.target;
    
    const imageFile = form.imageFile.files[0];
    if (!imageFile) {
      alert('Please select an image to upload.');
      return;
    }

    form.querySelector('button[type="submit"]').textContent = 'Uploading...';
    
    let imageUrl = '';
    const formData = new FormData();
    formData.append('file', imageFile);
    try {
      const uploadRes = await fetch(`${API_BASE}/upload`, { method: 'POST', body: formData, headers: await this.authHeaders(true) });
      if (uploadRes.ok) {
        const uploadData = await uploadRes.json();
        imageUrl = uploadData.url;
      } else {
        throw new Error('Upload failed');
      }
    } catch (e) {
      console.error('Image upload failed', e);
      alert('Image upload failed.');
      form.querySelector('button[type="submit"]').textContent = 'Upload Image';
      return;
    }

    const data = {
      title: form.title.value || 'Untitled',
      image_url: imageUrl,
      category: form.category.value || 'general'
    };

    try {
      const res = await fetch(this.API_URL, {
        method: 'POST',
        headers: await this.authHeaders(false),
        body: JSON.stringify(data)
      });
      if (res.ok) {
        form.reset();
        form.querySelector('button[type="submit"]').textContent = 'Upload Image';
        await this.fetchGallery();
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save.');
    }
  }

  render() {
    const content = `
      <div class="admin-header">
        <h2>Media Gallery</h2>
        <p>Upload and manage images for your website's gallery.</p>
      </div>
      
      <div class="admin-grid">
        <!-- Form Card -->
        <div class="admin-card">
          <div class="admin-card-header">
            <h3>Upload New Image</h3>
          </div>
          <div class="admin-card-body">
            <form id="admin-gallery-form" class="admin-form">
              <div class="form-group">
                <label>Select Image File</label>
                <input type="file" name="imageFile" accept="image/*" required>
              </div>
              <div class="form-group">
                <label>Image Title (Optional)</label>
                <input type="text" name="title" placeholder="E.g. Sunday Worship Service">
              </div>
              <div class="form-group">
                <label>Category</label>
                <select name="category" class="vm-select">
                  <option value="general">General</option>
                  <option value="worship">Worship</option>
                  <option value="youth">Youth</option>
                  <option value="events">Events</option>
                </select>
              </div>
              <div class="admin-actions">
                <button type="submit" class="admin-btn admin-btn-primary">Upload Image</button>
              </div>
            </form>
          </div>
        </div>

        <!-- List Card -->
        <div class="admin-card" style="grid-column: 1 / -1;">
          <div class="admin-card-header">
            <h3>Uploaded Images</h3>
          </div>
          <div style="padding: 20px;">
            <div id="admin-gallery-list" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 20px;">
              <div class="admin-empty">Loading gallery...</div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.container.innerHTML = AdminLayout.getLayout(content, '/admin/gallery');

    this.container.querySelector('#admin-gallery-form').addEventListener('submit', (e) => this.saveImage(e));
    this.fetchGallery();
  }

  renderUI() {
    const list = this.container.querySelector('#admin-gallery-list');
    if (this.images.length === 0) {
      list.innerHTML = '<div class="admin-empty" style="grid-column: 1 / -1;">No images uploaded yet.</div>';
      return;
    }

    list.innerHTML = this.images.map(img => {
      return `
      <div style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <div style="height: 150px; background: #f3f4f6; position: relative;">
          <img src="${img.image_url}" style="width: 100%; height: 100%; object-fit: cover;" />
          <button class="delete-img-btn" data-id="${img.id}" style="position: absolute; top: 8px; right: 8px; background: #ef4444; color: white; border: none; border-radius: 4px; padding: 4px 8px; cursor: pointer; font-size: 12px;">Delete</button>
        </div>
        <div style="padding: 12px;">
          <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${img.title || 'Untitled'}</div>
          <div style="font-size: 12px; color: #6b7280; text-transform: capitalize;">${img.category}</div>
        </div>
      </div>
    `}).join('');

    list.querySelectorAll('.delete-img-btn').forEach(btn => {
      btn.addEventListener('click', () => this.deleteImage(btn.dataset.id));
    });
  }
}
