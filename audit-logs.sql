-- Run this in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS audit_logs (
  id          BIGSERIAL PRIMARY KEY,
  user_email  TEXT,                          -- which admin performed the action
  action      TEXT NOT NULL,                 -- 'created', 'updated', 'deleted', 'login', 'logout'
  entity_type TEXT NOT NULL,                 -- 'sermon', 'event', 'gallery', 'ministry', 'campus', 'settings', 'user'
  entity_id   TEXT,                          -- ID of the affected record
  entity_name TEXT,                          -- human-readable label (e.g. sermon title)
  details     JSONB,                         -- extra data (changed fields, etc.)
  ip_address  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast filtering
CREATE INDEX IF NOT EXISTS idx_audit_logs_action      ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at  ON audit_logs(created_at DESC);
