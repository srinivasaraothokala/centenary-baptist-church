import express from 'express';
import { supabase } from './supabaseClient.js';
import { logAudit } from './logAudit.js';
import { requireAuth } from './authMiddleware.js';
import crypto from 'crypto';

const router = express.Router();

// GET /api/events - Get all events
router.get('/', async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 100, 1), 100);
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error } = await supabase.from('events').select('*').range(from, to).order('date', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// POST /api/events - Create new event
router.post('/', requireAuth, async (req, res) => {
  try {
    const newEvent = { ...req.body, id: crypto.randomUUID() };
    const { data, error } = await supabase.from('events').insert([newEvent]).select();
    if (error) throw error;
    await logAudit({ action: 'created', entityType: 'event', entityId: data[0].id, entityName: data[0].title, ip: req.ip });
    res.status(201).json(data[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// PUT /api/events/:id - Update an event
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('events')
      .update(req.body)
      .eq('id', req.params.id)
      .select();
      
    if (error) throw error;
    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    await logAudit({ action: 'updated', entityType: 'event', entityId: req.params.id, entityName: data[0].title, ip: req.ip });
    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// DELETE /api/events/:id - Delete an event
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase.from('events').delete().eq('id', req.params.id).select();
    if (error) throw error;
    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    await logAudit({ action: 'deleted', entityType: 'event', entityId: req.params.id, entityName: data[0].title, ip: req.ip });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

export default router;
