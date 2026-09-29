import { t } from '../i18n.js';
import { churchData } from '../data/churchData.js';

export class UpcomingEvents {
  constructor(containerSelector) {
    this.containerSelector = containerSelector;
    this.container = document.querySelector(containerSelector);
    if (this.container) {
      this.render();
      // Re-render on language or event data change
      window.addEventListener('langChange', () => this.render());
      window.addEventListener('eventsUpdated', () => this.render());
    }
  }

  render() {
    this.container = document.querySelector(this.containerSelector);
    if (!this.container) return;

    const displayEvents = churchData.events.slice(0, 4);

    let html = `
      <div class="events-editorial-wrapper fade-in-up">
        <div class="wrap">
          <div class="events-editorial-header text-center" style="margin-bottom: 48px;">
            <h2 style="font-family: 'Playfair Display', serif; color: #4C151A; font-size: 36px; margin: 0; text-transform: uppercase;">UPCOMING EVENTS</h2>
          </div>
          
          <div class="events-editorial-list">
    `;

    displayEvents.forEach(event => {
      html += `
        <div class="event-editorial-row fade-in-up stagger-1">
          <div class="event-editorial-date">
            <span class="ee-day">${event.date}</span>
            <span class="ee-month">${event.month}</span>
          </div>
          <div class="event-editorial-info">
            <h3 class="ee-title">${event.title}</h3>
            <p class="ee-meta">
              <span class="ee-location">${event.location}</span> &middot; <span class="ee-time">${event.time}</span>
            </p>
            <p class="ee-desc">${event.description}</p>
          </div>
          <div class="event-editorial-action">
            <a href="#/events/${event.id}" class="btn-ee-details">DETAILS &rarr;</a>
          </div>
        </div>
      `;
    });

    html += `
          </div>
          <div class="events-editorial-footer text-center" style="margin-top: 48px;">
            <a href="#/events" class="btn btn-outline-maroon">VIEW ALL EVENTS &rarr;</a>
          </div>
        </div>
      </div>
    `;

    this.container.innerHTML = html;
    
    // Trigger animations
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1 });
    
    this.container.querySelectorAll('.fade-in-up').forEach(el => observer.observe(el));
  }
}
