-- ============================================================
-- Member Portal Migration - Phase 1
-- Creates member_profiles table linked to auth.users.
-- This is the ONLY database change required for Phase 1.
-- Run this once in the Supabase SQL editor.
-- ============================================================

-- 1. Create the member_profiles table
CREATE TABLE IF NOT EXISTS public.member_profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name    TEXT NOT NULL DEFAULT '',
  last_name     TEXT NOT NULL DEFAULT '',
  phone         TEXT DEFAULT '',
  avatar_url    TEXT DEFAULT '',
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable Row Level Security
ALTER TABLE public.member_profiles ENABLE ROW LEVEL SECURITY;

-- 3. RLS: Members can read their own profile only
DROP POLICY IF EXISTS "Member can read own profile" ON public.member_profiles;
CREATE POLICY "Member can read own profile"
  ON public.member_profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- 4. RLS: Members can insert their own profile (once, on registration)
DROP POLICY IF EXISTS "Member can insert own profile" ON public.member_profiles;
CREATE POLICY "Member can insert own profile"
  ON public.member_profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- 5. RLS: Members can update their own profile
DROP POLICY IF EXISTS "Member can update own profile" ON public.member_profiles;
CREATE POLICY "Member can update own profile"
  ON public.member_profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- 6. Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_member_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_member_profiles_updated_at ON public.member_profiles;
CREATE TRIGGER set_member_profiles_updated_at
  BEFORE UPDATE ON public.member_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_member_profiles_updated_at();

-- NOTES:
-- Admin accounts (user_metadata.role = 'admin'/'super_admin') are unaffected.
-- Members are normal Supabase Auth users with no role metadata.
-- Admin routes check user_metadata.role - members will never pass that check.
-- Anon users cannot read member_profiles (no anon SELECT policy).
