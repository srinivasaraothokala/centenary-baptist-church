import { PageRenderer } from './pages/PageRenderer.js';
import { ContactForm } from './components/ContactForm.js';
import { FirstTimeVisitorModal } from './components/VisitorModal.js';
import { FaithfulnessTimeline } from './components/FaithfulnessTimeline.js';
import { AdminEvents } from './admin/AdminEvents.js';
import { AdminDonations } from './admin/AdminDonations.js';
import { AdminContacts } from './admin/AdminContacts.js';
import { AdminDashboard } from './admin/AdminDashboard.js';
import { AdminGallery } from './admin/AdminGallery.js';
import { AdminSermons } from './admin/AdminSermons.js';
import { AdminLogin } from './admin/AdminLogin.js';
import { AdminUsers } from './admin/AdminUsers.js';
import { AdminSiteSettings } from './admin/AdminSiteSettings.js';
import { AdminMinistries } from './admin/AdminMinistries.js';
import { AdminCampus } from './admin/AdminCampus.js';
import { AdminMedia } from './admin/AdminMedia.js';
import { AdminAuditLogs } from './admin/AdminAuditLogs.js';
import { AdminLeadership } from './admin/AdminLeadership.js';
import { GalleryPage } from './pages/GalleryPage.js';
import { supabaseClient } from './supabaseFrontendClient.js';

