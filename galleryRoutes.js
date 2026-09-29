import express from 'express';
import { supabase } from './supabaseClient.js';
import { logAudit } from './logAudit.js';
import { requireAuth } from './authMiddleware.js';
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 100, 1), 100);
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error } = await supabase.from('gallery').select('*').order('created_at', { ascending: false }).range(from, to);
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch gallery' });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const { title, image_url, category } = req.body;
    const { data, error } = await supabase.from('gallery').insert([{ title, image_url, category }]).select();
    if (error) throw error;
    await logAudit({ action: 'created', entityType: 'gallery', entityId: data[0].id, entityName: title, ip: req.ip });
    res.status(201).json(data[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add gallery item' });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('gallery').delete().eq('id', id);
    if (error) throw error;
    await logAudit({ action: 'deleted', entityType: 'gallery', entityId: id, ip: req.ip });
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete gallery item' });
  }
});

export default router;
