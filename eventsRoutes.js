import express from 'express';
import { supabase } from './supabaseClient.js';
import { logAudit } from './logAudit.js';
import { requireAuth, requireAdmin } from './authMiddleware.js';
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
router.post('/', requireAuth, requireAdmin, async (req, res) => {
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
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
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
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
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

// GET /api/events/:id/registrations - Get registrations for an event (Admin only)
router.get('/:id/registrations', requireAuth, requireAdmin, async (req, res) => {
  try {
    // Verify event exists
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select('id, title')
      .eq('id', req.params.id)
      .single();

    if (eventError || !eventData) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    const { data, error } = await supabase
      .from('event_registrations')
      .select('*')
      .eq('event_id', req.params.id)
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.json({ event: eventData, registrations: data });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch registrations' });
  }
});

// GET /api/events/:id/registrations/export - Download CSV (Admin only)
router.get('/:id/registrations/export', requireAuth, requireAdmin, async (req, res) => {
  try {
    // Fetch the event to verify it exists and get the name for the filename
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select('id, title')
      .eq('id', req.params.id)
      .single();

    if (eventError || !eventData) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    // Fetch registrations for ONLY this event
    const { data: registrations, error } = await supabase
      .from('event_registrations')
      .select('id, full_name, email, phone, attendee_count, notes, created_at')
      .eq('event_id', req.params.id)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Generate a safe filename from the event title
    const safeFilename = eventData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Build CSV
    const csvHeaders = ['Registration ID', 'Event Name', 'Full Name', 'Email', 'Phone Number', 'Number of Attendees', 'Notes', 'Registration Date'];
    
    const escapeCSV = (val) => {
      if (val === null || val === undefined) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = registrations.map(r => [
      escapeCSV(r.id),
      escapeCSV(eventData.title),
      escapeCSV(r.full_name),
      escapeCSV(r.email),
      escapeCSV(r.phone),
      escapeCSV(r.attendee_count),
      escapeCSV(r.notes),
      escapeCSV(r.created_at ? new Date(r.created_at).toLocaleString('en-IN') : '')
    ].join(','));

    const csvContent = [csvHeaders.join(','), ...rows].join('\r\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}-registrations.csv"`);
    res.send(csvContent);
  } catch (error) {
    console.error('CSV export error:', error);
    res.status(500).json({ error: 'Failed to export registrations.' });
  }
});

// POST /api/events/:id/register - Register for an event (Public)
router.post('/:id/register', async (req, res) => {
  try {
    const { full_name, email, phone, attendee_count, notes } = req.body;
    
    // Basic validation
    if (!full_name || !email || !phone) {
      return res.status(400).json({ error: 'Name, email, and phone are required.' });
    }
    
    const count = parseInt(attendee_count) || 1;
    if (count < 1) {
      return res.status(400).json({ error: 'Attendee count must be at least 1.' });
    }

    // 1. Verify event exists and registration is enabled
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select('registration_enabled')
      .eq('id', req.params.id)
      .single();

    if (eventError || !eventData) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    if (!eventData.registration_enabled) {
      return res.status(403).json({ error: 'Registration is not enabled for this event.' });
    }

    // 2. Insert registration
    const newRegistration = {
      event_id: req.params.id,
      full_name: full_name.trim().substring(0, 100),
      email: email.trim().substring(0, 100),
      phone: phone.trim().substring(0, 20),
      attendee_count: count,
      notes: notes ? notes.trim().substring(0, 500) : null
    };

    const { error: insertError } = await supabase
      .from('event_registrations')
      .insert([newRegistration]);

    if (insertError) {
      console.error('Registration insert error:', insertError);
      return res.status(500).json({ error: 'Failed to save registration. Please try again later.' });
    }

    res.status(201).json({ success: true, message: 'Successfully registered for the event.' });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ error: 'An unexpected error occurred.' });
  }
});

export default router;
