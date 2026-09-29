import { AdminLayout } from './AdminLayout.js';

export class AdminDashboard {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
  }
  async authHeaders(isFormData = false) {
    const { data: { session } } = await supabaseClient.auth.getSession();
    const headers = { Authorization: `Bearer ${session?.access_token}` };
    if (!isFormData) headers['Content-Type'] = 'application/json';
    return headers;
  }


  async render() {
    const d = new Date();
    const dateStr = d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    
    const content = `
      <div class="admin-hero">
        <div class="admin-hero-content">
          <h2>Dashboard</h2>
          <h1>Welcome to CBC Admin</h1>
          <p>Manage content, engage with your community, and keep the church informed.</p>
        </div>
        <div class="admin-hero-quote">
          <p>"Faithful Then.<br>Faithful Now.<br>Faithful Beyond."</p>
          <span>Centenary Baptist Church<br>Est. 1875</span>
        </div>
      </div>

      <div style="display: flex; justify-content: flex-end; margin-top: -16px; margin-bottom: 16px;">
        <div style="font-size: 0.85rem; color: #1e293b; text-align: right;">
          <strong>${dateStr}</strong><br>
          <span style="color: #64748b;">Welcome back!</span>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon icon-green">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM9 14H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2zm-8 4H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2z"/></svg>
          </div>
          <div class="stat-info">
            <span class="stat-value">28</span>
            <span class="stat-label">Total Events</span>
            <span class="stat-trend trend-up">↑ 5 this month</span>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon icon-blue">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>
          </div>
          <div class="stat-info">
            <span class="stat-value">42</span>
            <span class="stat-label">Total Sermons</span>
            <span class="stat-trend trend-up">↑ 3 this month</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon icon-gold">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
          </div>
          <div class="stat-info">
            <span class="stat-value">7</span>
            <span class="stat-label">Ministries</span>
            <span class="stat-trend" style="color: #14b8a6;">Active</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon icon-red">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3z"/></svg>
          </div>
          <div class="stat-info">
            <span class="stat-value">4</span>
            <span class="stat-label">Campus Locations</span>
            <span class="stat-trend" style="color: #14b8a6;">Active</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon icon-purple">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
          </div>
          <div class="stat-info">
            <span class="stat-value">12</span>
            <span class="stat-label">New Submissions</span>
            <span class="stat-trend trend-up">↑ 12 new</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon icon-teal">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
          </div>
          <div class="stat-info">
            <span class="stat-value">156</span>
            <span class="stat-label">Media Files</span>
            <span class="stat-trend trend-up">↑ 8 this month</span>
          </div>
        </div>
      </div>

      <div class="dashboard-grid">
        <div class="dash-col-left">
          
          <div class="dash-section">
            <div class="dash-section-header">
              <h3>Recent Form Submissions</h3>
              <a href="#/admin/contacts">View All &rarr;</a>
            </div>
            <table class="dash-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Message</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Ravi Kumar</td>
                  <td><span class="status-badge status-new">Visitor</span></td>
                  <td>Interested in youth ministry</td>
                  <td>24 Sep 2026</td>
                  <td><span class="status-badge status-contacted">New</span></td>
                </tr>
                <tr>
                  <td>Anita Sharma</td>
                  <td><span class="status-badge status-read">Contact</span></td>
                  <td>Prayer request for family</td>
                  <td>23 Sep 2026</td>
                  <td><span class="status-badge status-read">Read</span></td>
                </tr>
                <tr>
                  <td>Sarah Thomas</td>
                  <td><span class="status-badge status-new">Visitor</span></td>
                  <td>New to the church</td>
                  <td>22 Sep 2026</td>
                  <td><span class="status-badge status-contacted">New</span></td>
                </tr>
                <tr>
                  <td>Rajesh Singh</td>
                  <td><span class="status-badge status-read">Contact</span></td>
                  <td>Enquiry about baptism</td>
                  <td>22 Sep 2026</td>
                  <td><span class="status-badge status-new">Contacted</span></td>
                </tr>
                <tr>
                  <td>Mary Johnson</td>
                  <td><span class="status-badge status-new">Visitor</span></td>
                  <td>Want to volunteer</td>
                  <td>21 Sep 2026</td>
                  <td><span class="status-badge status-read">Read</span></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="dash-section">
            <div class="dash-section-header">
              <h3>Recent Sermons</h3>
              <a href="#/admin/sermons">View All &rarr;</a>
            </div>
            
            <div class="list-item">
              <img src="https://images.unsplash.com/photo-1504052434569-70ad5836ab65?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80" class="list-item-img">
              <div class="list-item-content">
                <div class="list-item-title">Walking in Faith</div>
                <div class="list-item-sub">Rev. Dr. M. Purushotham</div>
              </div>
              <div class="list-item-sub" style="margin-right: 24px;">17 Sep 2026</div>
              <button class="list-item-action"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M8 5v14l11-7z"/></svg> Watch</button>
            </div>
            
            <div class="list-item">
              <img src="https://images.unsplash.com/photo-1447023029226-ef8f6b52e3ea?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80" class="list-item-img">
              <div class="list-item-content">
                <div class="list-item-title">The Power of Prayer</div>
                <div class="list-item-sub">Rev. B. Charles Theodore</div>
              </div>
              <div class="list-item-sub" style="margin-right: 24px;">10 Sep 2026</div>
              <button class="list-item-action"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M8 5v14l11-7z"/></svg> Watch</button>
            </div>
            
            <div class="list-item">
              <img src="https://images.unsplash.com/photo-1490730141103-6cac27aaab94?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80" class="list-item-img">
              <div class="list-item-content">
                <div class="list-item-title">God's Faithfulness</div>
                <div class="list-item-sub">Rev. Dr. V. Satyanarjan</div>
              </div>
              <div class="list-item-sub" style="margin-right: 24px;">3 Sep 2026</div>
              <button class="list-item-action"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M8 5v14l11-7z"/></svg> Watch</button>
            </div>
          </div>
          
        </div>

        <div class="dash-col-right">
          
          <div class="dash-section">
            <div class="dash-section-header">
              <h3>Upcoming Events</h3>
              <a href="#/admin/events">View All &rarr;</a>
            </div>
            <table class="dash-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Event</th>
                  <th>Location</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><div class="date-block"><span class="date-block-d">12</span><span class="date-block-m">Oct</span></div></td>
                  <td>
                    <div style="font-weight: 600; color: #1e293b;">Sunday Family Worship</div>
                    <div style="font-size: 0.75rem; color: #64748b;">7:00 AM</div>
                  </td>
                  <td>Main Sanctuary</td>
                  <td><span class="status-badge status-new">Published</span></td>
                </tr>
                <tr>
                  <td><div class="date-block"><span class="date-block-d">18</span><span class="date-block-m">Oct</span></div></td>
                  <td>
                    <div style="font-weight: 600; color: #1e293b;">Youth Fellowship Meet</div>
                    <div style="font-size: 0.75rem; color: #64748b;">5:00 PM</div>
                  </td>
                  <td>CBC Youth Hall</td>
                  <td><span class="status-badge status-new">Published</span></td>
                </tr>
                <tr>
                  <td><div class="date-block"><span class="date-block-d">25</span><span class="date-block-m">Oct</span></div></td>
                  <td>
                    <div style="font-weight: 600; color: #1e293b;">Women's Prayer Meeting</div>
                    <div style="font-size: 0.75rem; color: #64748b;">10:00 AM</div>
                  </td>
                  <td>Fellowship Hall</td>
                  <td><span class="status-badge status-new">Published</span></td>
                </tr>
                <tr>
                  <td><div class="date-block"><span class="date-block-d">02</span><span class="date-block-m">Nov</span></div></td>
                  <td>
                    <div style="font-weight: 600; color: #1e293b;">Mission Sunday</div>
                    <div style="font-size: 0.75rem; color: #64748b;">9:30 AM</div>
                  </td>
                  <td>Main Sanctuary</td>
                  <td><span class="status-badge status-draft">Draft</span></td>
                </tr>
                <tr>
                  <td><div class="date-block"><span class="date-block-d">09</span><span class="date-block-m">Nov</span></div></td>
                  <td>
                    <div style="font-weight: 600; color: #1e293b;">Church Anniversary</div>
                    <div style="font-size: 0.75rem; color: #64748b;">6:30 PM</div>
                  </td>
                  <td>Main Sanctuary</td>
                  <td><span class="status-badge status-new">Published</span></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="dash-section">
            <div class="dash-section-header">
              <h3>Quick Actions</h3>
            </div>
            <div class="quick-actions-grid">
              <a href="#/admin/events" class="quick-action-btn" style="background: #f0fdf4; border-color: #dcfce7;">
                <div class="qa-icon icon-green"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg></div>
                <div>
                  <h4>Add Event</h4>
                  <p>Create new event</p>
                </div>
              </a>
              <a href="#/admin/sermons" class="quick-action-btn" style="background: #eff6ff; border-color: #dbeafe;">
                <div class="qa-icon icon-blue"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg></div>
                <div>
                  <h4>Add Sermon</h4>
                  <p>Upload sermon</p>
                </div>
              </a>
              <a href="#/admin/ministries" class="quick-action-btn" style="background: #fefce8; border-color: #fef08a;">
                <div class="qa-icon icon-gold"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg></div>
                <div>
                  <h4>Manage Ministries</h4>
                  <p>Edit ministries</p>
                </div>
              </a>
              <a href="#/admin/media" class="quick-action-btn" style="background: #faf5ff; border-color: #f3e8ff;">
                <div class="qa-icon icon-purple"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg></div>
                <div>
                  <h4>Upload Media</h4>
                  <p>Add images</p>
                </div>
              </a>
            </div>
          </div>

        </div>
      </div>
    `;

    this.container.innerHTML = AdminLayout.getLayout(content, '/admin');
  }
}
