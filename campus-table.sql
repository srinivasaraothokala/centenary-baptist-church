-- Run this in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS campus (
  id               BIGSERIAL PRIMARY KEY,
  title            TEXT NOT NULL,
  slug             TEXT UNIQUE NOT NULL,        -- e.g. "church-building", "sharon-fields"
  short_desc       TEXT,                         -- 1-2 sentences for cards
  full_desc        TEXT,                         -- full detail for campus detail page
  icon             TEXT DEFAULT '🏛',
  image_url        TEXT,
  address          TEXT,                         -- e.g. "St. Mary's Road, Secunderabad"
  map_url          TEXT,                         -- Google Maps link
  phone            TEXT,
  is_active        BOOLEAN DEFAULT true,
  sort_order       INTEGER DEFAULT 99,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Seed the 4 existing campus locations
INSERT INTO campus (title, slug, short_desc, icon, is_active, sort_order) VALUES
  ('Church Building',  'church-building',  'Our 1875 sanctuary at St. Mary''s Road, Secunderabad — the heart of Sunday worship.',  '⛪', true, 1),
  ('Sharon Fields',    'sharon-fields',    'Church-owned grounds used for camps, retreats and outdoor fellowship gatherings.',       '🌿', true, 2),
  ('Church School',    'church-school',    'A school ministry of the congregation serving children of the community.',               '🏫', true, 3),
  ('Cemetery',         'cemetery',         'Maintained for the burial of members and their families.',                               '✝',  true, 4)
ON CONFLICT (slug) DO NOTHING;
