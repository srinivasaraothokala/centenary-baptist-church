/**
 * MemberLayout.js
 * Generates the member portal sidebar + main shell.
 * Pattern mirrors AdminLayout.js exactly.
 */
import './member.css';

export class MemberLayout {
  /**
   * @param {string} activeHash - current hash e.g. '#/member/dashboard'
   * @param {string} pageTitle  - title shown in topbar
   * @param {string} content    - inner HTML for mp-content
   * @param {Object} user       - { firstName, lastName, email }
   */
  static getLayout(activeHash, pageTitle, content, user = {}) {
    const firstName = user.firstName || 'Member';
    const lastName  = user.lastName  || '';
    const email     = user.email     || '';
    const initials  = (firstName[0] || '') + (lastName[0] || '');
    const fullName  = `${firstName} ${lastName}`.trim();

    const isActive = (hash) => activeHash === hash ? 'active' : '';
    const navItem  = (hash, label, iconPath, extraClass = '') => `
      <a href="${hash}" class="${isActive(hash)} ${extraClass}">
        <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
          ${iconPath}
        </svg>
        ${label}
      </a>`;

    return `
      <div class="mp-wrapper" id="mp-wrapper">
        <!-- Mobile overlay -->
        <div class="mp-sidebar-overlay" id="mp-overlay"></div>

        <!-- Sidebar -->
        <aside class="mp-sidebar" id="mp-sidebar">
          <div class="mp-sidebar-header">
            <img src="/logo-150.png" alt="CBC Logo" class="mp-sidebar-logo" onerror="this.style.display='none'">
            <div class="mp-sidebar-brand">
              <h1>CENTENARY<br>BAPTIST CHURCH</h1>
              <span>Member Portal</span>
            </div>
          </div>

          <!-- Member identity -->
          <div class="mp-member-card">
            <div class="mp-member-avatar">${initials.toUpperCase() || '?'}</div>
            <div class="mp-member-name">${fullName || 'Welcome'}</div>
            <div class="mp-member-email">${email}</div>
          </div>

          <!-- Navigation -->
          <nav class="mp-nav">
            <div class="mp-nav-section-label">Main</div>
            ${navItem('#/member/dashboard', 'Dashboard',
              '<path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>')}

            <div class="mp-nav-section-label">My Family</div>
            ${navItem('#/member/profile', 'My Profile',
              '<path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>')}
            <div class="mp-nav-sub">
              ${navItem('#/member/family', 'Family Members',
                '<path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>')}
            </div>

            <div class="mp-nav-section-label">Membership</div>
            <a href="#/member/membership" class="soon ${isActive('#/member/membership')}">
              <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12zM6 10h2v2H6zm0 4h8v2H6zm10 0h2v2h-2zm-6-4h8v2h-8z"/>
              </svg>
              Membership
              <span class="mp-nav-badge">Soon</span>
            </a>
            <a href="#/member/requests" class="soon ${isActive('#/member/requests')}">
              <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
              </svg>
              Requests
              <span class="mp-nav-badge">Soon</span>
            </a>

            <div class="mp-nav-section-label">Account</div>
            ${navItem('#/member/settings', 'Settings',
              '<path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .43-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.49-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>')}
            <a href="#/member/logout" id="mp-logout-btn">
              <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
              </svg>
              Logout
            </a>
          </nav>

          <div class="mp-sidebar-footer">
            Est. 1875<br>
            "We Preach Christ Crucified"<br>
            <span style="font-size:10px;font-family:'Inter',sans-serif;">1 Cor. 1:23</span>
          </div>
        </aside>

        <!-- Main Content -->
        <main class="mp-main">
          <div class="mp-topbar">
            <div class="mp-topbar-left">
              <button class="mp-hamburger" id="mp-hamburger" aria-label="Toggle menu">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M3 12h18M3 6h18M3 18h18"/>
                </svg>
              </button>
              <h2 class="mp-topbar-page-title">${pageTitle}</h2>
            </div>
            <div class="mp-topbar-right">
              <div class="mp-topbar-user">
                <div class="mp-topbar-avatar">${(initials || '?').toUpperCase()}</div>
                <span class="mp-topbar-name">${firstName}</span>
              </div>
            </div>
          </div>

          <div class="mp-content">
            ${content}
          </div>
        </main>
      </div>

      <!-- Toast container -->
      <div class="mp-toast" id="mp-toast"></div>
    `;
  }

  /** Wire the hamburger + overlay for mobile sidebar toggle */
  static wireLayout() {
    const hamburger = document.getElementById('mp-hamburger');
    const sidebar   = document.getElementById('mp-sidebar');
    const overlay   = document.getElementById('mp-overlay');

    if (!hamburger || !sidebar || !overlay) return;

    const open  = () => { sidebar.classList.add('open'); overlay.classList.add('visible'); };
    const close = () => { sidebar.classList.remove('open'); overlay.classList.remove('visible'); };

    hamburger.addEventListener('click', open);
    overlay.addEventListener('click', close);

    // Close sidebar when a nav link is clicked (mobile)
    sidebar.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        if (window.innerWidth <= 768) close();
      });
    });
  }

  /** Show a toast notification */
  static showToast(message, type = 'success') {
    const toast = document.getElementById('mp-toast');
    if (!toast) return;
    toast.textContent = message;
    toast.className   = `mp-toast mp-toast-${type} show`;
    clearTimeout(MemberLayout._toastTimer);
    MemberLayout._toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 3500);
  }
}
