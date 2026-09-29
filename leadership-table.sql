-- Run this in your Supabase SQL editor
-- Leadership table for Centenary Baptist Church

CREATE TABLE IF NOT EXISTS leadership (
  id           BIGSERIAL PRIMARY KEY,
  name         TEXT NOT NULL,
  role         TEXT NOT NULL,
  category     TEXT NOT NULL DEFAULT 'pastoral',  -- 'pastoral' | 'executive'
  bio          TEXT,
  image_url    TEXT,
  order_index  INTEGER DEFAULT 99,
  is_active    BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Seed with existing pastoral team data
INSERT INTO leadership (name, role, category, bio, order_index, is_active) VALUES
  ('Rev. Dr. M. Purushotham', 'Senior Pastor',    'pastoral',   'Leading Centenary Baptist Church with vision and faithfulness, Rev. Dr. M. Purushotham serves as Senior Pastor, guiding the congregation in worship, discipleship and outreach.', 1, true),
  ('Rev. Dr. V. Satyaranjan', 'Associate Pastor', 'pastoral',   'Serving alongside the pastoral team, Rev. Dr. V. Satyaranjan ministers to the congregation with dedication and a heart for the people of God.', 2, true),
  ('Rev. B. Charles Theodore', 'Associate Pastor','pastoral',   'Rev. B. Charles Theodore faithfully serves as Associate Pastor, supporting the church''s ministry and outreach across campuses.', 3, true),
  ('Rev. G. James Zechariah', 'Associate Pastor', 'pastoral',   'Rev. G. James Zechariah ministers with compassion and commitment, helping shepherd the congregation in their walk of faith.', 4, true)
ON CONFLICT DO NOTHING;

-- Seed with existing executive committee data
INSERT INTO leadership (name, role, category, order_index, is_active) VALUES
  ('Rev. Dr. M. Purushotham', 'Church Pastor',                              'executive', 1, true),
  ('T. Yesurathnam',          'President',                                  'executive', 2, true),
  ('S. Ranjeet Kishore',      'Secretary',                                  'executive', 3, true),
  ('A. Joshua Samson',        'Treasurer',                                  'executive', 4, true),
  ('12 members (incl. 2 women)', 'Deacons',                                 'executive', 5, true),
  ('To be confirmed by church office', 'Vice-President / Asst. Secretary / Asst. Treasurer', 'executive', 6, true)
ON CONFLICT DO NOTHING;
