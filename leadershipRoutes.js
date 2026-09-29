import express from 'express';
import { supabase } from './supabaseClient.js';
import { logAudit } from './logAudit.js';
import { requireAuth } from './authMiddleware.js';
const router = express.Router();

// GET /api/leadership — all leaders ordered by category then order_index
router.get('/', async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 100, 1), 100);
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error } = await supabase
      .from('leadership')
      .select('*')
      .order('category', { ascending: true })
      .order('order_index', { ascending: true })
      .range(from, to);
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch leadership' });
  }
});

// GET /api/leadership/:id — single leader by id
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('leadership')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Leader not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch leader' });
  }
});

// POST /api/leadership — create a new leader
router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, role, category, bio, image_url, order_index, is_active } = req.body;

    const { data, error } = await supabase
      .from('leadership')
      .insert([{ name, role, category: category || 'pastoral', bio, image_url, order_index: order_index ?? 99, is_active: is_active !== false }])
      .select()
      .single();

    if (error) throw error;

    await logAudit({
      action: 'CREATE',
      entity: 'leadership',
      entity_id: String(data.id),
      details: `Added leader: ${name} (${role})`,
      req
    });

    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create leader' });
  }
});

// PUT /api/leadership/:id — update a leader
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { name, role, category, bio, image_url, order_index, is_active } = req.body;

    const { data, error } = await supabase
      .from('leadership')
      .update({ name, role, category, bio, image_url, order_index, is_active })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    await logAudit({
      action: 'UPDATE',
      entity: 'leadership',
      entity_id: String(req.params.id),
      details: `Updated leader: ${name} (${role})`,
      req
    });

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update leader' });
  }
});

// DELETE /api/leadership/:id — delete a leader
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { data: existing } = await supabase.from('leadership').select('name, role').eq('id', req.params.id).single();

    const { error } = await supabase
      .from('leadership')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;

    await logAudit({
      action: 'DELETE',
      entity: 'leadership',
      entity_id: String(req.params.id),
      details: `Deleted leader: ${existing?.name || 'Unknown'} (${existing?.role || ''})`,
      req
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete leader' });
  }
});

export default router;
