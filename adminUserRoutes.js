import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { supabase } from './supabaseClient.js';
import { requireAuth, requireAdmin, requireSuperAdmin } from './authMiddleware.js';
const router = express.Router();

// Admin client with full privileges (service key)
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);


// ─── GET ALL ADMIN USERS (Super Admin only) ────────────────────────────────
// GET /api/admin-users
router.get('/', requireAuth, requireAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
    if (error) throw error;

    const adminUsers = users
      .filter(u => u.user_metadata?.role === 'admin' || u.user_metadata?.role === 'super_admin')
      .map(u => ({
        id: u.id,
        email: u.email,
        name: u.user_metadata?.name || '',
        role: u.user_metadata?.role || 'admin',
        is_active: u.user_metadata?.is_active !== false,
        created_at: u.created_at,
        last_sign_in: u.last_sign_in_at
      }));

    res.json(adminUsers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch admin users' });
  }
});

// ─── CREATE NEW ADMIN (Super Admin only) ──────────────────────────────────
// POST /api/admin-users
router.post('/', requireAuth, requireAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required' });
    }
    const assignedRole = role === 'super_admin' ? 'super_admin' : 'admin';

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: assignedRole, name, is_active: true }
    });

    if (error) throw error;
    res.status(201).json({
      id: data.user.id,
      email: data.user.email,
      name,
      role: assignedRole,
      is_active: true
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create admin' });
  }
});

// ─── UPDATE ADMIN (Super Admin only) ─────────────────────────────────────
// PUT /api/admin-users/:id
router.put('/:id', requireAuth, requireAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const { name, email, password, role, is_active } = req.body;
    const updates = { user_metadata: { name, role, is_active } };
    if (email) updates.email = email;
    if (password) updates.password = password;

    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(req.params.id, updates);
    if (error) throw error;
    res.json({ success: true, user: data.user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update admin' });
  }
});

// ─── DELETE ADMIN (Super Admin only) ─────────────────────────────────────
// DELETE /api/admin-users/:id
router.delete('/:id', requireAuth, requireAdmin, requireSuperAdmin, async (req, res) => {
  try {
    // Prevent deleting yourself
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    const { error } = await supabaseAdmin.auth.admin.deleteUser(req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete admin' });
  }
});

// ─── TOGGLE ACTIVE STATUS (Super Admin only) ──────────────────────────────
// PATCH /api/admin-users/:id/toggle-active
router.patch('/:id/toggle-active', requireAuth, requireAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const { is_active } = req.body;
    const { data: { user: existing }, error: fetchErr } = await supabaseAdmin.auth.admin.getUserById(req.params.id);
    if (fetchErr) throw fetchErr;

    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(req.params.id, {
      user_metadata: { ...existing.user_metadata, is_active }
    });
    if (error) throw error;
    res.json({ success: true, is_active });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// ─── UPDATE OWN PROFILE ────────────────────────────────────────────────────
// PATCH /api/admin-users/profile/me
router.patch('/profile/me', requireAuth, requireAdmin, async (req, res) => {
  try {
    const role = req.user.user_metadata?.role;
    const { password, email } = req.body;

    // Admins can only update password
    if (role === 'admin' && email) {
      return res.status(403).json({ error: 'Admins cannot change their email' });
    }

    const updates = {};
    if (password) updates.password = password;
    if (email && role === 'super_admin') updates.email = email;

    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(req.user.id, updates);
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;
