-- Migration 02: Row Level Security (RLS) Remediation
-- This script secures the database from direct REST API manipulation using the public anon key.

-- 1. Enable RLS on all tables (forces all requests to pass a policy)
ALTER TABLE IF EXISTS public.sermons ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ministries ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.leadership ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.campus ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.visitors ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing dangerous policies (if they exist)
DO $$ 
DECLARE 
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public' 
          AND policyname ILIKE '%anon%' 
          AND (cmd = 'INSERT' OR cmd = 'UPDATE' OR cmd = 'DELETE')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- Specifically drop the known dangerous policies on sermons
DROP POLICY IF EXISTS "Allow anon insert" ON public.sermons;
DROP POLICY IF EXISTS "Allow anon update" ON public.sermons;
DROP POLICY IF EXISTS "Allow anon delete" ON public.sermons;

-- 3. Create READ-ONLY public access for website content tables
-- The Node.js backend uses the Service Role key, so it bypasses RLS for INSERT/UPDATE/DELETE.
-- We only need to allow public read (SELECT) for tables that might be queried directly by the frontend
-- (Even if the frontend goes through the backend, this is safe for non-sensitive data).

-- Sermons
DROP POLICY IF EXISTS "Public can read sermons" ON public.sermons;
CREATE POLICY "Public can read sermons" ON public.sermons FOR SELECT TO public USING (true);

-- Ministries
DROP POLICY IF EXISTS "Public can read ministries" ON public.ministries;
CREATE POLICY "Public can read ministries" ON public.ministries FOR SELECT TO public USING (true);

-- Leadership
DROP POLICY IF EXISTS "Public can read leadership" ON public.leadership;
CREATE POLICY "Public can read leadership" ON public.leadership FOR SELECT TO public USING (true);

-- Campus
DROP POLICY IF EXISTS "Public can read campus" ON public.campus;
CREATE POLICY "Public can read campus" ON public.campus FOR SELECT TO public USING (true);

-- Events
DROP POLICY IF EXISTS "Public can read events" ON public.events;
CREATE POLICY "Public can read events" ON public.events FOR SELECT TO public USING (true);

-- Gallery
DROP POLICY IF EXISTS "Public can read gallery" ON public.gallery;
CREATE POLICY "Public can read gallery" ON public.gallery FOR SELECT TO public USING (true);

-- Site Settings
DROP POLICY IF EXISTS "Public can read settings" ON public.site_settings;
CREATE POLICY "Public can read settings" ON public.site_settings FOR SELECT TO public USING (true);

-- 4. Explicitly ensure NO public access to sensitive tables
-- Since RLS is enabled and no SELECT policies are created, anon users cannot read these.
-- (Service role key used by the backend will still be able to access them).
DROP POLICY IF EXISTS "Public can read donations" ON public.donations;
DROP POLICY IF EXISTS "Public can read audit_logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Public can read contacts" ON public.contacts;
DROP POLICY IF EXISTS "Public can read visitors" ON public.visitors;
