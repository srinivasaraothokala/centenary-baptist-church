-- Site Settings Table
-- Stores all global website configuration as a single JSONB row

CREATE TABLE IF NOT EXISTS site_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  settings JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by TEXT DEFAULT 'System'
);

-- Insert the default settings row (only one row ever exists)
INSERT INTO site_settings (id, settings, updated_by)
VALUES (1, '{
  "church": {
    "name": "Centenary Baptist Church",
    "shortName": "Centenary Baptist Church",
    "tagline": "The First Baptist Church in Telangana State",
    "establishedYear": "1875",
    "description": "Worshipping God and serving our community in Secunderabad since 1875.",
    "logo": "",
    "favicon": ""
  },
  "contact": {
    "address": "Plot No. 61/A, St. Mary''s Road, Regimental Bazaar / Shivaji Nagar",
    "city": "Secunderabad",
    "state": "Telangana",
    "pinCode": "500003",
    "country": "India",
    "phone": "+91 040-XXXXXXX",
    "alternatePhone": "",
    "email": "support@cbcsecbad.in",
    "whatsapp": "",
    "officeHours": "Monday - Friday: 9:00 AM - 5:00 PM\nSaturday: 9:00 AM - 1:00 PM\nSunday: Before/After Services",
    "mapsUrl": "",
    "mapsEmbedUrl": ""
  },
  "social": {
    "youtube": "https://www.youtube.com/@centenarybaptistchurch6147",
    "facebook": "",
    "instagram": "",
    "twitter": "",
    "whatsapp": "",
    "linkedin": "",
    "showIcons": true
  },
  "watchLive": {
    "enabled": true,
    "url": "https://www.youtube.com/@centenarybaptistchurch6147",
    "buttonText": "WATCH LIVE",
    "platform": "YouTube",
    "showButton": true
  },
  "announcement": {
    "enabled": false,
    "text": "",
    "buttonText": "",
    "buttonUrl": "",
    "startDate": "",
    "endDate": "",
    "style": "Normal"
  },
  "seo": {
    "title": "Centenary Baptist Church | Est. 1875, Secunderabad",
    "description": "Centenary Baptist Church — worshipping at St. Mary''s Road, Secunderabad since 1875 in Telugu, English, Hindi.",
    "image": "",
    "googleVerification": "",
    "analyticsId": ""
  },
  "footer": {
    "description": "Worshipping God and serving our community in Secunderabad since 1875.",
    "address": "Plot No. 61/A, St. Mary''s Road, Secunderabad",
    "phone": "+91 040-XXXXXXX",
    "email": "support@cbcsecbad.in",
    "showSocialLinks": true,
    "copyright": "© {year} Centenary Baptist Church. All rights reserved."
  },
  "maintenance": {
    "enabled": false,
    "message": "We are currently performing scheduled maintenance. We will be back shortly.",
    "startDate": "",
    "endDate": ""
  }
}', 'System')
ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read settings (public website needs them)
CREATE POLICY "Public can read settings"
ON site_settings FOR SELECT TO public USING (true);

-- Only service role can update (backend uses service key)
CREATE POLICY "Service role can update settings"
ON site_settings FOR UPDATE TO service_role USING (true);
