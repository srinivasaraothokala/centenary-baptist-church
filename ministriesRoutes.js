import express from 'express';
import { supabase } from './supabaseClient.js';
import { logAudit } from './logAudit.js';
import { requireAuth } from './authMiddleware.js';
const router = express.Router();

// Helper to auto-generate a slug from title
function toSlug(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// GET /api/ministries — all ministries, ordered by sort_order
router.get('/', async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 100, 1), 100);
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error } = await supabase
      .from('ministries')
      .select('*')
      .order('sort_order', { ascending: true })
      .range(from, to);
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch ministries' });
  }
});

// GET /api/ministries/:slug — single ministry by slug
router.get('/:slug', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('ministries')
      .select('*')
      .eq('slug', req.params.slug)
      .single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Ministry not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch ministry' });
  }
});

// POST /api/ministries — create a new ministry
router.post('/', requireAuth, async (req, res) => {
  try {
    const {
      title, short_desc, full_desc, icon, image_url,
      leader_name, meeting_time, meeting_location, contact_email,
      is_active, sort_order
    } = req.body;

    const slug = toSlug(title);

    const { data, error } = await supabase
      .from('ministries')
      .insert([{
        title, slug, short_desc, full_desc, icon: icon || '✝', image_url,
        leader_name, meeting_time, meeting_location, contact_email,
        is_active: is_active ?? true,
        sort_order: sort_order ?? 99
      }])
      .select();
      
    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ error: 'A ministry with this title/slug already exists.' });
      }
      throw error;
    }
    await logAudit({ action: 'created', entityType: 'ministry', entityId: data[0].id, entityName: data[0].title, ip: req.ip });
    res.status(201).json(data[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create ministry' });
  }
});

// PUT /api/ministries/:id — update a ministry
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const {
      title, short_desc, full_desc, icon, image_url,
      leader_name, meeting_time, meeting_location, contact_email,
      is_active, sort_order
    } = req.body;

    const updateData = {
      short_desc, full_desc, icon, image_url,
      leader_name, meeting_time, meeting_location, contact_email,
      is_active, sort_order
    };

    // Only re-generate slug if title changed
    if (title) {
      updateData.title = title;
      updateData.slug = toSlug(title);
    }

    const { data, error } = await supabase
      .from('ministries')
      .update(updateData)
      .eq('id', req.params.id)
      .select();
    if (error) throw error;
    if (!data || data.length === 0) return res.status(404).json({ error: 'Ministry not found' });
    await logAudit({ action: 'updated', entityType: 'ministry', entityId: req.params.id, entityName: data[0].title, ip: req.ip });
    res.json(data[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update ministry' });
  }
});

// PATCH /api/ministries/reorder — bulk update sort_order for drag-and-drop
router.patch('/reorder', requireAuth, async (req, res) => {
  try {
    // req.body = [{ id: 1, sort_order: 1 }, { id: 3, sort_order: 2 }, ...]
    const updates = req.body;
    const promises = updates.map(({ id, sort_order }) =>
      supabase.from('ministries').update({ sort_order }).eq('id', id)
    );
    await Promise.all(promises);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reorder ministries' });
  }
});

// DELETE /api/ministries/:id — delete a ministry
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('ministries')
      .delete()
      .eq('id', req.params.id)
      .select();
    if (error) throw error;
    if (!data || data.length === 0) return res.status(404).json({ error: 'Ministry not found' });
    await logAudit({ action: 'deleted', entityType: 'ministry', entityId: req.params.id, entityName: data[0].title, ip: req.ip });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete ministry' });
  }
});

export default router;
