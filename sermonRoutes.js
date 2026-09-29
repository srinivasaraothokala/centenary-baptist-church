import express from 'express';
import { supabase } from './supabaseClient.js';
import { logAudit } from './logAudit.js';
import crypto from 'crypto';

const router = express.Router();

import { requireAuth } from './authMiddleware.js';
// GET /api/sermons
router.get('/', async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 100, 1), 100);
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error } = await supabase.from('sermons').select('*').order('date', { ascending: false }).range(from, to);
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sermons' });
  }
});

// POST /api/sermons
router.post('/', requireAuth, async (req, res) => {
  try {
    const newSermon = { ...req.body, id: crypto.randomUUID() };
    const { data, error } = await supabase.from('sermons').insert([newSermon]).select();
    if (error) throw error;
    await logAudit({ action: 'created', entityType: 'sermon', entityId: data[0].id, entityName: data[0].title, ip: req.ip });
    res.status(201).json(data[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create sermon' });
  }
});

// PUT /api/sermons/:id
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('sermons')
      .update(req.body)
      .eq('id', req.params.id)
      .select();
      
    if (error) throw error;
    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Sermon not found' });
    }
    await logAudit({ action: 'updated', entityType: 'sermon', entityId: req.params.id, entityName: data[0].title, ip: req.ip });
    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update sermon' });
  }
});

// DELETE /api/sermons/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase.from('sermons').delete().eq('id', req.params.id).select();
    if (error) throw error;
    await logAudit({ action: 'deleted', entityType: 'sermon', entityId: req.params.id, entityName: data?.[0]?.title, ip: req.ip });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete sermon' });
  }
});

export default router;
