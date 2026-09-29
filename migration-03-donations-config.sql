-- ============================================================
-- MIGRATION: Donation Configuration
-- Creates a single-row table to store donation configuration
-- safely in Supabase instead of a local JSON file.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.donation_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    note TEXT,
    qr_code_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    updated_by UUID REFERENCES auth.users(id)
);

-- Ensure only one row exists (singleton pattern)
CREATE UNIQUE INDEX IF NOT EXISTS donation_config_single_row ON public.donation_config ((true));

-- RLS Setup
ALTER TABLE public.donation_config ENABLE ROW LEVEL SECURITY;

-- Public can read
CREATE POLICY "Public can read donation config"
ON public.donation_config
FOR SELECT
TO public, anon
USING (true);

-- Only authenticated users (admins) can update
CREATE POLICY "Admins can update donation config"
ON public.donation_config
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Admins can insert donation config"
ON public.donation_config
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Insert default row if none exists
INSERT INTO public.donation_config (note, qr_code_url)
SELECT '', ''
WHERE NOT EXISTS (SELECT 1 FROM public.donation_config);
