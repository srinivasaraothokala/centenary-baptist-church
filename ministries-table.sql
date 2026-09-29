-- Run this in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS ministries (
  id               BIGSERIAL PRIMARY KEY,
  title            TEXT NOT NULL,
  slug             TEXT UNIQUE NOT NULL,         -- url-friendly: e.g. "youth", "medical-ministry"
  short_desc       TEXT,                          -- 1-2 sentences for cards
  full_desc        TEXT,                          -- full detail for ministry page
  icon             TEXT DEFAULT '✝',
  image_url        TEXT,
  leader_name      TEXT,
  meeting_time     TEXT,                          -- e.g. "Every Sunday, 5:00 PM"
  meeting_location TEXT,                          -- e.g. "Youth Hall, CBC Campus"
  contact_email    TEXT,
  is_active        BOOLEAN DEFAULT true,
  sort_order       INTEGER DEFAULT 99,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Seed the existing 7 ministries
INSERT INTO ministries (title, slug, short_desc, icon, image_url, is_active, sort_order) VALUES
  ('Children & Sunday School', 'children-sunday-school', 'Nurturing the next generation in faith through age-appropriate Biblical teaching and fun activities.', '♥', '/assets/children.jpg', true, 1),
  ('Youth',                    'youth',                  'Equipping young people to live boldly for Christ through fellowship, discipleship and outreach.',   '👥', '/assets/youth.jpg',    true, 2),
  ('Women',                    'women',                  'A community of women growing together through prayer, Bible study, and service.',                    '👤', '/assets/women.jpg',    true, 3),
  ('Missions',                 'missions',               'Supporting outreach centres across Telangana to bring the Gospel to unreached communities.',         '🌐', '/assets/missions.jpg', true, 4),
  ('Medical Ministry',         'medical-ministry',       'Serving the physical needs of our community with compassion, care and the love of Christ.',          '⚕',  '/assets/medical.jpg',  true, 5),
  ('Music',                    'music',                  'Leading the congregation in joyful, Spirit-filled worship through music, choir and instruments.',    '🎵', '/assets/music.jpg',    true, 6),
  ('CBC School',               'cbc-school',             'Providing quality education grounded in Christian values to children in our community.',              '🏛', '/assets/school.jpg',   true, 7)
ON CONFLICT (slug) DO NOTHING;