export class Router {
  constructor() {
    this.homepageView = document.getElementById('homepage-view');
    this.pageContentContainer = document.getElementById('page-content');
    this.mainHeader = document.querySelector('header');
    this.mainFooter = document.querySelector('footer');
    this.topBar = document.querySelector('.top-bar');
    this.renderer = new PageRenderer('page-content');
    this.adminEvents = new AdminEvents('page-content');
    this.adminDonations = new AdminDonations('page-content');
    this.adminContacts = new AdminContacts('page-content');
    this.adminDashboard = new AdminDashboard('page-content');
    this.adminGallery = new AdminGallery('page-content');
    this.adminSermons = new AdminSermons('page-content');
    this.adminLogin = new AdminLogin('page-content');
    this.adminUsers = new AdminUsers('page-content');
    this.adminSiteSettings = new AdminSiteSettings('page-content');
    this.adminMinistries = new AdminMinistries('page-content');
    this.adminCampus = new AdminCampus('page-content');
    this.adminMedia = new AdminMedia('page-content');
    this.adminAuditLogs = new AdminAuditLogs('page-content');
    this.adminLeadership = new AdminLeadership('page-content');
    this.galleryPage = new GalleryPage('page-content');
    
    // Bind routing events
    window.addEventListener('hashchange', () => this.handleRoute());
    
    // Initial route check
    this.handleRoute();

    // Listen for auth state changes
    supabaseClient.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' && window.location.hash.startsWith('#/admin')) {
        window.location.hash = '#/admin/login';
      }
    });
  }

  async handleRoute() {
    const hash = window.location.hash || '#/';
    
    // Always scroll to top when navigating
    window.scrollTo(0, 0);
    
    // Action overrides for modals
    if (hash === '#/visit/new-here') {
      window.history.replaceState(null, null, ' '); // Clear hash
      const visitorModal = new FirstTimeVisitorModal();
      visitorModal.open();
      return;
    }

    if (hash === '#/' || hash === '#' || hash === '') {
      this.showHomepage();
    } else if (hash.startsWith('#/admin')) {
      await this.showAdmin(hash);
    } else {
      this.showInternalPage(hash.replace('#', ''));
    }
  }

  async showAdmin(hash) {
    this.homepageView.style.display = 'none';
    this.pageContentContainer.style.display = 'block';
    if (this.mainHeader) this.mainHeader.style.display = 'none';
    if (this.mainFooter) this.mainFooter.style.display = 'none';
    if (this.topBar) this.topBar.style.display = 'none';

    if (hash === '#/admin/logout') {
      await supabaseClient.auth.signOut();
      window.location.hash = '#/admin/login';
      return;
    }

    if (hash === '#/admin/login') {
      this.adminLogin.render();
      return;
    }

    // Protect all admin routes — require login
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
      window.location.hash = '#/admin/login';
      return;
    }

    const role = session.user?.user_metadata?.role || 'admin';

    // Super Admin only — Admin Users page
    if (hash === '#/admin/users') {
      if (role !== 'super_admin') {
        this.pageContentContainer.innerHTML = `
          <div style="
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Inter', sans-serif;
            background: #F8F9F7;
          ">
            <div style="
              background: white;
              border-radius: 20px;
              padding: 60px 48px;
              text-align: center;
              box-shadow: 0 8px 40px rgba(0,0,0,0.08);
              max-width: 480px;
              width: 90%;
            ">
              <div style="
                width: 80px; height: 80px;
                background: #fee2e2;
                border-radius: 50%;
                display: flex; align-items: center; justify-content: center;
                margin: 0 auto 24px;
              ">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <h2 style="
                font-family: 'Playfair Display', serif;
                font-size: 28px;
                color: #111827;
                margin: 0 0 12px 0;
              ">Access Denied</h2>
              <p style="color: #6b7280; font-size: 15px; line-height: 1.6; margin: 0 0 8px 0;">
                You don't have permission to access <strong>Admin Users</strong>.
              </p>
              <p style="color: #9ca3af; font-size: 13px; margin: 0 0 32px 0;">
                This section is restricted to <strong style="color:#b47a18;">Super Admins</strong> only.
                Please contact your Super Admin if you need access.
              </p>
              <a href="#/admin" style="
                display: inline-flex;
                align-items: center;
                gap: 8px;
                background: #003F3A;
                color: white;
                text-decoration: none;
                padding: 12px 28px;
                border-radius: 8px;
                font-weight: 600;
                font-size: 14px;
                transition: background 0.2s;
              ">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
                Back to Dashboard
              </a>
            </div>
          </div>
        `;
        return;
      }
      this.adminUsers.render(session);
      return;
    }

    // Super Admin only — Site Settings page
    if (hash === '#/admin/settings') {
      if (role !== 'super_admin') {
        this.pageContentContainer.innerHTML = `
          <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:'Inter',sans-serif;background:#F8F9F7;">
            <div style="background:white;border-radius:20px;padding:60px 48px;text-align:center;box-shadow:0 8px 40px rgba(0,0,0,0.08);max-width:480px;width:90%;">
              <div style="width:80px;height:80px;background:#fee2e2;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 24px;">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </div>
              <h2 style="font-family:'Playfair Display',serif;font-size:28px;color:#111827;margin:0 0 12px;">Access Denied</h2>
              <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 8px;">You don't have permission to access <strong>Site Settings</strong>.</p>
              <p style="color:#9ca3af;font-size:13px;margin:0 0 32px;">This section is restricted to <strong style="color:#b47a18;">Super Admins</strong> only.</p>
              <a href="#/admin" style="display:inline-flex;align-items:center;gap:8px;background:#003F3A;color:white;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:14px;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
                Back to Dashboard
              </a>
            </div>
          </div>
        `;
        return;
      }
      this.adminSiteSettings.render();
      return;
    }

    if (hash === '#/admin/donations') {
      this.adminDonations.render();
    } else if (hash === '#/admin/contacts') {
      this.adminContacts.render();
    } else if (hash === '#/admin/events') {
      this.adminEvents.render();
    } else if (hash === '#/admin/gallery') {
      this.adminGallery.render();
    } else if (hash === '#/admin/sermons') {
      this.adminSermons.render();
    } else if (hash === '#/admin/ministries') {
      this.adminMinistries.render();
    } else if (hash === '#/admin/campus') {
      this.adminCampus.render();
    } else if (hash === '#/admin/media') {
      this.adminMedia.render();
    } else if (hash === '#/admin/logs') {
      this.adminAuditLogs.render();
    } else if (hash === '#/admin/leadership') {
      this.adminLeadership.render();
    } else {
      this.adminDashboard.render();
    }
  }

  showHomepage() {
    this.pageContentContainer.style.display = 'none';
    this.homepageView.style.display = 'block';
    if (this.mainHeader) this.mainHeader.style.display = 'block';
    if (this.mainFooter) this.mainFooter.style.display = 'block';
    if (this.topBar) this.topBar.style.display = 'block';
    
    // Re-bind homepage forms if necessary (already bound in main.js on DOMContentLoaded, so this is fine)
  }

  showInternalPage(path) {
    this.homepageView.style.display = 'none';
    this.pageContentContainer.style.display = 'block';
    if (this.mainHeader) this.mainHeader.style.display = 'block';
    if (this.mainFooter) this.mainFooter.style.display = 'block';
    if (this.topBar) this.topBar.style.display = 'block';

    // Gallery — own full-page layout (hero + grid + lightbox)
    if (path === '/gallery') {
      this.galleryPage.render();
      return;
    }

    // Render the specific page content
    this.renderer.render(path);
    
    // Special case: if it's the contact page, bind the contact form
    if (path === '/visit/contact' || path === '/visit' || path === '/visit/plan') {
      setTimeout(() => {
        const contactWrapper = this.pageContentContainer.querySelector('.contact-form-wrapper-page');
        if (contactWrapper) {
          contactWrapper.innerHTML = '';
          new ContactForm('.contact-form-wrapper-page');
        }
      }, 50);
    }
    
    // Special case: initialize the FaithfulnessTimeline if it exists on the rendered page
    setTimeout(() => {
      if (document.getElementById('about-faithfulness-timeline')) {
        new FaithfulnessTimeline('#about-faithfulness-timeline');
      }
    }, 50);
  }
}
