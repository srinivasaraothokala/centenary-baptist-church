import { API_BASE } from '../apiConfig.js';
export class SermonsPage {
  constructor(containerSelector) {
    this.container = document.querySelector(containerSelector);
    if (!this.container) return;
    this.sermons = [];
    this.currentFilter = 'All';
    this.API_URL = `${API_BASE}/sermons`;
    this.init();
  }

  async init() {
    try {
      const res = await fetch(this.API_URL);
      if (res.ok) {
        const allSermons = await res.json();
        this.sermons = allSermons.filter(s => s.published !== false);
        // Sort by sort_order ascending, then date descending
        this.sermons.sort((a, b) => {
          if ((a.sort_order || 0) !== (b.sort_order || 0)) {
            return (a.sort_order || 0) - (b.sort_order || 0);
          }
          return new Date(b.date) - new Date(a.date);
        });
      }
    } catch (err) {
      console.error('Failed to fetch sermons:', err);
    }
    this.render();
  }

  getFilteredSermons() {
    if (this.currentFilter === 'All') return this.sermons;
    return this.sermons.filter(s => s.category === this.currentFilter);
  }

  setFilter(filter) {
    this.currentFilter = filter;
    this.render();
  }

  render() {
    if (!this.container) return;

    // Categories derived from actual data + defaults
    const categories = ['All', 'Sunday Worship', 'Sermon', 'Bible Study', 'Youth', 'Special Service', 'Testimony', 'Other'];
    
    // Sort sermons by sort_order ascending, then date descending to ensure the featured/latest is first
    const sortedSermons = [...this.sermons].sort((a, b) => {
      if ((a.sort_order || 0) !== (b.sort_order || 0)) {
        return (a.sort_order || 0) - (b.sort_order || 0);
      }
      return new Date(b.date) - new Date(a.date);
    });
    
    // Attempt to find a featured sermon first, otherwise fallback to the most recent one
    const latestSermon = sortedSermons.find(s => s.featured) || (sortedSermons.length > 0 ? sortedSermons[0] : null);
    
    const filteredSermons = this.currentFilter === 'All' 
      ? sortedSermons.filter(s => !latestSermon || s.id !== latestSermon.id) // Exclude only the featured/latest from grid
      : sortedSermons.filter(s => s.category === this.currentFilter);

    // SVG Icons
    const playIcon = `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`;
    const playIconCircle = `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5"><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8" fill="white"></polygon></svg>`;
    const userIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;
    const calendarIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`;
    const tagIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>`;
    const externalIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>`;
    const smallPlayIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`;

    let html = `
      <style>
        .sermons-page-wrapper {
          font-family: 'Inter', sans-serif;
          background-color: #ffffff;
          color: #1E1E1E;
        }

        /* Hero Section */
        .sermons-hero {
          position: relative;
          background-image: url('/sermons_hero_bg.jpg');
          background-size: cover;
          background-position: center;
          min-height: 380px;
          display: flex;
          align-items: center;
          color: white;
          overflow: hidden;
        }
        .sermons-hero::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: linear-gradient(to right, rgba(20, 15, 10, 0.95) 0%, rgba(20, 15, 10, 0.7) 50%, rgba(20, 15, 10, 0.2) 100%);
          z-index: 1;
        }
        .sermons-hero-content {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          padding: 60px 24px;
        }
        .sermons-eyebrow {
          color: #C6922E;
          font-weight: 700;
          letter-spacing: 2px;
          font-size: 14px;
          margin-bottom: 16px;
          text-transform: uppercase;
        }
        .sermons-hero h1 {
          font-family: 'Playfair Display', serif;
          font-size: 52px;
          line-height: 1.15;
          margin-bottom: 24px;
          max-width: 600px;
          color: #FFFFFF !important;
          font-weight: 700;
        }
        .sermons-hero p {
          font-size: 18px;
          line-height: 1.6;
          margin-bottom: 32px;
          max-width: 550px;
          color: #FFFFFF !important;
        }
        .sermons-quote {
          font-family: 'Playfair Display', serif;
          font-style: italic;
          font-size: 18px;
          line-height: 1.5;
          opacity: 0.9;
          max-width: 500px;
          color: #FFFFFF !important;
          border-top: 1px solid rgba(255,255,255,0.3);
          padding-top: 16px;
        }

        /* Layout */
        .sermons-section {
          max-width: 1200px;
          margin: 0 auto;
          padding: 60px 24px;
        }
        
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 16px;
        }
        .section-header h2 {
          font-family: 'Playfair Display', serif;
          font-size: 32px;
          color: #1E1E1E;
          margin-bottom: 4px;
          font-weight: 700;
        }
        .section-header p {
          color: #666;
          font-size: 15px;
          margin: 0;
        }
        
        .view-all-btn {
          border: 1px solid #8A1525;
          color: #8A1525;
          background: transparent;
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
        }
        .view-all-btn:hover {
          background: #fdf5f6;
        }

        /* Latest Message */
        .latest-message-container {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 40px;
          align-items: center;
          margin-bottom: 80px;
        }
        @media (max-width: 900px) {
          .latest-message-container {
            grid-template-columns: 1fr;
          }
        }
        .latest-thumbnail {
          position: relative;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        .latest-thumbnail img {
          width: 100%;
          aspect-ratio: 16/9;
          object-fit: cover;
          display: block;
        }
        .play-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        }
        .latest-thumbnail:hover .play-overlay {
          background: rgba(0,0,0,0.3);
        }
        .duration-pill {
          position: absolute;
          bottom: 12px;
          right: 12px;
          background: rgba(0,0,0,0.85);
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 13px;
          font-weight: 600;
        }
        
        .latest-content {
          display: flex;
          flex-direction: column;
        }
        .featured-pill {
          display: inline-flex;
          background: #faeacc;
          color: #9e6d16;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1px;
          margin-bottom: 16px;
          text-transform: uppercase;
          align-self: flex-start;
          align-items: center;
          gap: 6px;
        }
        .latest-content h3 {
          font-family: 'Playfair Display', serif;
          font-size: 32px;
          color: #1E1E1E;
          margin-bottom: 12px;
          line-height: 1.2;
        }
        .latest-desc-short {
          color: #555;
          font-size: 16px;
          margin-bottom: 20px;
        }
        .meta-row {
          display: flex;
          align-items: center;
          gap: 20px;
          color: #666;
          font-size: 13px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        .meta-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .latest-desc-long {
          color: #666;
          font-size: 14px;
          line-height: 1.6;
          margin-bottom: 24px;
        }
        .watch-btn {
          background: #8A1525;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 15px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          align-self: flex-start;
          text-decoration: none;
          transition: background 0.2s;
        }
        .watch-btn:hover {
          background: #680f1b;
        }

        /* Filter Pills */
        .filter-container {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          align-items: center;
        }
        .filter-pill {
          padding: 8px 16px;
          border: 1px solid #e0e0e0;
          border-radius: 20px;
          background: white;
          color: #555;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        .filter-pill:hover {
          border-color: #bbb;
        }
        .filter-pill.active {
          background: #0F4A3A;
          color: white;
          border-color: #0F4A3A;
        }

        /* Grid */
        .sermon-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
          margin-top: 32px;
        }
        @media (max-width: 1100px) { .sermon-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 800px) { .sermon-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 500px) { .sermon-grid { grid-template-columns: 1fr; } }
        
        .sermon-card {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid #eaeaea;
          transition: box-shadow 0.2s, transform 0.2s;
          display: flex;
          flex-direction: column;
        }
        .sermon-card:hover {
          box-shadow: 0 10px 25px rgba(0,0,0,0.05);
          transform: translateY(-4px);
        }
        .card-thumbnail {
          position: relative;
        }
        .card-thumbnail img {
          width: 100%;
          aspect-ratio: 16/9;
          object-fit: cover;
          display: block;
        }
        .card-content {
          padding: 16px;
          display: flex;
          flex-direction: column;
          flex: 1;
        }
        .card-title {
          font-family: 'Playfair Display', serif;
          font-size: 18px;
          color: #1E1E1E;
          margin: 0 0 12px 0;
          line-height: 1.3;
          font-weight: 700;
        }
        .card-meta-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          color: #666;
          font-size: 12px;
          margin-bottom: 8px;
        }
        .card-tag {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #666;
          font-size: 12px;
          margin-bottom: 16px;
        }
        .card-link {
          color: #D32F2F; /* YouTube Red color from mockup */
          font-size: 13px;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          text-decoration: none;
          margin-top: auto;
        }
        .card-link:hover {
          text-decoration: underline;
        }
        .empty-state {
          grid-column: 1 / -1;
          text-align: center;
          padding: 60px 0;
          color: #888;
          font-size: 16px;
          background: #f9f9f9;
          border-radius: 12px;
        }
      </style>

      <div class="sermons-page-wrapper">
        <header class="sermons-hero">
          <div class="sermons-hero-content">
            <div class="sermons-eyebrow">SERMONS</div>
            <h1>Listen, Learn and Grow<br>in God's Word</h1>
            <p>Watch our latest sermons, Bible studies, and special messages<br>from our pastors and guest speakers.</p>
            <div class="sermons-quote">
              "Faith comes from hearing, and hearing through<br>the word of Christ." – Romans 10:17
            </div>
          </div>
        </header>

        <main class="sermons-section">
    `;

    if (latestSermon && this.currentFilter === 'All') {
      html += `
          <div class="section-header">
            <div>
              <h2>Latest Message</h2>
              <p>Be encouraged by our most recent sermon.</p>
            </div>
            <button class="view-all-btn" onclick="document.querySelector('#all-sermons-grid').scrollIntoView({behavior: 'smooth'})">
              View All Sermons &rarr;
            </button>
          </div>

          <div class="latest-message-container">
            <div class="latest-thumbnail">
              <a href="${latestSermon.video_url}" target="_blank" rel="noopener noreferrer">
                ${latestSermon.thumbnail_url 
                  ? `<img src="${latestSermon.thumbnail_url}" alt="${latestSermon.title}">`
                  : `<div style="background: #f3f4f6; width: 100%; aspect-ratio: 16/9; display: flex; align-items: center; justify-content: center; color: #9ca3af;">No Image</div>`
                }
                <div class="play-overlay">${playIconCircle}</div>
                <div class="duration-pill">${latestSermon.duration || '--:--'}</div>
              </a>
            </div>
            
            <div class="latest-content">
              <div class="featured-pill">★ FEATURED SERMON</div>
              <h3>${latestSermon.title}</h3>
              
              <!-- In the mockup, there's a short description above the meta row, and a longer one below. We'll use the description field for the longer one. -->
              <div class="latest-desc-short">
                A message on living with hope in a challenging world through the power of the Gospel.
              </div>
              
              <div class="meta-row">
                <div class="meta-item">${userIcon} ${latestSermon.speaker}</div>
                <div class="meta-item">${calendarIcon} ${new Date(latestSermon.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                <div class="meta-item">${tagIcon} ${latestSermon.category}</div>
              </div>
              
              ${latestSermon.description ? `<div class="latest-desc-long">${latestSermon.description}</div>` : ''}
              
              <a href="${latestSermon.video_url}" target="_blank" rel="noopener noreferrer" class="watch-btn">
                ${playIcon} Watch on YouTube
              </a>
            </div>
          </div>
      `;
    }

    html += `
          <div class="section-header" id="all-sermons-grid">
            <div>
              <h2>All Sermons & Videos</h2>
              <p>Explore our collection of sermons, Bible studies, and special messages.</p>
            </div>
            <div class="filter-container sermon-filter-buttons">
              ${categories.map(cat => `
                <button class="filter-pill ${this.currentFilter === cat ? 'active' : ''}" data-filter="${cat}">
                  ${cat}
                </button>
              `).join('')}
            </div>
          </div>
          
          <div class="sermon-grid">
            ${filteredSermons.length === 0 ? `<div class="empty-state">No sermons found in this category.</div>` : ''}
            
            ${filteredSermons.map(sermon => `
              <div class="sermon-card">
                <div class="card-thumbnail">
                  <a href="${sermon.video_url}" target="_blank" rel="noopener noreferrer">
                    ${sermon.thumbnail_url 
                      ? `<img src="${sermon.thumbnail_url}" alt="${sermon.title}">`
                      : `<div style="background: #f3f4f6; width: 100%; aspect-ratio: 16/9; display: flex; align-items: center; justify-content: center; color: #9ca3af;">No Image</div>`
                    }
                    <div class="duration-pill" style="font-size: 11px;">${sermon.duration || '--:--'}</div>
                  </a>
                </div>
                <div class="card-content">
                  <h3 class="card-title">
                    <a href="${sermon.video_url}" target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: none;">${sermon.title}</a>
                  </h3>
                  <div class="card-meta-row">
                    <div class="meta-item">${userIcon} ${sermon.speaker}</div>
                    <div class="meta-item">${calendarIcon} ${new Date(sermon.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                  </div>
                  <div class="card-tag">
                    ${tagIcon} ${sermon.category}
                  </div>
                  <a href="${sermon.video_url}" target="_blank" rel="noopener noreferrer" class="card-link">
                    <span style="color: #D32F2F;">${smallPlayIcon}</span> Watch on YouTube ${externalIcon}
                  </a>
                </div>
              </div>
            `).join('')}
          </div>
        </main>
      </div>
    `;

    this.container.innerHTML = html;

    // Bind filters
    this.container.querySelectorAll('.sermon-filter-buttons button').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.setFilter(e.target.dataset.filter);
      });
    });
  }
}
