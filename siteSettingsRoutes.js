import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { supabase } from './supabaseClient.js';
import { requireAuth, requireSuperAdmin } from './authMiddleware.js';
const router = express.Router();

// ── GET /api/settings (public — website reads settings) ─────────────────────
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('settings, updated_at, updated_by')
      .eq('id', 1)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Settings fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// ── PUT /api/settings (Super Admin only) ────────────────────────────────────
router.put('/', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { settings } = req.body;
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ error: 'Invalid settings payload' });
    }

    const updatedBy = req.user.user_metadata?.name || req.user.email;

    const { data, error } = await supabase
      .from('site_settings')
      .update({
        settings,
        updated_at: new Date().toISOString(),
        updated_by: updatedBy
      })
      .eq('id', 1)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, updated_at: data.updated_at, updated_by: data.updated_by });
  } catch (err) {
    console.error('Settings update error:', err);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// ── PATCH /api/settings/:section (update one section) ───────────────────────
router.patch('/:section', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { section } = req.params;
    const sectionData = req.body;

    // Fetch current settings
    const { data: current, error: fetchErr } = await supabase
      .from('site_settings')
      .select('settings')
      .eq('id', 1)
      .single();

    if (fetchErr) throw fetchErr;

    const updatedSettings = {
      ...current.settings,
      [section]: { ...(current.settings[section] || {}), ...sectionData }
    };

    const updatedBy = req.user.user_metadata?.name || req.user.email;

    const { data, error } = await supabase
      .from('site_settings')
      .update({
        settings: updatedSettings,
        updated_at: new Date().toISOString(),
        updated_by: updatedBy
      })
      .eq('id', 1)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, updated_at: data.updated_at, updated_by: data.updated_by });
  } catch (err) {
    console.error('Section update error:', err);
    res.status(500).json({ error: `Failed to update ${req.params.section} settings` });
  }
});

export default router;
