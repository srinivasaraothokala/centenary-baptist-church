import './VisitorModal.css';
import { visitorService } from '../services/visitorService.js';

export class FirstTimeVisitorModal {
  constructor() {
    this.createDOM();
    this.bindEvents();
  }

  createDOM() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'visitor-modal-overlay';
    this.overlay.setAttribute('role', 'dialog');
    this.overlay.setAttribute('aria-modal', 'true');
    this.overlay.setAttribute('aria-labelledby', 'vm-title');

    const html = `
      <div class="visitor-modal">
        <button class="vm-close" aria-label="Close modal">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
        <div class="vm-image-col">
          <img src="/modal_church.jpg" alt="Centenary Baptist Church exterior — a beautiful historic stone church building" onerror="this.style.display='none'" />
          <div class="vm-image-overlay">
            <span class="vm-overlay-welcome">Welcome Home</span>
            <h3 class="vm-overlay-title">Centenary Baptist Church</h3>
            <hr class="vm-overlay-divider" />
            <p class="vm-overlay-sub">Est. 1875</p>
          </div>
        </div>
        <div class="vm-form-col">
          <div class="vm-form-container">
            <div class="vm-header">
              <div class="vm-header-eyebrow">
                <span class="vm-header-line"></span>
                <span>Plan Your Visit</span>
              </div>
              <h2 id="vm-title">Welcome, We're Glad You're Here</h2>
              <p>We'd love to get to know you and help you feel at home at Centenary Baptist Church.</p>
            </div>
            
            <form id="visitor-form" class="vm-form" novalidate>
              <div class="vm-row">
                <div class="vm-group" id="group-fname">
                  <label for="vm-fname">First Name <span>*</span></label>
                  <input type="text" id="vm-fname" class="vm-input" placeholder="e.g. John" required />
                  <span class="vm-error">Please enter your first name.</span>
                </div>
                <div class="vm-group" id="group-lname">
                  <label for="vm-lname">Last Name</label>
                  <input type="text" id="vm-lname" class="vm-input" placeholder="e.g. Doe" />
                </div>
              </div>

              <div class="vm-row">
                <div class="vm-group" id="group-phone">
                  <label for="vm-phone">Phone Number <span>*</span></label>
                  <input type="tel" id="vm-phone" class="vm-input" placeholder="e.g. 9876543210" required />
                  <span class="vm-error">Please enter a valid phone number.</span>
                </div>
                <div class="vm-group" id="group-email">
                  <label for="vm-email">Email Address</label>
                  <input type="email" id="vm-email" class="vm-input" placeholder="e.g. john@example.com" />
                  <span class="vm-error">Please enter a valid email address.</span>
                </div>
              </div>

              <div class="vm-group" style="margin-bottom: 20px;">
                <label for="vm-city">City / Area</label>
                <input type="text" id="vm-city" class="vm-input" placeholder="e.g. Secunderabad" />
              </div>

              <div class="vm-group" style="margin-bottom: 20px;">
                <label for="vm-heard">How did you hear about us?</label>
                <select id="vm-heard" class="vm-select">
                  <option value="" disabled selected>Select an option</option>
                  <option value="friend">A friend or family member</option>
                  <option value="google">Google / Search</option>
                  <option value="social">Social Media</option>
                  <option value="event">Church Event</option>
                  <option value="invite">Someone invited me</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div class="vm-group" style="margin-bottom: 32px;">
                <label for="vm-intent">Are you planning to visit us?</label>
                <select id="vm-intent" class="vm-select">
                  <option value="" disabled selected>Select an option</option>
                  <option value="this_sunday">Yes, this Sunday</option>
                  <option value="soon">Yes, sometime soon</option>
                  <option value="exploring">I'm just exploring</option>
                </select>
              </div>

              <button type="submit" class="vm-submit" id="vm-submit-btn">
                I'M PLANNING TO VISIT
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
              </button>
              <div id="vm-submit-error" role="alert" aria-live="polite" style="display:none;margin-top:14px;padding:10px 14px;background:#fef2f2;border:1px solid #fecaca;border-radius:6px;color:#b91c1c;font-size:13px;line-height:1.5;"></div>
            </form>
          </div>
        </div>
      </div>
    `;

