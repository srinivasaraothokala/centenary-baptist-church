import './ContactForm.css';

export class ContactForm {
  constructor(containerSelector) {
    this.container = document.querySelector(containerSelector);
    if (!this.container) return;
    
    this.render();
    this.bindEvents();
  }

  render() {
    this.container.innerHTML = `
      <div class="contact-form-card">
        <div class="cf-form-view">
          <form id="cbc-contact-form" novalidate>
            <!-- Honeypot -->
            <input type="text" name="honeypot" id="cf-honeypot" style="display:none" tabindex="-1" autocomplete="off" />

            <div class="cf-row">
              <div class="cf-group">
                <label for="cf-fname">First Name <span>*</span></label>
                <input type="text" id="cf-fname" class="cf-input" name="firstName" placeholder="e.g. John" required />
                <span class="cf-error-text">Please enter your first name.</span>
              </div>
              <div class="cf-group">
                <label for="cf-lname">Last Name <span>*</span></label>
                <input type="text" id="cf-lname" class="cf-input" name="lastName" placeholder="e.g. Doe" required />
                <span class="cf-error-text">Please enter your last name.</span>
              </div>
            </div>

            <div class="cf-row">
              <div class="cf-group">
                <label for="cf-phone">Phone Number <span>*</span></label>
                <input type="tel" id="cf-phone" class="cf-input" name="phone" placeholder="e.g. 9876543210" required />
                <span class="cf-error-text">Please enter your phone number.</span>
              </div>
              <div class="cf-group">
                <label for="cf-email">Email Address <span>*</span></label>
                <input type="email" id="cf-email" class="cf-input" name="email" placeholder="e.g. john@example.com" required />
                <span class="cf-error-text">Please enter a valid email address.</span>
              </div>
            </div>

            <div class="cf-group" style="margin-bottom: 24px;">
              <label for="cf-message">Message <span>*</span></label>
              <textarea id="cf-message" class="cf-textarea" name="message" placeholder="How can we help you?" required></textarea>
              <span class="cf-error-text">Please enter your message (min 10 characters).</span>
            </div>

            <button type="submit" class="cf-submit" id="cf-submit-btn">
              <span>SEND MESSAGE</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
          </form>
        </div>

        <div class="cf-success-state" style="display: none;">
          <div class="cf-success-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <h3 class="cf-state-title">Message Sent Successfully</h3>
          <p class="cf-state-desc">Thank you for reaching out to Centenary Baptist Church. We have received your message and our team will get back to you soon.</p>
          <button class="cf-btn-reset" id="cf-btn-success-reset">SEND ANOTHER MESSAGE</button>
        </div>

        <div class="cf-error-state" style="display: none;">
          <div class="cf-error-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <h3 class="cf-state-title">Something Went Wrong</h3>
          <p class="cf-state-desc" id="cf-error-message">We couldn't send your message right now. Please try again in a moment or contact us directly.</p>
          <button class="cf-btn-reset" id="cf-btn-error-reset">TRY AGAIN</button>
        </div>
      </div>
    `;
    
    this.formView = this.container.querySelector('.cf-form-view');
    this.successView = this.container.querySelector('.cf-success-state');
    this.errorView = this.container.querySelector('.cf-error-state');
    this.form = this.container.querySelector('#cbc-contact-form');
    this.submitBtn = this.container.querySelector('#cf-submit-btn');
    this.btnText = this.submitBtn.querySelector('span');
    
    this.inputs = {
      fname: this.container.querySelector('#cf-fname'),
      lname: this.container.querySelector('#cf-lname'),
      phone: this.container.querySelector('#cf-phone'),
      email: this.container.querySelector('#cf-email'),
      message: this.container.querySelector('#cf-message'),
      honeypot: this.container.querySelector('#cf-honeypot')
    };
  }

  bindEvents() {
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    
    // Clear validation error on input
    Object.values(this.inputs).forEach(input => {
      input.addEventListener('input', () => {
        const group = input.closest('.cf-group');
        if (group && group.classList.contains('has-error')) {
          group.classList.remove('has-error');
        }
      });
    });

    this.container.querySelector('#cf-btn-success-reset').addEventListener('click', () => {
      this.form.reset();
      this.showView('form');
    });

    this.container.querySelector('#cf-btn-error-reset').addEventListener('click', () => {
      this.showView('form');
    });
  }

  validate() {
    let isValid = true;
    const { fname, lname, phone, email, message } = this.inputs;

    if (!fname.value.trim()) {
      fname.closest('.cf-group').classList.add('has-error');
      isValid = false;
    }
    
    if (!lname.value.trim()) {
      lname.closest('.cf-group').classList.add('has-error');
      isValid = false;
    }

    if (!phone.value.trim() || phone.value.replace(/[^0-9+]/g, '').length < 8) {
      phone.closest('.cf-group').classList.add('has-error');
      isValid = false;
    }

    if (!email.value.trim() || !/^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(email.value)) {
      email.closest('.cf-group').classList.add('has-error');
      isValid = false;
    }
    
    if (!message.value.trim() || message.value.trim().length < 10) {
      message.closest('.cf-group').classList.add('has-error');
      isValid = false;
    }

    return isValid;
  }

  async handleSubmit(e) {
    e.preventDefault();
    
    if (!this.validate()) return;

    // Loading State
    this.submitBtn.disabled = true;
    this.btnText.textContent = 'SENDING...';

    const payload = {
      firstName: this.inputs.fname.value.trim(),
      lastName: this.inputs.lname.value.trim(),
      phone: this.inputs.phone.value.trim(),
      email: this.inputs.email.value.trim(),
      message: this.inputs.message.value.trim(),
      honeypot: this.inputs.honeypot.value
    };

    try {
      const response = await fetch(`${API_BASE}/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        this.showView('success');
      } else {
        this.showView('error', data.error);
      }
    } catch (err) {
      console.error('Contact Form Submission Error:', err);
      this.showView('error');
    } finally {
      this.submitBtn.disabled = false;
      this.btnText.textContent = 'SEND MESSAGE';
    }
  }

  showView(viewName, errorMsg = null) {
    this.formView.style.display = 'none';
    this.successView.style.display = 'none';
    this.errorView.style.display = 'none';

    if (viewName === 'form') {
      this.formView.style.display = 'block';
    } else if (viewName === 'success') {
      this.successView.style.display = 'block';
    } else if (viewName === 'error') {
      this.errorView.style.display = 'block';
      if (errorMsg) {
        this.container.querySelector('#cf-error-message').textContent = errorMsg;
      }
    }
  }
}
