import express from 'express';
import { supabase } from './supabaseClient.js';
import { requireAuth } from './authMiddleware.js';
const router = express.Router();

// POST /api/visitor - Submit new visitor form
router.post('/', async (req, res) => {
  try {
    const { firstName, lastName, phone, email, city, heardAboutUs, visitIntent } = req.body;

    const newVisitor = {
      first_name: firstName,
      last_name: lastName,
      phone: phone,
      email: email,
      city: city,
      heard_about_us: heardAboutUs,
      visit_intent: visitIntent
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
router.get('/', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase.from('visitors').select('*').order('created_at', { ascending: false }).limit(200);
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch visitors' });
  }
});

export default router;
