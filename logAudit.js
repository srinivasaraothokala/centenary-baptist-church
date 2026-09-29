/**
 * logAudit — Write an audit log entry to Supabase.
 * 
 * Usage in any route:
 *   import { logAudit } from './logAudit.js';
 *   await logAudit({ action:'created', entityType:'sermon', entityId: id, entityName: title, userEmail, ip: req.ip });
 */

import { supabase } from './supabaseClient.js';

/**
 * @param {Object} opts
 * @param {string} opts.action       - 'created' | 'updated' | 'deleted' | 'login' | 'logout' | 'uploaded'
 * @param {string} opts.entityType   - 'sermon' | 'event' | 'gallery' | 'ministry' | 'campus' | 'settings' | 'user' | 'media'
 * @param {string} [opts.entityId]   - ID of the affected record
 * @param {string} [opts.entityName] - Human-readable label (title, email, etc.)
 * @param {string} [opts.userEmail]  - Admin email performing the action
 * @param {string} [opts.ip]         - Request IP address
 * @param {Object} [opts.details]    - Any extra JSONB data (e.g. changed fields)
 */
export async function logAudit({ action, entityType, entityId, entityName, userEmail, ip, details } = {}) {
  try {
    await supabase.from('audit_logs').insert([{
      action,
      entity_type: entityType,
      entity_id:   entityId   ? String(entityId)   : null,
      entity_name: entityName ? String(entityName) : null,
      user_email:  userEmail  || null,
      ip_address:  ip         || null,
      details:     details    || null
    }]);
  } catch (err) {
    // Never crash the main request if logging fails
    console.warn('[audit] Log write failed:', err.message);
  }
}
