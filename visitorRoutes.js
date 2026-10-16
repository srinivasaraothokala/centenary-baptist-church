import express from 'express';
import { supabase } from './supabaseClient.js';
import { requireAuth, requireAdmin } from './authMiddleware.js';
const router = express.Router();

// POST /api/visitor - Submit new visitor form
router.post('/', async (req, res) => {
  try {
    const { firstName, lastName, phone, email, city, heardAboutUs, visitIntent } = req.body;

    const clean = (value, maxLength) => String(value || '').trim().slice(0, maxLength);
    const safeFirstName = clean(firstName, 100);
    const safePhone = clean(phone, 50);
    const safeEmail = clean(email, 255);
    if (!safeFirstName || !safePhone) {
      return res.status(400).json({ error: 'First name and phone number are required.' });
    }
    if (safePhone.replace(/[^0-9+]/g, '').length < 8) {
      return res.status(400).json({ error: 'Please provide a valid phone number.' });
    }
    if (safeEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(safeEmail)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    const newVisitor = {
      first_name: safeFirstName,
      last_name: clean(lastName, 100),
      phone: safePhone,
      email: safeEmail,
      city: clean(city, 150),
      heard_about_us: clean(heardAboutUs, 100),
      visit_intent: clean(visitIntent, 100)
    };

    const { error } = await supabase.from('visitors').insert([newVisitor]);
    
    if (error) {
      console.error('Supabase visitor insert error:', error);
      throw error;
    }

    res.status(201).json({ success: true, message: 'Visitor registered successfully' });
  } catch (error) {
    console.error('Visitor Submit Error:', error);
    res.status(500).json({ error: 'An error occurred while saving the visitor.' });
  }
});

// GET /api/visitor - Admin view all visitors
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase.from('visitors').select('*').order('created_at', { ascending: false }).limit(200);
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch visitors' });
  }
});

export default router;
