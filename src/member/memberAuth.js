/**
 * memberAuth.js — Production-hardened auth service.
 *
 * All Supabase Auth operations for the Member Portal.
 * Never stores passwords. Never exposes service-role key.
 * Keeps auth logic in one place.
 *
 * SECURITY:
 *  - Uses anon key only (no service role in frontend).
 *  - Passwords are handled entirely by Supabase Auth.
 *  - RLS on member_profiles enforced by Supabase; members see only their own row.
 *  - No raw error messages are returned to UI callers — callers handle messaging.
 */
import { supabaseClient } from '../supabaseFrontendClient.js';

export const memberAuth = {

  // ─── REGISTRATION ────────────────────────────────────────────────────────────

  /**
   * Register a new member. Supabase sends a verification email automatically.
   * Stores display metadata in user_metadata; role is set to 'member'
   * so the admin role-check (looking for 'admin'/'super_admin') correctly
   * blocks members from admin routes.
   */
  async register({ email, password, firstName, lastName, phone }) {
    const { data, error } = await supabaseClient.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone: phone.trim(),
          role: 'member'
        }
      }
    });
    if (error) throw error;
    return data;
  },

  // ─── LOGIN ────────────────────────────────────────────────────────────────────

  /**
   * Sign in with email + password. Throws on failure.
   * Callers must check isAdminUser() before allowing portal access.
   */
  async login({ email, password }) {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password
    });
    if (error) throw error;
    return data;
  },

  // ─── LOGOUT ──────────────────────────────────────────────────────────────────

  /**
   * Sign out. Destroys the Supabase session completely.
   * Errors are swallowed intentionally — the UI redirect still happens.
   */
  async logout() {
    try {
      await supabaseClient.auth.signOut();
    } catch (_) {
      // Session may already be gone; still redirect the user.
    }
  },

  // ─── PASSWORD RESET ───────────────────────────────────────────────────────────

  /**
   * Send a password reset email via Supabase.
   * Always shows "check your email" regardless of whether the address is registered
   * — to avoid account enumeration.
   */
  async sendPasswordReset(email) {
    const redirectTo =
      `${window.location.origin}${window.location.pathname}#/member/reset-password`;
    const { error } = await supabaseClient.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo }
    );
    if (error) throw error;
  },

  /**
   * Update password. Called ONLY after a recovery session is active
   * (i.e., user arrived via the Supabase password-reset link).
   */
  async updatePassword(newPassword) {
    const { error } = await supabaseClient.auth.updateUser({ password: newPassword });
    if (error) throw error;
  },

  // ─── EMAIL VERIFICATION ───────────────────────────────────────────────────────

  /**
   * Resend the signup verification email.
   */
  async resendVerification(email) {
    const { error } = await supabaseClient.auth.resend({
      type: 'signup',
      email: email.trim().toLowerCase()
    });
    if (error) throw error;
  },

  // ─── SESSION ─────────────────────────────────────────────────────────────────

  /**
   * Return the current Supabase session, or null if none exists.
   * Reads from local storage — does NOT make a network request.
   */
  async getSession() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    return session;
  },

  /**
   * Return the current Supabase user (network-verified), or null.
   */
  async getUser() {
    try {
      const { data: { user } } = await supabaseClient.auth.getUser();
      return user;
    } catch (_) {
      return null;
    }
  },

  /**
   * Subscribe to auth state changes.
   * Returns { data: { subscription } } — caller should keep reference
   * to unsubscribe when the component is torn down.
   */
  onAuthStateChange(callback) {
    return supabaseClient.auth.onAuthStateChange(callback);
  },

  // ─── ADMIN GUARD ─────────────────────────────────────────────────────────────

  /**
   * Returns true if this user is an admin or super_admin.
   * Members have role = 'member' or no role.
   * Admin accounts are seeded with role = 'admin' or 'super_admin'.
   */
  isAdminUser(user) {
    const role = user?.user_metadata?.role;
    return role === 'admin' || role === 'super_admin';
  },

  // ─── PROFILE ─────────────────────────────────────────────────────────────────

  /**
   * Idempotent: create the member_profiles row if it does not exist.
   * Must be called after a verified login.
   */
  async ensureProfile(user) {
    if (!user?.id) return;
    try {
      const { data: existing } = await supabaseClient
        .from('member_profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (!existing) {
        const meta = user.user_metadata || {};
        const { error } = await supabaseClient.from('member_profiles').insert({
          id:         user.id,
          first_name: meta.first_name || '',
          last_name:  meta.last_name  || '',
          phone:      meta.phone      || ''
        });
        // PGRST409 = duplicate key — another tab beat us to it, safe to ignore
        if (error && !error.code?.includes('23505') && !error.message?.includes('duplicate')) {
          console.warn('[memberAuth] ensureProfile insert error:', error.code);
        }
      }
    } catch (e) {
      // Non-fatal: profile will be created on next visit
      console.warn('[memberAuth] ensureProfile failed silently:', e.message);
    }
  },

  /**
   * Fetch the member's own profile row.
   */
  async getProfile(userId) {
    const { data, error } = await supabaseClient
      .from('member_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  /**
   * Update mutable profile fields (first_name, last_name, phone).
   * RLS ensures members can only update their own row.
   */
  async updateProfile(userId, updates) {
    // Whitelist allowed fields — never allow id, created_at, avatar_url via this path
    const safe = {};
    if (updates.first_name !== undefined) safe.first_name = String(updates.first_name).slice(0, 100);
    if (updates.last_name  !== undefined) safe.last_name  = String(updates.last_name).slice(0, 100);
    if (updates.phone      !== undefined) safe.phone      = String(updates.phone).slice(0, 30);

    const { data, error } = await supabaseClient
      .from('member_profiles')
      .update(safe)
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};
