import { API_BASE } from '../apiConfig.js';

export class GallerySection {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;
    
    this.images = [];
    this.API_URL = `${API_BASE}/gallery`;
    this.isFetching = false;
    
    this.fetchImages();
  }

  _renderSkeleton() {
    if (!this.container) return;
    this.container.classList.add('section');
    this.container.style.background = '#f9fafb';
    this.container.style.paddingTop = '80px';
    this.container.style.paddingBottom = '80px';
    
    this.container.innerHTML = `
      <div class="wrap text-center fade-in-up visible">
        <div class="section-eyebrow">OUR COMMUNITY</div>
        <h2 class="section-title">Photo Gallery</h2>
        <p class="section-subtitle" style="max-width: 600px; margin: 0 auto 40px auto; color: var(--text-dark); opacity: 0.8;">
          Glimpses of worship, fellowship, and events at Centenary Baptist Church.
        </p>
      </div>
      <div class="wrap fade-in-up visible" style="animation-delay: 0.1s;">
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px;">
          ${[1,2,3,4,5,6,7,8].map(() => `
            <div class="skel-block" style="border-radius: 12px; aspect-ratio: 4/3; width: 100%;"></div>
          `).join('')}
        </div>
      </div>
    `;
  }

  _renderError() {
    if (!this.container) return;
    this.container.classList.add('section');
    this.container.style.background = '#f9fafb';
    this.container.style.paddingTop = '80px';
    this.container.style.paddingBottom = '80px';
    
    this.container.innerHTML = `
      <div class="wrap text-center fade-in-up visible">
        <div class="section-eyebrow">OUR COMMUNITY</div>
        <h2 class="section-title">Photo Gallery</h2>
      </div>
      <div class="wrap text-center fade-in-up visible" style="animation-delay: 0.1s; padding: 40px 0; color: #6b7280;">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom:16px; opacity: 0.5;">
          <circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <p style="margin:0 0 24px;font-size:15px;">Unable to load the photo gallery at this time.</p>
        <button id="gallery-retry-btn" style="
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: white;
          color: #003F3A;
          border: 1px solid #003F3A;
          padding: 10px 24px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        " onmouseover="this.style.background='#f0f4f2'" onmouseout="this.style.background='white'">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M2.13 15.57a10 10 0 1 0 3.43-11.44L2.13 8"></path></svg>
          Try Again
        </button>
      </div>
    `;

    const retryBtn = this.container.querySelector('#gallery-retry-btn');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        this.fetchImages();
      });
    }
  }

  _renderEmpty() {
    if (!this.container) return;
    this.container.classList.add('section');
    this.container.style.background = '#f9fafb';
    this.container.style.paddingTop = '80px';
    this.container.style.paddingBottom = '80px';
    
    this.container.innerHTML = `
      <div class="wrap text-center fade-in-up visible">
        <div class="section-eyebrow">OUR COMMUNITY</div>
        <h2 class="section-title">Photo Gallery</h2>
        <p class="section-subtitle" style="max-width: 600px; margin: 0 auto 40px auto; color: var(--text-dark); opacity: 0.8;">
          Glimpses of worship, fellowship, and events at Centenary Baptist Church.
        </p>
      </div>
      <div class="wrap text-center fade-in-up visible" style="animation-delay: 0.1s; padding: 40px 0; color: #6b7280;">
        <p style="margin:0;font-size:15px;">No photos available in the gallery yet.</p>
      </div>
    `;
  }

  async fetchImages() {
    if (this.isFetching) return;
    this.isFetching = true;
    this._renderSkeleton();

    try {
      const res = await fetch(this.API_URL);
      if (!res.ok) throw new Error('Network response was not ok');
      this.images = await res.json();
      this.render();
    } catch (err) {
      console.error('Failed to load gallery:', err);
      this._renderError();
    } finally {
      this.isFetching = false;
    }
  }

  render() {
    if (!this.container) return;
    if (!this.images || this.images.length === 0) {
      this._renderEmpty();
      return;
    }

    // Limit to recent 8 images for the homepage
    const displayImages = this.images.slice(0, 8);

    const html = `
      <div class="wrap text-center fade-in-up">
        <div class="section-eyebrow">OUR COMMUNITY</div>
        <h2 class="section-title">Photo Gallery</h2>
        <p class="section-subtitle" style="max-width: 600px; margin: 0 auto 40px auto; color: var(--text-dark); opacity: 0.8;">
          Glimpses of worship, fellowship, and events at Centenary Baptist Church.
        </p>
      </div>

      <div class="wrap fade-in-up" style="animation-delay: 0.1s;">
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px;">
          ${displayImages.map(img => `
            <div class="gallery-item" style="position: relative; overflow: hidden; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); aspect-ratio: 4/3; background: #eee;">
              <img src="${img.image_url}" alt="${img.title || 'Church event'}" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s ease;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'" loading="lazy"/>
              <div style="position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(transparent, rgba(0,0,0,0.8)); padding: 20px 16px 12px; color: white;">
                <h4 style="margin: 0; font-family: 'Playfair Display', serif; font-size: 16px; text-shadow: 0 1px 3px rgba(0,0,0,0.5);">${img.title || ''}</h4>
              </div>
            </div>
          `).join('')}
        </div>

        <div style="text-align:center; margin-top: 40px;">
          <a href="#/gallery" style="
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: #003F3A;
            color: white;
            text-decoration: none;
            padding: 13px 32px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 14px;
            transition: background 0.2s;
          ">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            View Full Gallery
          </a>
        </div>
      </div>
    `;

    this.container.innerHTML = html;
    this.container.classList.add('section');
    this.container.style.background = '#f9fafb';
    this.container.style.paddingTop = '80px';
    this.container.style.paddingBottom = '80px';
    
    // Observer for animations
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1 });
    
    const animatedElements = this.container.querySelectorAll('.fade-in-up');
    animatedElements.forEach(el => observer.observe(el));
  }
}
