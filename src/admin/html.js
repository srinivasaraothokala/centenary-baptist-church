// Escape text before placing it in an HTML template string.  Admin views render
// public form submissions, so these values must never be inserted as raw HTML.
export const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

export const safeMailto = (value) => `mailto:${encodeURIComponent(String(value ?? ''))}`;
export const safeTel = (value) => `tel:${encodeURIComponent(String(value ?? ''))}`;
