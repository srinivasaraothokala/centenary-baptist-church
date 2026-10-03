import { API_BASE } from '../apiConfig.js';
import { churchData } from '../data/churchData.js';
import { GiveSection } from '../components/GiveSection.js';
import { SermonsPage } from './SermonsPage.js';

export class PageRenderer {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this._bindEventRegistration();
  }

  async render(path) {
    // Scroll to top on page change
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Default page title and content
    let title = "Page Not Found";
    let contentHTML = `<div class="content-wrap"><p>The page you are looking for does not exist or is still under construction.</p></div>`;

    // About Routing
    if (path === '/about/our-story') {
      title = "Our Story";
      contentHTML = this._renderOurStory();
    } else if (path === '/about' || path === '/about/' || path === '/about-us') {
      title = "About Us";
      contentHTML = this._renderAboutUs();
    } else if (path === '/about/our-beliefs') {
      title = "Our Beliefs";
      contentHTML = this._renderBeliefs();
    } else if (path === '/about/mission-vision') {
      title = "Mission & Vision";
      contentHTML = this._renderMissionVision();
    } else if (path === '/about/leadership' || path === '/leadership') {
      title = "Leadership";
      contentHTML = await this._renderLeadership();
    } else if (path === '/about/our-campus') {
      title = "Our Campus";
      contentHTML = await this._renderCampus();
    } else if (path.startsWith('/campus/')) {
      const slug = path.split('/')[2];
      title = "Campus Location";
      contentHTML = await this._renderCampusDetail(slug);
    } else if (path === '/about/faith-history' || path === '/about/150-years' || path === '/about/milestones') {
      title = "150 Years of Faithfulness";
      contentHTML = this._renderMilestones();
    } else if (path.startsWith('/about/')) {
      title = "About Us";
      contentHTML = this._renderAboutUs();
    } 
    // Worship Routing
    else if (path === '/worship/sunday-worship' || path === '/worship/timings' || path === '/worship') {
      title = "Worship Timings";
      contentHTML = this._renderTimings();
    } else if (path === '/worship/sunday-worship-info') {
      title = "Sunday Worship";
      contentHTML = this._renderSundayWorship();
    } else if (path === '/worship/sermons' || path === '/sermons') {
      title = "Sermons";
      contentHTML = this._renderSermons();
    } else if (path === '/worship/watch-live') {
      title = "Watch Live";
      contentHTML = this._renderWatchLive();
    } else if (path === '/worship/prayer') {
      title = "Prayer";
      contentHTML = this._renderPrayer();
    } else if (path.startsWith('/worship/')) {
      title = "Worship";
      contentHTML = `<div class="content-wrap"><p>More worship details are coming soon.</p></div>`;
    }
    // Ministries Routing
    else if (path.startsWith('/ministries/') && path.split('/').length === 3) {
      const slug = path.split('/')[2];
      title = "Ministry";
      contentHTML = await this._renderMinistryDetail(slug);
    }
    else if (path.startsWith('/ministries')) {
      title = "Our Ministries";
      contentHTML = await this._renderMinistries();
    }
    // Events
    else if (path.startsWith('/events/')) {
      const eventId = path.split('/')[2];
      title = "Event Details";
      contentHTML = this._renderEventDetails(eventId);
    }
    else if (path === '/events') {
      title = "Upcoming Events";
      contentHTML = this._renderEvents();
    }
    // Give
    else if (path === '/give') {
      title = "Give";
      contentHTML = this._renderGive();
    }
    // Visit / Contact
    else if (path === '/visit/contact' || path === '/visit/location' || path === '/visit/plan' || path === '/visit') {
      title = "Contact Us";
      contentHTML = this._renderContact();
    }

    if (path === '/give' || path === '/sermons' || path === '/worship/sermons') {
      this.container.innerHTML = `
        <div class="fade-in-up">
          ${contentHTML}
        </div>
      `;
    } else {
      const isAbout = path.startsWith('/about') || path === '/about-us';
      const isWorship = path.startsWith('/worship') || path === '/worship';
      const isEvents = path.startsWith('/events');

      if (isAbout) {
        // ── Special About Us Header ────────────────────────────────────────
        this.container.innerHTML = `
          <style>
            .about-hero {
              position: relative;
              min-height: 220px;
              background: url('/new_about_image.png') center center / cover no-repeat;
              display: flex;
              align-items: center;
              overflow: hidden;
            }
            .about-hero-overlay {
              position: absolute;
              inset: 0;
              background: linear-gradient(
                to right,
                rgba(0, 40, 30, 0.92) 0%,
                rgba(0, 40, 30, 0.85) 35%,
                rgba(0, 30, 20, 0.55) 60%,
                rgba(0, 0, 0, 0.10) 100%
              );
            }
            .about-hero-content {
              position: relative;
              z-index: 2;
              max-width: 1200px;
              margin: 0 auto;
              padding: 48px 40px;
              width: 100%;
            }
            .about-hero-title {
              font-family: 'Playfair Display', serif;
              font-size: clamp(38px, 5vw, 62px);
              font-weight: 700;
              color: white;
              margin: 0 0 14px;
              line-height: 1.1;
              text-shadow: 0 2px 12px rgba(0,0,0,0.4);
            }
            .about-hero-nav {
              display: flex;
              align-items: center;
              gap: 0;
              margin-bottom: 18px;
              flex-wrap: wrap;
            }
            .about-hero-nav a {
              color: #C9A84C;
              text-decoration: none;
              font-size: 11px;
              font-weight: 700;
              letter-spacing: 2px;
              text-transform: uppercase;
              transition: opacity 0.2s;
            }
            .about-hero-nav a:hover { opacity: 0.75; }
            .about-hero-nav-sep {
              color: rgba(201,168,76,0.5);
              margin: 0 12px;
              font-size: 11px;
            }
            .about-hero-verse {
              font-style: italic;
              color: rgba(255,255,255,0.85);
              font-size: 15px;
              line-height: 1.6;
              max-width: 480px;
              text-shadow: 0 1px 6px rgba(0,0,0,0.5);
            }
            .about-hero-verse span {
              color: #C9A84C;
              font-style: normal;
              font-weight: 600;
            }
            @media (max-width: 600px) {
              .about-hero-content { padding: 36px 20px; }
              .about-hero-title { font-size: 36px; }
            }
          </style>

          <div class="about-hero fade-in-up">
            <div class="about-hero-overlay"></div>
            <div class="about-hero-content">
              <h1 class="about-hero-title">About Us</h1>
              <div class="about-hero-nav">
                <a href="#/about/our-story">Our History</a>
                <span class="about-hero-nav-sep">|</span>
                <a href="#/about/our-beliefs">Our Beliefs</a>
                <span class="about-hero-nav-sep">|</span>
                <a href="#/about/leadership">Our People</a>
                <span class="about-hero-nav-sep">|</span>
                <a href="#/about/mission-vision">Our Purpose</a>
              </div>
              <p class="about-hero-verse">
                "For we are God's workmanship, created in Christ Jesus<br>
                to do good works." <span>– Ephesians 2:10</span>
              </p>
            </div>
          </div>
          <div class="page-content-body fade-in-up stagger-1">
            ${contentHTML}
          </div>
        `;

      } else if (isWorship) {
        // ── Special Worship Header ─────────────────────────────────────────
        this.container.innerHTML = `
          <style>
            .worship-hero {
              position: relative;
              min-height: 280px;
              background: url('/new_worship_image.png') center center / cover no-repeat;
              display: flex;
              align-items: center;
              overflow: hidden;
            }
            .worship-hero-overlay {
              position: absolute;
              inset: 0;
              background: linear-gradient(
                to right,
                rgba(10, 20, 40, 0.88) 0%,
                rgba(10, 20, 40, 0.75) 40%,
                rgba(10, 20, 40, 0.40) 70%,
                rgba(0, 0, 0, 0.10) 100%
              );
            }
            .worship-hero-content {
              position: relative;
              z-index: 2;
              max-width: 1200px;
              margin: 0 auto;
              padding: 56px 40px;
              width: 100%;
            }
            .worship-hero-eyebrow {
              font-size: 11px;
              font-weight: 700;
              letter-spacing: 3px;
              text-transform: uppercase;
              color: #C9A84C;
              margin-bottom: 12px;
            }
            .worship-hero-title {
              font-family: 'Playfair Display', serif;
              font-size: clamp(38px, 5vw, 64px);
              font-weight: 700;
              color: white;
              margin: 0 0 16px;
              line-height: 1.1;
              text-shadow: 0 2px 16px rgba(0,0,0,0.5);
            }
            .worship-hero-nav {
              display: flex;
              align-items: center;
              gap: 0;
              margin-bottom: 20px;
              flex-wrap: wrap;
            }
            .worship-hero-nav a {
              color: #C9A84C;
              text-decoration: none;
              font-size: 11px;
              font-weight: 700;
              letter-spacing: 2px;
              text-transform: uppercase;
              transition: opacity 0.2s;
            }
            .worship-hero-nav a:hover { opacity: 0.75; }
            .worship-hero-nav-sep {
              color: rgba(201,168,76,0.5);
              margin: 0 12px;
              font-size: 11px;
            }
            .worship-hero-verse {
              font-style: italic;
              color: rgba(255,255,255,0.88);
              font-size: 15px;
              line-height: 1.7;
              max-width: 500px;
              text-shadow: 0 1px 8px rgba(0,0,0,0.6);
            }
            .worship-hero-verse span {
              color: #C9A84C;
              font-style: normal;
              font-weight: 600;
            }
            @media (max-width: 600px) {
              .worship-hero-content { padding: 40px 20px; }
              .worship-hero-title { font-size: 36px; }
            }
          </style>

          <div class="worship-hero fade-in-up">
            <div class="worship-hero-overlay"></div>
            <div class="worship-hero-content">
              <div class="worship-hero-eyebrow">Centenary Baptist Church</div>
              <h1 class="worship-hero-title">${title}</h1>
              <div class="worship-hero-nav">
                <a href="#/worship/sunday-worship-info">Sunday Worship</a>
                <span class="worship-hero-nav-sep">|</span>
                <a href="#/worship/timings">Timings</a>
                <span class="worship-hero-nav-sep">|</span>
                <a href="#/worship/sermons">Sermons</a>
                <span class="worship-hero-nav-sep">|</span>
                <a href="#/worship/prayer">Prayer</a>
                <span class="worship-hero-nav-sep">|</span>
                <a href="#/worship/watch-live">Watch Live</a>
              </div>
              <p class="worship-hero-verse">
                "Praise the Lord! Sing to the Lord a new song,<br>
                his praise in the assembly of the faithful." <span>– Psalm 149:1</span>
              </p>
            </div>
          </div>
          <div class="page-content-body fade-in-up stagger-1">
            ${contentHTML}
          </div>
        `;

      } else if (isEvents) {
        // ── Special Events Header ──────────────────────────────────────────
        this.container.innerHTML = `
          <style>
            .events-hero {
              position: relative;
              min-height: 280px;
              background: url('/new_worship_image.png') center center / cover no-repeat;
              display: flex;
              align-items: center;
              overflow: hidden;
            }
            .events-hero-overlay {
              position: absolute;
              inset: 0;
              background: linear-gradient(
                to right,
                rgba(20, 10, 40, 0.90) 0%,
                rgba(20, 10, 40, 0.78) 40%,
                rgba(20, 10, 40, 0.42) 70%,
                rgba(0, 0, 0, 0.10) 100%
              );
            }
            .events-hero-content {
              position: relative;
              z-index: 2;
              max-width: 1200px;
              margin: 0 auto;
              padding: 56px 40px;
              width: 100%;
            }
            .events-hero-eyebrow {
              font-size: 11px;
              font-weight: 700;
              letter-spacing: 3px;
              text-transform: uppercase;
              color: #C9A84C;
              margin-bottom: 12px;
            }
            .events-hero-title {
              font-family: 'Playfair Display', serif;
              font-size: clamp(38px, 5vw, 64px);
              font-weight: 700;
              color: white;
              margin: 0 0 16px;
              line-height: 1.1;
              text-shadow: 0 2px 16px rgba(0,0,0,0.5);
            }
            .events-hero-subtitle {
              font-style: italic;
              color: rgba(255,255,255,0.88);
              font-size: 15px;
              line-height: 1.7;
              max-width: 500px;
              text-shadow: 0 1px 8px rgba(0,0,0,0.6);
            }
            .events-hero-subtitle span {
              color: #C9A84C;
              font-style: normal;
              font-weight: 600;
            }
            @media (max-width: 600px) {
              .events-hero-content { padding: 40px 20px; }
              .events-hero-title { font-size: 36px; }
            }
          </style>

          <div class="events-hero fade-in-up">
            <div class="events-hero-overlay"></div>
            <div class="events-hero-content">
              <div class="events-hero-eyebrow">Centenary Baptist Church</div>
              <h1 class="events-hero-title">${title}</h1>
              <p class="events-hero-subtitle">
                Join us for worship, fellowship, learning and service.<br>
                <span>All are welcome — come as you are.</span>
              </p>
            </div>
          </div>
          <div class="page-content-body fade-in-up stagger-1">
            ${contentHTML}
          </div>
        `;

      } else {
        // ── Default Page Header ────────────────────────────────────────────
        this.container.innerHTML = `
          <div class="page-header" style="background-image: linear-gradient(rgba(27, 39, 51, 0.82), rgba(27, 39, 51, 0.82)), url('/new_worship_image.png'); background-size: cover; background-position: center;">
            <div class="wrap text-center fade-in-up">
              <h1 class="page-title">${title}</h1>
              <div class="page-breadcrumb">Home / ${title}</div>
            </div>
          </div>
          <div class="page-content-body fade-in-up stagger-1">
            ${contentHTML}
          </div>
        `;
      }
    }
    
    // Trigger animations
    setTimeout(() => {
      const animated = this.container.querySelectorAll('.fade-in-up');
      animated.forEach(el => el.classList.add('visible'));
    }, 50);
  }

  _renderAboutUs() {
    return `
      ${this._renderMissionVision()}
      <div class="content-wrap" style="background:var(--cream); padding: 80px 24px;">
        <h2 style="text-align:center; font-family:'Playfair Display', serif; font-size:36px; color:var(--primary-green); margin-bottom:48px;">Our Beliefs</h2>
        ${this._renderBeliefs()}
      </div>
      <div class="content-wrap" style="padding: 80px 24px;">
        <h2 style="text-align:center; font-family:'Playfair Display', serif; font-size:36px; color:var(--primary-green); margin-bottom:48px;">150 Years of Faithfulness</h2>
        ${this._renderOurStory()}
      </div>
    `;
  }

  _renderOurStory() {
    return `<div id="about-faithfulness-timeline"></div>`;
  }

  _renderBeliefs() {
    let html = `<div class="wrap beliefs-grid">`;
    churchData.beliefs.forEach(b => {
      html += `
        <div class="belief-card">
          <h3>${b.title}</h3>
          <p>${b.desc}</p>
        </div>
      `;
    });
    html += `</div>`;
    return html;
  }

  _renderMissionVision() {
    return `
      <div class="wrap text-content center-text">
        <h2 style="color: var(--primary-green); font-size: 32px; font-family: 'Playfair Display', serif;">Our Mission</h2>
        <p class="lede" style="margin-bottom: 40px;">To know Christ and make Him known, glorifying God by making disciples and serving our community in love.</p>
        
        <h2 style="color: var(--primary-green); font-size: 32px; font-family: 'Playfair Display', serif;">Our Vision</h2>
        <p class="lede">To be a Christ-centred, Bible-based, prayer-driven family of faith that transforms lives and equips believers for a lifetime of ministry.</p>
      </div>
    `;
  }

  async _renderLeadership() {
    let leaders = [];
    try {
      const res = await fetch(`${API_BASE}/leadership`);
      if (res.ok) leaders = await res.json();
    } catch {}

    // Fallback to churchData if API fails
    if (!leaders.length) {
      leaders = [
        ...churchData.pastoralTeam.map((p, i) => ({ ...p, category: 'pastoral', order_index: i + 1, is_active: true })),
        ...churchData.executiveCommittee.map((e, i) => ({ ...e, category: 'executive', order_index: i + 1, is_active: true }))
      ];
    }

    const pastoral  = leaders.filter(l => l.category === 'pastoral'  && l.is_active);
    const executive = leaders.filter(l => l.category === 'executive' && l.is_active);

    const pastoralHTML = pastoral.map(p => {
      const avatar = p.image_url
        ? `<img src="${p.image_url}" alt="${p.name}" style="width:120px;height:120px;border-radius:50%;object-fit:cover;border:4px solid #e5e7eb;box-shadow:0 4px 20px rgba(0,0,0,0.1);">`
        : `<div style="width:120px;height:120px;border-radius:50%;background:linear-gradient(135deg,#003F3A,#C9A84C);display:flex;align-items:center;justify-content:center;font-size:42px;font-weight:700;color:white;border:4px solid #e5e7eb;box-shadow:0 4px 20px rgba(0,0,0,0.1);">${p.name.charAt(0)}</div>`;

      return `
        <div style="background:white;border-radius:16px;padding:32px 24px;text-align:center;border:1px solid #e5e7eb;box-shadow:0 2px 12px rgba(0,0,0,0.05);transition:transform 0.2s,box-shadow 0.2s;" onmouseover="this.style.transform='translateY(-4px)';this.style.boxShadow='0 8px 30px rgba(0,0,0,0.1)'" onmouseout="this.style.transform='';this.style.boxShadow='0 2px 12px rgba(0,0,0,0.05)'">
          <div style="display:flex;justify-content:center;margin-bottom:16px;">
            ${avatar}
          </div>
          <div style="display:inline-block;padding:3px 12px;border-radius:20px;background:#ecfdf5;color:#003F3A;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:10px;">${p.role}</div>
          <h3 style="font-family:'Playfair Display',serif;font-size:19px;color:#111827;margin:0 0 12px;line-height:1.3;">${p.name}</h3>
          ${p.bio ? `<p style="font-size:14px;color:#6b7280;line-height:1.7;margin:0;">${p.bio}</p>` : ''}
        </div>
      `;
    }).join('');

    const execHTML = executive.map(e => `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 0;border-bottom:1px solid #f1f5f9;">
        <div style="font-size:13px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;min-width:200px;">${e.role}</div>
        <div style="font-size:15px;font-weight:500;color:#1e293b;text-align:right;">${e.name}</div>
      </div>
    `).join('');

    return `
      <style>
        .leadership-page-wrap { max-width: 1100px; margin: 0 auto; padding: 48px 24px; }
      </style>

      <div class="leadership-page-wrap">
        <!-- Page Intro -->
        <div style="text-align:center;margin-bottom:56px;">
          <div style="display:inline-block;padding:4px 16px;background:#ecfdf5;color:#003F3A;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;border-radius:20px;margin-bottom:16px;">OUR PEOPLE</div>
          <h1 style="font-family:'Playfair Display',serif;font-size:clamp(32px,5vw,52px);color:#003F3A;margin:0 0 16px;line-height:1.15;">Meet Our Leadership</h1>
          <p style="font-size:16px;color:#6b7280;max-width:560px;margin:0 auto;line-height:1.8;">Faithful servants leading Centenary Baptist Church with wisdom, compassion, and a heart for God's people since 1875.</p>
        </div>

        <!-- Pastoral Team -->
        ${pastoral.length ? `
          <div style="margin-bottom:64px;">
            <h2 style="font-family:'Playfair Display',serif;font-size:26px;color:#111827;margin:0 0 8px;text-align:center;">Pastoral Team</h2>
            <p style="text-align:center;color:#94a3b8;font-size:13px;margin:0 0 32px;text-transform:uppercase;letter-spacing:1px;">Shepherding the Flock</p>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:24px;">
              ${pastoralHTML}
            </div>
          </div>
        ` : ''}

        <!-- Executive Committee -->
        ${executive.length ? `
          <div style="background:white;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.05);">
            <div style="padding:28px 32px;border-bottom:1px solid #f1f5f9;background:linear-gradient(135deg,#003F3A,#005F58);">
              <h2 style="font-family:'Playfair Display',serif;font-size:22px;color:white;margin:0 0 4px;">Executive Committee</h2>
              <p style="color:rgba(255,255,255,0.7);font-size:13px;margin:0;">Elected leadership of the congregation</p>
            </div>
            <div style="padding:8px 32px 24px;">
              ${execHTML}
            </div>
          </div>
        ` : ''}

        <!-- CTA -->
        <div style="text-align:center;margin-top:56px;padding:40px;background:#f8fafc;border-radius:16px;border:1px solid #e5e7eb;">
          <p style="font-size:16px;color:#6b7280;margin:0 0 20px;line-height:1.7;">Want to get involved in the life of the church?<br>Reach out to our pastoral team — we'd love to connect with you.</p>
          <a href="#/visit/contact" style="display:inline-flex;align-items:center;gap:8px;background:#003F3A;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
            Contact Us →
          </a>
        </div>
      </div>
    `;
  }

  async _renderCampus() {
    let campuses = [];
    try {
      const res = await fetch(`${API_BASE}/campus`);
      if (res.ok) {
        const all = await res.json();
        campuses = all.filter(c => c.is_active);
      }
    } catch {}

    // Fallback to static data
    if (!campuses.length) {
      campuses = churchData.campus.map((c, i) => ({
        id: i, title: c.title, short_desc: c.desc, icon: c.icon || '🏛',
        slug: c.id, is_active: true, sort_order: i + 1
      }));
    }

    if (!campuses.length) {
      return `<div class="content-wrap"><p style="text-align:center;color:#64748b;">No campus locations found.</p></div>`;
    }

    let html = `<div class="wrap campus-grid">`;
    campuses.forEach(c => {
      const imgStyle = c.image_url
        ? `background-image:url('${c.image_url}');background-size:cover;background-position:center;`
        : `background:linear-gradient(135deg,#003F3A,#005F58);`;
      html += `
        <div class="campus-card-lg" style="cursor:pointer;" onclick="window.location.hash='#/campus/${c.slug}'">
          <div style="width:100%;height:160px;${imgStyle}border-radius:10px 10px 0 0;display:flex;align-items:center;justify-content:center;font-size:48px;margin-bottom:0;">
            ${!c.image_url ? `<span style="filter:drop-shadow(0 2px 8px rgba(0,0,0,0.4));">${c.icon || '🏛'}</span>` : ''}
          </div>
          <div style="padding:20px;">
            <div class="campus-icon" style="margin-bottom:8px;">${c.icon || '🏛'}</div>
            <h3 style="margin:0 0 8px;">${c.title}</h3>
            <p style="margin:0 0 12px;font-size:14px;color:#64748b;">${c.short_desc || ''}</p>
            ${c.address ? `<div style="font-size:12px;color:#94a3b8;">📍 ${c.address}</div>` : ''}
            <a href="#/campus/${c.slug}" style="display:inline-block;margin-top:14px;font-size:13px;font-weight:600;color:#003F3A;text-decoration:none;">View Details →</a>
          </div>
        </div>
      `;
    });
    html += `</div>`;
    return html;
  }

  async _renderCampusDetail(slug) {
    let c = null;
    try {
      const res = await fetch(`${API_BASE}/campus/${slug}`);
      if (res.ok) c = await res.json();
    } catch {}

    if (!c) {
      return `<div class="wrap text-content">
        <p style="color:#64748b;">Campus location not found.</p>
        <a href="#/about/our-campus" class="btn-link">&larr; All Locations</a>
      </div>`;
    }

    const imgHtml = c.image_url
      ? `<div style="width:100%;height:320px;background:url('${c.image_url}') center/cover no-repeat;border-radius:14px;margin-bottom:36px;position:relative;overflow:hidden;">
           <div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,0.5),transparent);"></div>
           <div style="position:absolute;bottom:24px;left:28px;font-size:48px;filter:drop-shadow(0 2px 8px rgba(0,0,0,0.4));">${c.icon || ''}</div>
         </div>`
      : `<div style="width:100%;height:180px;background:linear-gradient(135deg,#003F3A,#005F58);border-radius:14px;margin-bottom:36px;display:flex;align-items:center;justify-content:center;font-size:72px;">${c.icon || '🏛'}</div>`;

    const metaItems = [
      c.address  ? `<div style="display:flex;align-items:flex-start;gap:12px;padding:16px 0;border-bottom:1px solid #f1f5f9;"><span style="font-size:20px;">📍</span><div><div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#94a3b8;margin-bottom:3px;">Address</div><div style="font-weight:600;color:#1e293b;">${c.address}</div></div></div>` : '',
      c.phone    ? `<div style="display:flex;align-items:flex-start;gap:12px;padding:16px 0;border-bottom:1px solid #f1f5f9;"><span style="font-size:20px;">📞</span><div><div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#94a3b8;margin-bottom:3px;">Phone</div><a href="tel:${c.phone}" style="font-weight:600;color:#003F3A;text-decoration:none;">${c.phone}</a></div></div>` : '',
      c.map_url  ? `<div style="display:flex;align-items:flex-start;gap:12px;padding:16px 0;"><span style="font-size:20px;">🗺</span><div><div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#94a3b8;margin-bottom:3px;">Directions</div><a href="${c.map_url}" target="_blank" rel="noopener" style="font-weight:600;color:#003F3A;text-decoration:none;">Open in Google Maps →</a></div></div>` : ''
    ].filter(Boolean).join('');

    return `
      <div class="wrap" style="max-width:860px;margin:0 auto;padding:48px 24px;">
        <a href="#/about/our-campus" class="btn-link" style="display:inline-flex;align-items:center;gap:6px;margin-bottom:32px;font-size:13px;">&larr; All Locations</a>

        ${imgHtml}

        <div style="display:grid;grid-template-columns:1fr ${metaItems ? '280px' : '0px'};gap:40px;align-items:start;">
          <div>
            <h1 style="font-family:'Playfair Display',serif;font-size:clamp(28px,4vw,42px);color:#003F3A;margin:0 0 16px;line-height:1.15;">${c.title}</h1>
            ${c.short_desc ? `<p style="font-size:18px;color:#475569;line-height:1.7;margin:0 0 24px;">${c.short_desc}</p>` : ''}
            ${c.full_desc  ? `<div style="font-size:15px;color:#374151;line-height:1.8;white-space:pre-wrap;">${c.full_desc}</div>` : ''}
            ${c.map_url ? `
              <div style="margin-top:36px;">
                <a href="${c.map_url}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:8px;background:#003F3A;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
                  🗺 Get Directions
                </a>
              </div>` : ''}
          </div>

          ${metaItems ? `
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:8px 20px;">
            <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;padding:16px 0 8px;">Location Info</div>
            ${metaItems}
          </div>` : ''}
        </div>

        <div style="margin-top:48px;padding-top:32px;border-top:1px solid #f1f5f9;">
          <a href="#/about/our-campus" class="btn-link">&larr; Back to All Locations</a>
        </div>
      </div>
    `;
  }

  _renderMilestones() {
    return `<div id="about-faithfulness-timeline"></div>`;
  }

  _renderTimings() {
    let html = `<div class="wrap"><div class="timings-grid">`;
    churchData.worshipTimings.forEach(t => {
      html += `
        <div class="timing-card">
          <div class="t-time">${t.time}</div>
          <h3 class="t-service">${t.service}</h3>
          <div class="t-loc">${t.location}</div>
        </div>
      `;
    });
    html += `</div></div>`;
    return html;
  }

  _renderSermons() {
    let html = `<div id="sermons-dynamic-app"></div>`;
    
    setTimeout(() => {
      new SermonsPage('#sermons-dynamic-app');
    }, 50);

    return html;
  }

  async _renderMinistries() {
    let ministries = [];
    try {
      const res = await fetch(`${API_BASE}/ministries`);
      if (res.ok) {
        const all = await res.json();
        ministries = all.filter(m => m.is_active);
      }
    } catch {}

    // Fallback to static data
    if (!ministries.length) {
      ministries = churchData.ministries.map((m, i) => ({
        id: i, title: m.title, short_desc: m.desc, icon: m.icon,
        image_url: m.image, slug: m.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        is_active: true
      }));
    }

    if (!ministries.length) {
      return `<div class="content-wrap"><p style="text-align:center;color:#64748b;">No ministries found.</p></div>`;
    }

    let html = `<div class="wrap ministries-grid-full">`;
    ministries.forEach(m => {
      const imgStyle = m.image_url
        ? `background-image:url('${m.image_url}');background-size:cover;background-position:center;`
        : `background:linear-gradient(135deg,#003F3A,#005F58);`;
      html += `
        <div class="ministry-card-full">
          <div class="m-img" style="${imgStyle}position:relative;">
            <div style="position:absolute;inset:0;background:rgba(0,0,0,0.18);"></div>
            <div style="position:absolute;top:16px;left:16px;font-size:28px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3));">${m.icon || '✝'}</div>
          </div>
          <div class="m-content">
            <h3>${m.title}</h3>
            <p>${m.short_desc || ''}</p>
            ${m.leader_name ? `<div style="font-size:13px;color:#64748b;margin-top:8px;">👤 <strong>${m.leader_name}</strong></div>` : ''}
            ${m.meeting_time ? `<div style="font-size:13px;color:#64748b;margin-top:4px;">🕐 ${m.meeting_time}${m.meeting_location ? ' · ' + m.meeting_location : ''}</div>` : ''}
            <a href="#/ministries/${m.slug}" class="btn-link" style="margin-top:16px;display:inline-block;">Learn More &rarr;</a>
          </div>
        </div>
      `;
    });
    html += `</div>`;
    return html;
  }

  async _renderMinistryDetail(slug) {
    let m = null;
    try {
      const res = await fetch(`${API_BASE}/ministries/${slug}`);
      if (res.ok) m = await res.json();
    } catch {}

    if (!m) {
      return `<div class="wrap text-content">
        <p style="color:#64748b;">Ministry not found.</p>
        <a href="#/ministries" class="btn-link">&larr; All Ministries</a>
      </div>`;
    }

    const imgHtml = m.image_url
      ? `<div style="width:100%;height:320px;background:url('${m.image_url}') center/cover no-repeat;border-radius:14px;margin-bottom:36px;position:relative;overflow:hidden;">
           <div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,0.5),transparent);"></div>
           <div style="position:absolute;bottom:24px;left:28px;font-size:48px;filter:drop-shadow(0 2px 8px rgba(0,0,0,0.4));">${m.icon || ''}</div>
         </div>`
      : `<div style="width:100%;height:180px;background:linear-gradient(135deg,#003F3A,#005F58);border-radius:14px;margin-bottom:36px;display:flex;align-items:center;justify-content:center;font-size:64px;">${m.icon || '✝'}</div>`;

    const metaItems = [
      m.leader_name      ? `<div style="display:flex;align-items:flex-start;gap:12px;padding:16px 0;border-bottom:1px solid #f1f5f9;"><span style="font-size:20px;">👤</span><div><div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#94a3b8;margin-bottom:3px;">Leader</div><div style="font-weight:600;color:#1e293b;">${m.leader_name}</div></div></div>` : '',
      m.meeting_time     ? `<div style="display:flex;align-items:flex-start;gap:12px;padding:16px 0;border-bottom:1px solid #f1f5f9;"><span style="font-size:20px;">🕐</span><div><div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#94a3b8;margin-bottom:3px;">Meeting Time</div><div style="font-weight:600;color:#1e293b;">${m.meeting_time}</div></div></div>` : '',
      m.meeting_location ? `<div style="display:flex;align-items:flex-start;gap:12px;padding:16px 0;border-bottom:1px solid #f1f5f9;"><span style="font-size:20px;">📍</span><div><div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#94a3b8;margin-bottom:3px;">Location</div><div style="font-weight:600;color:#1e293b;">${m.meeting_location}</div></div></div>` : '',
      m.contact_email    ? `<div style="display:flex;align-items:flex-start;gap:12px;padding:16px 0;"><span style="font-size:20px;">✉️</span><div><div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#94a3b8;margin-bottom:3px;">Contact</div><a href="mailto:${m.contact_email}" style="font-weight:600;color:#003F3A;text-decoration:none;">${m.contact_email}</a></div></div>` : ''
    ].filter(Boolean).join('');

    return `
      <div class="wrap" style="max-width:860px;margin:0 auto;padding:48px 24px;">
        <a href="#/ministries" class="btn-link" style="display:inline-flex;align-items:center;gap:6px;margin-bottom:32px;font-size:13px;">&larr; All Ministries</a>

        ${imgHtml}

        <div style="display:grid;grid-template-columns:1fr 300px;gap:40px;align-items:start;">
          <div>
            <h1 style="font-family:'Playfair Display',serif;font-size:clamp(28px,4vw,42px);color:#003F3A;margin:0 0 16px;line-height:1.15;">${m.title}</h1>
            ${m.short_desc ? `<p style="font-size:18px;color:#475569;line-height:1.7;margin:0 0 24px;font-weight:400;">${m.short_desc}</p>` : ''}
            ${m.full_desc  ? `<div style="font-size:15px;color:#374151;line-height:1.8;white-space:pre-wrap;">${m.full_desc}</div>` : ''}
            ${m.contact_email ? `
              <div style="margin-top:36px;">
                <a href="mailto:${m.contact_email}" style="display:inline-flex;align-items:center;gap:8px;background:#003F3A;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;transition:background .2s;">
                  Get Involved &rarr;
                </a>
              </div>` : ''}
          </div>

          ${metaItems ? `
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:8px 20px;">
            <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;padding:16px 0 8px;">Ministry Info</div>
            ${metaItems}
          </div>` : ''}
        </div>

        <div style="margin-top:48px;padding-top:32px;border-top:1px solid #f1f5f9;">
          <a href="#/ministries" class="btn-link">&larr; Back to All Ministries</a>
        </div>
      </div>
    `;
  }

  _renderEvents() {
    let html = `<div class="wrap events-grid-full">`;
    churchData.events.forEach(e => {
      html += `
        <div class="event-card-full">
          <div class="e-content">
            <div class="e-meta" style="margin-bottom: 8px; color: var(--primary-green); font-weight: 600;">${e.date} ${e.month} &bull; ${e.location}</div>
            <h3 style="margin-bottom: 8px;">${e.title}</h3>
            <p>${e.description}</p>
            <a href="#/events/${e.id}" class="btn-link" style="display:inline-block; margin-top:16px;">View Details &rarr;</a>
          </div>
        </div>
      `;
    });
    html += `</div>`;
    return html;
  }

  _renderEventDetails(eventId) {
    const event = churchData.events.find(e => e.id === eventId);
    
    if (!event) {
      return `<div class="wrap text-content"><p>Event not found or has been removed.</p> <a href="#/events" class="btn-link">&larr; Back to Events</a></div>`;
    }

    return `
      <div class="wrap text-content event-details-page">
        <a href="#/" class="btn-link" style="display:inline-block; margin-bottom:24px;">&larr; Back to Home</a>
        <div class="event-details-header">
          <div class="event-date-badge" style="display: inline-block; padding: 12px 16px; background: var(--secondary-gold); color: var(--white); text-align: center; border-radius: 4px; margin-bottom: 16px;">
            <div style="font-size: 24px; font-weight: bold; font-family: 'Playfair Display', serif;">${event.date}</div>
            <div style="font-size: 14px; text-transform: uppercase;">${event.month}</div>
          </div>
          <h2 style="font-family: 'Playfair Display', serif; font-size: 36px; color: var(--primary-maroon); margin-bottom: 16px;">${event.title}</h2>
          <div class="event-meta" style="display: flex; gap: 16px; color: var(--text-color); font-weight: 500; margin-bottom: 32px; flex-wrap: wrap;">
            <span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 4px;"><circle cx="12" cy="10" r="3"/><path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z"/></svg> ${event.location}</span>
            <span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 4px;"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg> ${event.time}</span>
            ${event.category ? `<span><span style="background: var(--light-gold); color: var(--dark-green); padding: 2px 8px; border-radius: 12px; font-size: 12px;">${event.category}</span></span>` : ''}
          </div>
        </div>
        
        ${event.image ? `<img src="${event.image}" alt="${event.title}" style="width: 100%; border-radius: 8px; margin-bottom: 32px;">` : ''}
        
        <div class="event-description" style="font-size: 18px; line-height: 1.8;">
          <p>${event.description}</p>
        </div>
        
        <div class="event-actions" style="margin-top: 40px; padding-top: 24px; border-top: 1px solid var(--cream);">
          ${event.registration_enabled ? `
            <button class="btn btn-solid-maroon" onclick="window.openEventRegistration('${event.id}', '${event.title.replace(/'/g, "\\'")}')">Register Now</button>
          ` : ''}
        </div>
      </div>
    `;
  }

  _bindEventRegistration() {
    window.openEventRegistration = (eventId, eventTitle) => {
      let modal = document.getElementById('event-reg-modal');
      if (modal) modal.remove();

      const html = `
        <div id="event-reg-modal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); z-index:9999; display:flex; align-items:center; justify-content:center;">
          <div style="background:white; padding:32px; border-radius:12px; width:90%; max-width:500px; max-height:90vh; overflow-y:auto; position:relative; box-shadow:0 10px 30px rgba(0,0,0,0.2);">
            <button onclick="document.getElementById('event-reg-modal').remove()" style="position:absolute; top:16px; right:16px; background:none; border:none; font-size:28px; cursor:pointer; line-height:1; color:#64748b;">&times;</button>
            <h2 style="margin-top:0; color:var(--primary-maroon); font-family:'Playfair Display',serif; font-size:24px; margin-bottom:8px;">Register for Event</h2>
            <p style="color:#64748b; margin-bottom:24px; font-weight:600;">${eventTitle}</p>
            
            <form id="event-reg-form" style="display:flex; flex-direction:column; gap:16px;">
              <div>
                <label style="display:block; font-weight:600; font-size:14px; margin-bottom:6px; color:#374151;">Full Name *</label>
                <input type="text" name="full_name" required style="width:100%; padding:10px 12px; border:1px solid #d1d5db; border-radius:6px; font-family:inherit;">
              </div>
              <div>
                <label style="display:block; font-weight:600; font-size:14px; margin-bottom:6px; color:#374151;">Email Address *</label>
                <input type="email" name="email" required style="width:100%; padding:10px 12px; border:1px solid #d1d5db; border-radius:6px; font-family:inherit;">
              </div>
              <div>
                <label style="display:block; font-weight:600; font-size:14px; margin-bottom:6px; color:#374151;">Phone Number *</label>
                <input type="tel" name="phone" required style="width:100%; padding:10px 12px; border:1px solid #d1d5db; border-radius:6px; font-family:inherit;">
              </div>
              <div>
                <label style="display:block; font-weight:600; font-size:14px; margin-bottom:6px; color:#374151;">Number of Attendees</label>
                <input type="number" name="attendee_count" min="1" value="1" required style="width:100%; padding:10px 12px; border:1px solid #d1d5db; border-radius:6px; font-family:inherit;">
              </div>
              <div>
                <label style="display:block; font-weight:600; font-size:14px; margin-bottom:6px; color:#374151;">Additional Notes (Optional)</label>
                <textarea name="notes" rows="3" style="width:100%; padding:10px 12px; border:1px solid #d1d5db; border-radius:6px; font-family:inherit; resize:vertical;"></textarea>
              </div>
              
              <div id="reg-msg" style="display:none; padding:12px; border-radius:6px; font-size:14px; margin-top:8px;"></div>
              
              <button type="submit" class="btn btn-solid-maroon" style="width:100%; margin-top:8px;">Submit Registration</button>
            </form>
          </div>
        </div>
      `;

      document.body.insertAdjacentHTML('beforeend', html);
      
      const form = document.getElementById('event-reg-form');
      const msg = document.getElementById('reg-msg');
      const btn = form.querySelector('button[type="submit"]');
      
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        btn.textContent = 'Submitting...';
        btn.disabled = true;
        msg.style.display = 'none';
        
        try {
          const res = await fetch(`/api/events/${eventId}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              full_name: form.full_name.value,
              email: form.email.value,
              phone: form.phone.value,
              attendee_count: form.attendee_count.value,
              notes: form.notes.value
            })
          });
          
          const data = await res.json();
          
          if (res.ok) {
            msg.style.display = 'block';
            msg.style.backgroundColor = '#dcfce7';
            msg.style.color = '#166534';
            msg.textContent = 'Registration successful! Thank you.';
            form.reset();
            setTimeout(() => {
              const m = document.getElementById('event-reg-modal');
              if (m) m.remove();
            }, 2500);
          } else {
            throw new Error(data.error || 'Failed to register.');
          }
        } catch (err) {
          msg.style.display = 'block';
          msg.style.backgroundColor = '#fee2e2';
          msg.style.color = '#991b1b';
          msg.textContent = err.message;
          btn.textContent = 'Submit Registration';
          btn.disabled = false;
        }
      });
    };
  }


  _renderGive() {
    let html = `<div id="give-dynamic-app"></div>`;
    
    setTimeout(() => {
      new GiveSection('#give-dynamic-app');
    }, 50);

    return html;
  }

  _renderContact() {
    return `
      <div class="wrap contact-page-grid">
        <div class="cp-info">
          <h2>Get in Touch</h2>
          <p>We would love to hear from you. Whether you have a prayer request, a question about our ministries, or need pastoral care, please reach out.</p>
          
          <div class="cp-details">
            <div class="cp-item">
              <strong>Address</strong>
              <p>Plot No. 61/A, St. Mary's Road,<br>Regimental Bazaar / Shivaji Nagar,<br>Secunderabad, Telangana 500003</p>
            </div>
            <div class="cp-item">
              <strong>Phone</strong>
              <p>+91 040-XXXXXXX</p>
            </div>
            <div class="cp-item">
              <strong>Email</strong>
              <p>support@cbcsecbad.in</p>
            </div>
          </div>
        </div>
        <div class="cp-form">
           <div class="contact-form-wrapper-page">
              <p><em>Please use the contact form on our homepage.</em></p>
           </div>
        </div>
      </div>
    `;
  }

  // ─── SUNDAY WORSHIP ───────────────────────────────────────────────────────
  _renderSundayWorship() {
    return `
      <style>
        .sw-intro { max-width: 720px; margin: 0 auto 60px; text-align: center; padding: 0 20px; }
        .sw-intro h2 { font-family: 'Playfair Display', serif; font-size: 32px; color: var(--primary-green, #003F3A); margin-bottom: 12px; }
        .sw-intro p { color: #4b5563; font-size: 16px; line-height: 1.7; }
        .sw-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 24px; max-width: 1100px; margin: 0 auto 60px; padding: 0 20px; }
        .sw-card { background: white; border: 1px solid #e5e7eb; border-radius: 16px; padding: 28px 24px; box-shadow: 0 2px 12px rgba(0,0,0,0.05); }
        .sw-card-icon { font-size: 32px; margin-bottom: 14px; }
        .sw-card h3 { font-family: 'Playfair Display', serif; font-size: 18px; color: #003F3A; margin: 0 0 8px; }
        .sw-card p { font-size: 14px; color: #6b7280; line-height: 1.6; margin: 0; }
        .sw-expect { background: #003F3A; color: white; padding: 60px 24px; text-align: center; }
        .sw-expect h2 { font-family: 'Playfair Display', serif; font-size: 30px; margin: 0 0 40px; }
        .sw-expect-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 28px; max-width: 900px; margin: 0 auto; }
        .sw-expect-item { text-align: center; }
        .sw-expect-item .icon { font-size: 36px; margin-bottom: 12px; }
        .sw-expect-item h4 { font-size: 15px; font-weight: 700; margin: 0 0 6px; }
        .sw-expect-item p { font-size: 13px; opacity: 0.8; margin: 0; line-height: 1.5; }
        .sw-cta { text-align: center; padding: 60px 24px; }
        .sw-cta h2 { font-family: 'Playfair Display', serif; font-size: 28px; color: #003F3A; margin-bottom: 12px; }
        .sw-cta p { color: #6b7280; margin-bottom: 24px; }
        .sw-btn { display: inline-block; background: #9B1023; color: white; padding: 13px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px; transition: 0.2s; }
        .sw-btn:hover { background: #7A0C1C; }
      </style>

      <div class="sw-intro">
        <h2>Join Us Every Sunday</h2>
        <p>We gather every Sunday as a family to worship God through prayer, praise, and the preaching of His Word. All are welcome — come as you are.</p>
      </div>

      <div class="sw-cards">
        <div class="sw-card">
          <div class="sw-card-icon">🕖</div>
          <h3>Early Morning Service</h3>
          <p><strong>7:00 AM</strong><br>Main Sanctuary<br>Telugu Medium</p>
        </div>
        <div class="sw-card">
          <div class="sw-card-icon">⛪</div>
          <h3>Chapel Service</h3>
          <p><strong>7:00 AM</strong><br>Chapel Hall<br>English / Hindi</p>
        </div>
        <div class="sw-card">
          <div class="sw-card-icon">🕘</div>
          <h3>Morning Service</h3>
          <p><strong>9:30 AM</strong><br>Main Sanctuary<br>English Medium</p>
        </div>
        <div class="sw-card">
          <div class="sw-card-icon">🌆</div>
          <h3>Evening Service</h3>
          <p><strong>6:30 PM</strong><br>Main Sanctuary<br>Telugu / English</p>
        </div>
      </div>

      <div class="sw-expect">
        <h2>What to Expect</h2>
        <div class="sw-expect-grid">
          <div class="sw-expect-item">
            <div class="icon">🎵</div>
            <h4>Worship</h4>
            <p>Contemporary and traditional hymns led by our worship team</p>
          </div>
          <div class="sw-expect-item">
            <div class="icon">📖</div>
            <h4>Bible Message</h4>
            <p>Expository preaching from God's Word, relevant for today</p>
          </div>
          <div class="sw-expect-item">
            <div class="icon">🙏</div>
            <h4>Prayer</h4>
            <p>Corporate and personal prayer time throughout the service</p>
          </div>
          <div class="sw-expect-item">
            <div class="icon">👨‍👩‍👧</div>
            <h4>Children's Church</h4>
            <p>Age-appropriate programs during the 9:30 AM service</p>
          </div>
          <div class="sw-expect-item">
            <div class="icon">☕</div>
            <h4>Fellowship</h4>
            <p>Coffee and snacks after service — meet the community!</p>
          </div>
        </div>
      </div>

      <div class="sw-cta">
        <h2>Planning Your First Visit?</h2>
        <p>We'd love to welcome you. Reach out and we'll help you find the right service.</p>
        <a href="#/visit/contact" class="sw-btn">Contact Us</a>
      </div>
    `;
  }

  // ─── WATCH LIVE ───────────────────────────────────────────────────────────
  _renderWatchLive() {
    return `
      <style>
        .wl-wrap { max-width: 860px; margin: 0 auto; padding: 0 20px 60px; }
        .wl-intro { text-align: center; margin-bottom: 36px; }
        .wl-intro h2 { font-family: 'Playfair Display', serif; font-size: 30px; color: #003F3A; margin-bottom: 10px; }
        .wl-intro p { color: #6b7280; font-size: 16px; max-width: 560px; margin: 0 auto; line-height: 1.7; }

        .wl-banner {
          background: linear-gradient(135deg, #003F3A 0%, #005F58 60%, #007A70 100%);
          border-radius: 20px;
          padding: 60px 32px;
          text-align: center;
          margin-bottom: 36px;
          position: relative;
          overflow: hidden;
        }
        .wl-banner::before {
          content: '';
          position: absolute;
          inset: 0;
          background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }
        .wl-play-icon {
          width: 80px; height: 80px;
          background: rgba(255,255,255,0.15);
          border: 3px solid rgba(255,255,255,0.4);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 20px;
          position: relative; z-index: 1;
        }
        .wl-play-icon svg { margin-left: 5px; }
        .wl-banner h3 { color: white; font-family: 'Playfair Display', serif; font-size: 26px; margin: 0 0 8px; position: relative; z-index: 1; }
        .wl-banner p { color: rgba(255,255,255,0.75); font-size: 14px; margin: 0 0 28px; position: relative; z-index: 1; }
        .wl-banner-btns { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; position: relative; z-index: 1; }
        .wl-btn-primary {
          display: inline-flex; align-items: center; gap: 8px;
          background: white; color: #003F3A;
          padding: 13px 28px; border-radius: 8px;
          text-decoration: none; font-weight: 700; font-size: 14px; transition: 0.2s;
        }
        .wl-btn-primary:hover { background: #f0fdf4; }
        .wl-btn-red {
          display: inline-flex; align-items: center; gap: 8px;
          background: #FF0000; color: white;
          padding: 13px 28px; border-radius: 8px;
          text-decoration: none; font-weight: 700; font-size: 14px; transition: 0.2s;
        }
        .wl-btn-red:hover { background: #cc0000; }

        .wl-section-title { font-family: 'Playfair Display', serif; font-size: 22px; color: #003F3A; text-align: center; margin: 0 0 24px; }
        .wl-info-row { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; margin-bottom: 40px; }
        .wl-info-card { background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; text-align: center; }
        .wl-info-icon { font-size: 28px; margin-bottom: 10px; }
        .wl-info-card h4 { font-size: 13px; font-weight: 700; color: #003F3A; margin: 0 0 4px; }
        .wl-info-card .wl-time { font-size: 20px; font-weight: 800; color: #9B1023; margin-bottom: 4px; }
        .wl-info-card p { font-size: 12px; color: #9ca3af; margin: 0; }

        .wl-tip { background: #FFF8E7; border: 1px solid #F6CC6E; border-radius: 12px; padding: 18px 22px; display: flex; gap: 12px; align-items: flex-start; margin-bottom: 0; }
        .wl-tip-icon { font-size: 20px; flex-shrink: 0; }
        .wl-tip p { margin: 0; font-size: 14px; color: #92400e; line-height: 1.6; }
        .wl-tip strong { color: #78350f; }
      </style>

      <div class="wl-wrap">
        <div class="wl-intro">
          <h2>📺 Watch Live</h2>
          <p>Can't join us in person? Watch our Sunday services live on YouTube. Worship with us from wherever you are.</p>
        </div>

        <div class="wl-banner">
          <div class="wl-play-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          </div>
          <h3>Centenary Baptist Church — Live</h3>
          <p>@centenarybaptistchurch6147 &nbsp;·&nbsp; 7.95K Subscribers &nbsp;·&nbsp; 1.2K Videos</p>
          <div class="wl-banner-btns">
            <a href="https://www.youtube.com/@centenarybaptistchurch6147/live" target="_blank" class="wl-btn-primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              Watch Live Now
            </a>
            <a href="https://www.youtube.com/@centenarybaptistchurch6147" target="_blank" class="wl-btn-red">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.7 15.5V8.5l6.3 3.5-6.3 3.5z"/></svg>
              Subscribe on YouTube
            </a>
          </div>
        </div>

        <h3 class="wl-section-title">Live Service Schedule</h3>
        <div class="wl-info-row">
          <div class="wl-info-card">
            <div class="wl-info-icon">🕖</div>
            <h4>Early Service</h4>
            <div class="wl-time">7:00 AM</div>
            <p>Sunday · Telugu</p>
          </div>
          <div class="wl-info-card">
            <div class="wl-info-icon">⛪</div>
            <h4>Chapel Service</h4>
            <div class="wl-time">7:00 AM</div>
            <p>Sunday · English</p>
          </div>
          <div class="wl-info-card">
            <div class="wl-info-icon">🕘</div>
            <h4>Morning Service</h4>
            <div class="wl-time">9:30 AM</div>
            <p>Sunday · English</p>
          </div>
          <div class="wl-info-card">
            <div class="wl-info-icon">🌆</div>
            <h4>Evening Service</h4>
            <div class="wl-time">6:30 PM</div>
            <p>Sunday · Telugu</p>
          </div>
        </div>

        <div class="wl-tip">
          <div class="wl-tip-icon">💡</div>
          <p><strong>Tip:</strong> Click "Watch Live Now" just before the service time. If the stream hasn't started yet, YouTube will notify you as soon as it goes live. You can also browse our <strong>past sermons</strong> and messages on the channel anytime.</p>
        </div>
      </div>
    `;
  }


  // ─── PRAYER PAGE ─────────────────────────────────────────────────────────

  _renderPrayer() {
    return `
      <style>
        .pr-wrap { max-width: 900px; margin: 0 auto; padding: 0 20px 60px; }
        .pr-verse { background: #003F3A; color: white; border-radius: 16px; padding: 36px 32px; text-align: center; margin-bottom: 48px; }
        .pr-verse blockquote { font-family: 'Playfair Display', serif; font-size: 22px; font-style: italic; margin: 0 0 12px; line-height: 1.5; }
        .pr-verse cite { font-size: 13px; color: #C9A84C; font-weight: 600; letter-spacing: 1px; }
        .pr-section-title { font-family: 'Playfair Display', serif; font-size: 26px; color: #003F3A; text-align: center; margin: 0 0 28px; }
        .pr-times { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 20px; margin-bottom: 48px; }
        .pr-time-card { background: white; border: 1px solid #e5e7eb; border-left: 4px solid #C9A84C; border-radius: 12px; padding: 22px; }
        .pr-time-card h4 { font-size: 15px; font-weight: 700; color: #003F3A; margin: 0 0 6px; }
        .pr-time-card .time { font-size: 18px; font-weight: 700; color: #9B1023; margin-bottom: 4px; }
        .pr-time-card p { font-size: 13px; color: #6b7280; margin: 0; }
        .pr-focus { background: #F8F7F2; border-radius: 16px; padding: 36px 32px; margin-bottom: 48px; }
        .pr-focus h3 { font-family: 'Playfair Display', serif; font-size: 22px; color: #003F3A; text-align: center; margin: 0 0 24px; }
        .pr-focus-list { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .pr-focus-list li { display: flex; align-items: flex-start; gap: 10px; font-size: 14px; color: #374151; line-height: 1.5; }
        .pr-focus-list li::before { content: "🙏"; flex-shrink: 0; }
        .pr-contact { text-align: center; padding: 40px 20px; background: white; border: 1px solid #e5e7eb; border-radius: 16px; }
        .pr-contact h3 { font-family: 'Playfair Display', serif; font-size: 22px; color: #003F3A; margin: 0 0 10px; }
        .pr-contact p { color: #6b7280; margin: 0 0 20px; }
        .pr-btn { display: inline-block; background: #003F3A; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px; transition: 0.2s; }
        .pr-btn:hover { background: #005F58; }
        @media (max-width: 600px) { .pr-focus-list { grid-template-columns: 1fr; } }
      </style>

      <div class="pr-wrap">
        <div class="pr-verse">
          <blockquote>"Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God."</blockquote>
          <cite>— Philippians 4:6</cite>
        </div>

        <h2 class="pr-section-title">Prayer Gatherings</h2>
        <div class="pr-times">
          <div class="pr-time-card">
            <h4>Sunday Morning Prayer</h4>
            <div class="time">6:30 AM</div>
            <p>Before each morning service. Main Sanctuary.</p>
          </div>
          <div class="pr-time-card">
            <h4>Wednesday Prayer Meeting</h4>
            <div class="time">6:30 PM</div>
            <p>Midweek corporate prayer. Chapel Hall.</p>
          </div>
          <div class="pr-time-card">
            <h4>Friday Prayer Night</h4>
            <div class="time">7:00 PM</div>
            <p>Extended worship and intercession. Main Sanctuary.</p>
          </div>
          <div class="pr-time-card">
            <h4>Women's Prayer Circle</h4>
            <div class="time">Saturdays 8:00 AM</div>
            <p>Ladies prayer fellowship. Women's Hall.</p>
          </div>
        </div>

        <div class="pr-focus">
          <h3>🙏 This Week's Prayer Focus</h3>
          <ul class="pr-focus-list">
            <li>Our nation, leaders, and communities</li>
            <li>Church growth and new believers</li>
            <li>The sick and those in need of healing</li>
            <li>Our missionaries in the field</li>
            <li>Youth and children in our congregation</li>
            <li>Families going through hardship</li>
            <li>Revival in the church and city</li>
            <li>Outreach and evangelism efforts</li>
          </ul>
        </div>

        <div class="pr-contact">
          <h3>Submit a Prayer Request</h3>
          <p>We believe in the power of prayer. Share your request and our prayer team will lift you up in prayer.</p>
          <a href="#/visit/contact" class="pr-btn">Send a Prayer Request</a>
        </div>
      </div>
    `;
  }
}
