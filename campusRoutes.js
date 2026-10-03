import express from 'express';
import { supabase } from './supabaseClient.js';
import { logAudit } from './logAudit.js';
import { requireAuth, requireAdmin } from './authMiddleware.js';
const router = express.Router();

function toSlug(title) {
  return title.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// GET /api/campus — all locations, ordered by sort_order
router.get('/', async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 100, 1), 100);
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error } = await supabase
      .from('campus')
      .select('*')
      .order('sort_order', { ascending: true })
      .range(from, to);
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch campus locations' });
  }
});

// GET /api/campus/:slug — single campus location by slug
router.get('/:slug', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('campus')
      .select('*')
      .eq('slug', req.params.slug)
      .single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Campus location not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch campus location' });
  }
});

// POST /api/campus — create new campus location
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { title, short_desc, full_desc, icon, image_url, address, map_url, phone, is_active, sort_order } = req.body;
    const slug = toSlug(title);
    const { data, error } = await supabase
      .from('campus')
      .insert([{ title, slug, short_desc, full_desc, icon: icon || '🏛', image_url, address, map_url, phone, is_active: is_active ?? true, sort_order: sort_order ?? 99 }])
      .select();
      
    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ error: 'A campus location with this title/slug already exists.' });
      }
      throw error;
    }
    
    await logAudit({ action: 'created', entityType: 'campus', entityId: data[0].id, entityName: data[0].title, ip: req.ip });
    res.status(201).json(data[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create campus location' });
  }
});

// PUT /api/campus/:id — update campus location
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { title, short_desc, full_desc, icon, image_url, address, map_url, phone, is_active, sort_order } = req.body;
    const updateData = { short_desc, full_desc, icon, image_url, address, map_url, phone, is_active, sort_order };
    if (title) { updateData.title = title; updateData.slug = toSlug(title); }
    const { data, error } = await supabase.from('campus').update(updateData).eq('id', req.params.id).select();
    if (error) throw error;
    if (!data || !data.length) return res.status(404).json({ error: 'Campus location not found' });
    await logAudit({ action: 'updated', entityType: 'campus', entityId: req.params.id, entityName: data[0].title, ip: req.ip });
    res.json(data[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update campus location' });
  }
});

// DELETE /api/campus/:id
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase.from('campus').delete().eq('id', req.params.id).select();
    if (error) throw error;
    if (!data || !data.length) return res.status(404).json({ error: 'Campus location not found' });
    await logAudit({ action: 'deleted', entityType: 'campus', entityId: req.params.id, entityName: data[0].title, ip: req.ip });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete campus location' });
  }
});

export default router;
