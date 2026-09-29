import { API_BASE } from '../apiConfig.js';
import { supabaseClient } from '../supabaseFrontendClient.js';
import './admin.css';
import { AdminLayout } from './AdminLayout.js';
export class AdminEvents {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.events = [];
    this.API_URL = `${API_BASE}/events`;
  }
  async authHeaders(isFormData = false) {
    const { data: { session } } = await supabaseClient.auth.getSession();
    const headers = { Authorization: `Bearer ${session?.access_token}` };
    if (!isFormData) headers['Content-Type'] = 'application/json';
    return headers;
  }


  async fetchEvents() {
    try {
      const res = await fetch(this.API_URL);
      this.events = await res.json();
      this.renderUI();
    } catch (err) {
      console.error(err);
    }
  }

  async deleteEvent(id) {
    if (!confirm('Are you sure you want to delete this event?')) return;
    try {
      await fetch(`${this.API_URL}/${id}`, { method: 'DELETE', headers: await this.authHeaders() });
      await this.fetchEvents();
    } catch (err) {
      console.error(err);
      alert('Failed to delete.');
    }
  }

  async saveEvent(e) {
    e.preventDefault();
    const form = e.target;
    const isEdit = form.dataset.id !== '';
    const id = form.dataset.id;
    
    const dateInput = form.fullDate.value;
    const dateObj = new Date(dateInput);
    const month = dateObj.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const day = dateObj.getDate().toString().padStart(2, '0');

    const imageFile = form.imageFile.files[0];
    let imageUrl = form.dataset.imageUrl || null;

    if (imageFile) {
      form.querySelector('button[type="submit"]').textContent = 'Uploading...';
      const formData = new FormData();
      formData.append('file', imageFile);
      try {
        const uploadRes = await fetch(`${API_BASE}/upload`, { method: 'POST', body: formData, headers: await this.authHeaders(true) });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          imageUrl = uploadData.url;
        }
      } catch (e) {
        console.error('Image upload failed', e);
      }
    }

    const data = {
      title: form.title.value,
      fullDate: dateInput,
      date: day,
      month: month,
      time: form.time.value,
      location: form.location.value,
      category: form.category.value,
      description: form.description.value,
      featured: form.featured.checked,
      image: imageUrl
    };

    try {
      const url = isEdit ? `${this.API_URL}/${id}` : this.API_URL;
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: await this.authHeaders(false),
        body: JSON.stringify(data)
      });
      if (res.ok) {
        form.reset();
        form.dataset.id = '';
        form.dataset.imageUrl = '';
        form.querySelector('button[type="submit"]').textContent = 'Save Event';
        await this.fetchEvents();
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save.');
    }
  }

  editEvent(id) {
    const ev = this.events.find(e => e.id === id);
    if (!ev) return;
    
    const form = this.container.querySelector('#admin-event-form');
    form.dataset.id = ev.id;
    form.title.value = ev.title;
    form.fullDate.value = ev.fullDate;
    form.time.value = ev.time;
    form.location.value = ev.location;
    form.category.value = ev.category;
    form.description.value = ev.description;
    form.featured.checked = ev.featured;
    form.dataset.imageUrl = ev.image || '';
    form.querySelector('button[type="submit"]').textContent = 'Update Event';
    form.scrollIntoView({ behavior: 'smooth' });
  }

  render() {
    const content = `
            <div class="admin-header">
              <h2>Events Management</h2>
              <p>Add, edit, or remove upcoming church events.</p>
            </div>
            
            <div class="admin-grid">
              <!-- Form Card -->
              <div class="admin-card">
                <div class="admin-card-header">
                  <h3 id="form-heading">Create New Event</h3>
                </div>
                <div class="admin-card-body">
                  <form id="admin-event-form" data-id="" class="admin-form">
                    <div class="form-group">
                      <label>Event Title</label>
                      <input type="text" name="title" required placeholder="E.g. Sunday Service">
                    </div>
                    <div class="form-group-row">
                      <div class="form-group">
                        <label>Date</label>
                        <input type="date" name="fullDate" required>
                      </div>
                      <div class="form-group">
                        <label>Time</label>
                        <input type="text" name="time" placeholder="E.g. 10:00 AM" required>
                      </div>
                    </div>
                    <div class="form-group-row">
                      <div class="form-group">
                        <label>Location</label>
                        <input type="text" name="location" required placeholder="E.g. Main Sanctuary">
                      </div>
                      <div class="form-group">
                        <label>Category</label>
                        <input type="text" name="category" placeholder="E.g. Worship, Youth" required>
                      </div>
                    </div>
                    <div class="form-group">
                      <label>Description</label>
                      <textarea name="description" rows="3" required placeholder="Brief description of the event..."></textarea>
                    </div>
                    <div class="form-group">
                      <label>Event Image (Optional)</label>
                      <input type="file" name="imageFile" accept="image/*">
                    </div>
                    <div class="form-group checkbox-group">
                      <input type="checkbox" name="featured" id="featured-ev">
                      <label for="featured-ev">Feature on Homepage</label>
                    </div>
                    <div class="admin-actions">
                      <button type="submit" class="admin-btn admin-btn-primary">Save Event</button>
                      <button type="button" class="admin-btn admin-btn-outline" onclick="
                        document.getElementById('admin-event-form').reset(); 
                        document.getElementById('admin-event-form').dataset.id=''; 
                        document.getElementById('admin-event-form').dataset.imageUrl=''; 
                        document.querySelector('#admin-event-form button[type=\\'submit\\']').textContent='Save Event';
                      ">Cancel</button>
                    </div>
                  </form>
                </div>
              </div>

              <!-- List Card -->
              <div class="admin-card" style="grid-column: 1 / -1;">
                <div class="admin-card-header">
                  <h3>All Events</h3>
                </div>
                <div style="overflow-x: auto;">
                  <table class="admin-table">
                    <thead>
                      <tr>
                        <th>Event Name & Category</th>
                        <th>Date & Time</th>
                        <th>Location</th>
                        <th style="text-align: right;">Actions</th>
                      </tr>
                    </thead>
                    <tbody id="admin-events-list">
                      <tr><td colspan="4"><div class="admin-empty">Loading events...</div></td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
            </div>
    `;

    this.container.innerHTML = AdminLayout.getLayout(content, '/admin/events');

    this.container.querySelector('#admin-event-form').addEventListener('submit', (e) => this.saveEvent(e));
    this.fetchEvents();
  }

  renderUI() {
    const list = this.container.querySelector('#admin-events-list');
    if (this.events.length === 0) {
      list.innerHTML = '<tr><td colspan="4"><div class="admin-empty">No events found.</div></td></tr>';
      return;
    }

    list.innerHTML = this.events.map(ev => {
      const initial = ev.title.charAt(0).toUpperCase();
      return `
      <tr>
        <td>
          <div class="td-primary">
            <div class="admin-avatar" style="background: #e8f0fe; color: #1a73e8;">${initial}</div>
            <div>
              <div style="margin-bottom: 4px;">
                ${ev.title}
                ${ev.featured ? '<span class="admin-badge featured" style="margin-left: 8px;">Featured</span>' : ''}
              </div>
              <span class="admin-badge">${ev.category}</span>
            </div>
          </div>
        </td>
        <td>
          <div style="font-weight: 600; color: #202124; margin-bottom: 4px;">${ev.date} ${ev.month}</div>
          <div class="td-secondary">${ev.time}</div>
        </td>
        <td class="td-secondary">${ev.location}</td>
        <td>
          <div class="item-actions">
            <button class="admin-icon-btn edit" data-id="${ev.id}" title="Edit">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
            </button>
            <button class="admin-icon-btn delete" data-id="${ev.id}" title="Delete">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
            </button>
          </div>
        </td>
      </tr>
    `}).join('');

    list.querySelectorAll('.edit').forEach(btn => {
      btn.addEventListener('click', () => this.editEvent(btn.dataset.id));
    });
    list.querySelectorAll('.delete').forEach(btn => {
      btn.addEventListener('click', () => this.deleteEvent(btn.dataset.id));
    });
  }
}
