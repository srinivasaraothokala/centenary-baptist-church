import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { requireAuth, requireAdmin, requireSuperAdmin } from './authMiddleware.js';
import { logAudit } from './logAudit.js';

const router = express.Router();

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const isAdminRole = (role) => role === 'admin' || role === 'super_admin';
const getAccess = (user) => ({
  role: user?.app_metadata?.role || user?.user_metadata?.role || null,
  is_active: (user?.app_metadata?.is_active !== false) && (user?.user_metadata?.is_active !== false)
});

const toAdminUser = (user) => {
  const access = getAccess(user);
  return {
    id: user.id,
    email: user.email,
    name: user.user_metadata?.name || '',
    role: access.role,
    is_active: access.is_active,
    created_at: user.created_at,
    last_sign_in: user.last_sign_in_at
  };
};

async function getUserById(id) {
  const { data: { user }, error } = await supabaseAdmin.auth.admin.getUserById(id);
  if (error) throw error;
  return user;
}

async function getAdminUsers() {
  const perPage = 1000;
  const users = [];
  let page = 1;

  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    users.push(...data.users);
    if (data.users.length < perPage) break;
    page += 1;
  }

  return users.filter((user) => isAdminRole(getAccess(user).role));
}

async function ensureAnotherSuperAdmin(targetId) {
  const target = await getUserById(targetId);
  const targetAccess = getAccess(target);
  if (targetAccess.role !== 'super_admin') return target;

  const users = await getAdminUsers();
  const remaining = users.filter((user) => {
    const access = getAccess(user);
    return user.id !== targetId && access.role === 'super_admin' && access.is_active;
  });

  if (!remaining.length) {
    const error = new Error('At least one active Super Admin account must remain');
    error.statusCode = 400;
    throw error;
  }
  return target;
}

// GET /api/admin-users/me — effective server-side access state.
router.get('/me', requireAuth, requireAdmin, (req, res) => {
  res.json({
    id: req.user.id,
    email: req.user.email,
    name: req.user.user_metadata?.name || '',
    ...getAccess(req.user)
  });
});

// GET /api/admin-users — Super Admin only
router.get('/', requireAuth, requireAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const users = await getAdminUsers();
    res.json(users.map(toAdminUser));
  } catch (error) {
    console.error('Failed to fetch admin users:', error);
    res.status(500).json({ error: 'Failed to fetch admin users' });
  }
});

// POST /api/admin-users — Super Admin only
router.post('/', requireAuth, requireAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required' });
    }
    const assignedRole = role === 'super_admin' ? 'super_admin' : 'admin';
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: String(email).trim(),
      password,
      email_confirm: true,
      user_metadata: { name: String(name).trim() },
      app_metadata: { role: assignedRole, is_active: true }
    });
    if (error) throw error;

    await logAudit({
      action: 'created', entityType: 'user', entityId: data.user.id,
      entityName: data.user.email, userEmail: req.user.email, ip: req.ip
    });
    res.status(201).json(toAdminUser(data.user));
  } catch (error) {
    console.error('Failed to create admin:', error);
    res.status(error.statusCode || 500).json({ error: error.message || 'Failed to create admin' });
  }
});

// PUT /api/admin-users/:id — Super Admin only
router.put('/:id', requireAuth, requireAdmin, requireSuperAdmin, async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'Use the profile endpoint to update your own account' });
    }

    const existing = await getUserById(req.params.id);
    if (!isAdminRole(existing.app_metadata?.role)) {
      return res.status(404).json({ error: 'Admin account not found' });
    }

    const { name, email, password, role, is_active } = req.body;
    const nextRole = role === 'super_admin' ? 'super_admin' : 'admin';
    const nextActive = typeof is_active === 'boolean'
      ? is_active
      : existing.app_metadata?.is_active !== false;

    if ((existing.app_metadata?.role === 'super_admin' && nextRole !== 'super_admin') ||
        (existing.app_metadata?.role === 'super_admin' && !nextActive)) {
      await ensureAnotherSuperAdmin(req.params.id);
    }

    const updates = {
      user_metadata: { ...existing.user_metadata, name: String(name || '').trim() },
      app_metadata: { ...existing.app_metadata, role: nextRole, is_active: nextActive }
    };
    if (email) updates.email = String(email).trim();
    if (password) updates.password = password;

    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(req.params.id, updates);
    if (error) throw error;
    await logAudit({
      action: 'updated', entityType: 'user', entityId: req.params.id,
      entityName: data.user.email, userEmail: req.user.email, ip: req.ip
    });
    res.json({ success: true, user: toAdminUser(data.user) });
  } catch (error) {
    console.error('Failed to update admin:', error);
    res.status(error.statusCode || 500).json({ error: error.message || 'Failed to update admin' });
  }
});

// DELETE /api/admin-users/:id — Super Admin only
router.delete('/:id', requireAuth, requireAdmin, requireSuperAdmin, async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    const existing = await ensureAnotherSuperAdmin(req.params.id);
    if (!isAdminRole(existing.app_metadata?.role)) {
      return res.status(404).json({ error: 'Admin account not found' });
    }
    const { error } = await supabaseAdmin.auth.admin.deleteUser(req.params.id);
    if (error) throw error;
    await logAudit({
      action: 'deleted', entityType: 'user', entityId: req.params.id,
      entityName: existing.email, userEmail: req.user.email, ip: req.ip
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to delete admin:', error);
    res.status(error.statusCode || 500).json({ error: error.message || 'Failed to delete admin' });
  }
});

// PATCH /api/admin-users/:id/toggle-active — Super Admin only
router.patch('/:id/toggle-active', requireAuth, requireAdmin, requireSuperAdmin, async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'Cannot disable your own account' });
    }
    const { is_active } = req.body;
    if (typeof is_active !== 'boolean') {
      return res.status(400).json({ error: 'is_active must be a boolean' });
    }
    const existing = !is_active
      ? await ensureAnotherSuperAdmin(req.params.id)
      : await getUserById(req.params.id);
    if (!isAdminRole(existing.app_metadata?.role)) {
      return res.status(404).json({ error: 'Admin account not found' });
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(req.params.id, {
      app_metadata: { ...existing.app_metadata, is_active }
    });
    if (error) throw error;
    await logAudit({
      action: 'updated', entityType: 'user', entityId: req.params.id,
      entityName: existing.email, userEmail: req.user.email, ip: req.ip,
      details: { is_active }
    });
    res.json({ success: true, is_active });
  } catch (error) {
    console.error('Failed to toggle admin status:', error);
    res.status(error.statusCode || 500).json({ error: error.message || 'Failed to update status' });
  }
});

// PATCH /api/admin-users/profile/me
router.patch('/profile/me', requireAuth, requireAdmin, async (req, res) => {
  try {
    const role = req.user.app_metadata?.role;
    const { password, email } = req.body;
    if (role === 'admin' && email) {
      return res.status(403).json({ error: 'Admins cannot change their email' });
    }
    const updates = {};
    if (password) updates.password = password;
    if (email && role === 'super_admin') updates.email = email;
    if (!Object.keys(updates).length) {
      return res.status(400).json({ error: 'No profile changes supplied' });
    }
    const { error } = await supabaseAdmin.auth.admin.updateUserById(req.user.id, updates);
    if (error) throw error;
    await logAudit({ action: 'updated', entityType: 'user', entityId: req.user.id, entityName: req.user.email, userEmail: req.user.email, ip: req.ip });
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to update profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;
