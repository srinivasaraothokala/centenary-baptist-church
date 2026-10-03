import express from 'express';
import { supabase } from './supabaseClient.js';
import { logAudit } from './logAudit.js';
import { requireAuth, requireAdmin, requireSuperAdmin } from './authMiddleware.js';
const router = express.Router();

// GET /api/audit-logs — fetch logs with optional filters
router.get('/', requireAuth, requireAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const { action, entity_type, limit = 200 } = req.query;

    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(Math.min(parseInt(limit) || 200, 500));

    if (action)      query = query.eq('action', action);
    if (entity_type) query = query.eq('entity_type', entity_type);

    const { data, error } = await query;
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// DELETE /api/audit-logs — clear all logs (super admin only)
router.delete('/', requireAuth, requireAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const { error } = await supabase.from('audit_logs').delete().neq('id', 0);
    if (error) throw error;
    await logAudit({ action: 'deleted', entityType: 'audit_logs', entityName: 'All logs cleared', ip: req.ip });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to clear logs' });
  }
});

export default router;
