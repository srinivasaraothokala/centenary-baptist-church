-- ============================================================
-- Rate Limits Table — Persistent serverless-safe rate limiting
-- Run this SQL in your Supabase Dashboard > SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.rate_limits (
  ip       TEXT        NOT NULL,
  endpoint TEXT        NOT NULL DEFAULT ''contact'',
  count    INTEGER     NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (ip, endpoint)
);

-- Index for fast cleanup queries
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON public.rate_limits (window_start);

-- RLS: Only backend service-role key can read/write this table
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- No public access — only the service-role key (your backend) can touch it
CREATE POLICY "service_role_only" ON public.rate_limits
  USING (false)
  WITH CHECK (false);