    this.overlay.innerHTML = html;
    document.body.appendChild(this.overlay);

    this.form = this.overlay.querySelector('#visitor-form');
    this.closeBtn = this.overlay.querySelector('.vm-close');
    this.formContainer = this.overlay.querySelector('.vm-form-container');
    this.submitBtn = this.overlay.querySelector('#vm-submit-btn');

    // Inputs
    this.inputs = {
      fname: this.overlay.querySelector('#vm-fname'),
      lname: this.overlay.querySelector('#vm-lname'),
      phone: this.overlay.querySelector('#vm-phone'),
      email: this.overlay.querySelector('#vm-email'),
      city: this.overlay.querySelector('#vm-city'),
      heard: this.overlay.querySelector('#vm-heard'),
      intent: this.overlay.querySelector('#vm-intent'),
    };
  }

  bindEvents() {
    this.closeBtn.addEventListener('click', () => this.close());
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.close();
    });
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });

    this.form.addEventListener('submit', (e) => this.handleSubmit(e));

    // Clear validation error on input
    Object.values(this.inputs).forEach(input => {
      input.addEventListener('input', () => {
        const group = input.closest('.vm-group');
        if (group && group.classList.contains('error')) {
          group.classList.remove('error');
        }
      });
    });
  }

  open() {
    this.overlay.classList.add('active');
    this.isOpen = true;
    
    // Store reference to the element that opened the modal for a11y focus return
    this.triggerElement = document.activeElement;
    
    // Focus first input
    setTimeout(() => {
      this.inputs.fname.focus();
    }, 100);
    
    // Prevent background scrolling
    document.body.style.overflow = 'hidden';
  }

  close() {
    this.overlay.classList.remove('active');
    this.isOpen = false;
    document.body.style.overflow = '';
    
    if (this.triggerElement) {
      this.triggerElement.focus();
    }
  }

  validate() {
    let isValid = true;
    const { fname, phone, email } = this.inputs;

    if (!fname.value.trim()) {
      fname.closest('.vm-group').classList.add('error');
      isValid = false;
    }

    if (!phone.value.trim() || phone.value.replace(/[^0-9+]/g, '').length < 8) {
      phone.closest('.vm-group').classList.add('error');
      isValid = false;
    }

    if (email.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
      email.closest('.vm-group').classList.add('error');
      isValid = false;
    }

    return isValid;
  }

  async handleSubmit(e) {
    e.preventDefault();
    if (!this.validate()) return;

    // Set loading state
    const originalText = this.submitBtn.innerHTML;
    this.submitBtn.innerHTML = 'Submitting...';
    this.submitBtn.disabled = true;

    // Clear any previous submit-level error
    const errEl = this.overlay.querySelector('#vm-submit-error');
    if (errEl) errEl.style.display = 'none';

    const data = {
      firstName: this.inputs.fname.value.trim(),
      lastName: this.inputs.lname.value.trim(),
      phone: this.inputs.phone.value.trim(),
      email: this.inputs.email.value.trim(),
      city: this.inputs.city.value.trim(),
      heardAboutUs: this.inputs.heard.value,
      visitIntent: this.inputs.intent.value,
      createdAt: new Date().toISOString()
    };

    try {
      await visitorService.submitVisitor(data);
      this.showSuccess(data.firstName);
    } catch (error) {
      console.error('[VisitorModal] Submission failed');
      if (errEl) {
        errEl.textContent = 'Unable to submit your information. Please try again.';
        errEl.style.display = 'block';
      }
      this.submitBtn.innerHTML = originalText;
      this.submitBtn.disabled = false;
    }
  }

  showSuccess(firstName) {
    const successHtml = `
      <div class="vm-success">
        <div class="vm-success-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
        </div>
        <h2>Thank You, ${firstName}!</h2>
        <p>We're so glad you reached out. Our church team will be happy to connect with you. We look forward to welcoming you to Centenary Baptist Church.</p>
        <button class="vm-btn-close">BACK TO HOME</button>
      </div>
    `;

    this.formContainer.innerHTML = successHtml;
    
    const closeBtn = this.formContainer.querySelector('.vm-btn-close');
    closeBtn.addEventListener('click', () => this.close());
  }
}
