import express from 'express';
import multer from 'multer';
import { supabase } from './supabaseClient.js';
import { requireAuth, requireAdmin } from './authMiddleware.js';
const router = express.Router();
import crypto from 'crypto';

const BUCKET = 'public-images';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('INVALID_FILE_TYPE'));
  }
});

// GET /api/media — list all files in Supabase Storage bucket
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase.storage.from(BUCKET).list('', {
      limit: 500,
      sortBy: { column: 'created_at', order: 'desc' }
    });
    if (error) throw error;

    const files = (data || [])
      .filter(f => f.name && !f.name.startsWith('.'))
      .map(f => {
        const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(f.name);
        return {
          name: f.name,
          url: urlData.publicUrl,
          size: f.metadata?.size || 0,
          created_at: f.created_at,
          mimetype: f.metadata?.mimetype || 'image/*'
        };
      });

    res.json(files);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to list media files' });
  }
});

// GET /api/media/usage — returns map of { url -> [{ module, label }] }
// Queries all modules dynamically — zero schema changes
router.get('/usage', requireAuth, requireAdmin, async (req, res) => {
  try {
    const usageMap = {};
    const addUsage = (url, module, label) => {
      if (!url) return;
      if (!usageMap[url]) usageMap[url] = [];
      usageMap[url].push({ module, label });
    };

    const [sermons, events, leaders, gallery, ministries, campus] = await Promise.allSettled([
      supabase.from('sermons').select('title, thumbnail_url'),
      supabase.from('events').select('title, image_url'),
      supabase.from('leadership').select('name, image_url'),
      supabase.from('gallery').select('title, image_url'),
      supabase.from('ministries').select('name, image_url'),
      supabase.from('campus').select('name, image_url'),
    ]);

    if (sermons.status === 'fulfilled') (sermons.value.data || []).forEach(s => addUsage(s.thumbnail_url, 'Sermons & Videos', s.title || 'Untitled'));
    if (events.status === 'fulfilled')  (events.value.data  || []).forEach(e => addUsage(e.image_url, 'Events', e.title || 'Untitled'));
    if (leaders.status === 'fulfilled') (leaders.value.data || []).forEach(l => addUsage(l.image_url, 'Leadership', l.name || 'Unnamed'));
    if (gallery.status === 'fulfilled') (gallery.value.data || []).forEach(g => addUsage(g.image_url, 'Gallery', g.title || 'Gallery Image'));
    if (ministries.status === 'fulfilled') (ministries.value.data || []).forEach(m => addUsage(m.image_url, 'Ministries', m.name || 'Ministry'));
    if (campus.status === 'fulfilled')  (campus.value.data  || []).forEach(c => addUsage(c.image_url, 'Campus', c.name || 'Campus'));

    res.json(usageMap);
  } catch (err) {
    console.error('Usage query error:', err);
    res.status(500).json({ error: 'Failed to fetch usage data' });
  }
});

// POST /api/media — upload a new file
router.post('/', requireAuth, requireAdmin, (req, res) => {
  upload.single('file')(req, res, async (err) => {
    if (err) {
      if (err.message === 'INVALID_FILE_TYPE') return res.status(400).json({ error: 'Invalid file type. Only JPG, PNG, and WebP are allowed.' });
      if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'File too large. Maximum size is 5MB.' });
      return res.status(400).json({ error: 'File upload error' });
    }
    try {
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
      const file = req.file;
      const mimeMap = { 'image/jpeg': 'jpeg', 'image/png': 'png', 'image/webp': 'webp' };
      const ext = mimeMap[file.mimetype] || 'bin';
      const fileName = `${crypto.randomUUID()}.${ext}`;

      const { error } = await supabase.storage.from(BUCKET).upload(fileName, file.buffer, { contentType: file.mimetype, upsert: false });
      if (error) { console.error('Supabase upload error:', error); return res.status(500).json({ error: 'Upload failed' }); }

      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
      res.status(201).json({ name: fileName, url: urlData.publicUrl });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Upload failed' });
    }
  });
});

// DELETE /api/media/:filename
// Returns 409 with { error, usages } if file is currently referenced — pass ?force=true to override
router.delete('/:filename', requireAuth, requireAdmin, async (req, res) => {
  try {
    const filename = decodeURIComponent(req.params.filename);
    if (filename.includes('/') || filename.includes('..')) return res.status(400).json({ error: 'Invalid filename' });

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(filename);
    const publicUrl = urlData?.publicUrl;

    const force = req.query.force === 'true';
    if (!force && publicUrl) {
      const usages = [];
      const [s, e, l, g, m, c] = await Promise.allSettled([
        supabase.from('sermons').select('title').eq('thumbnail_url', publicUrl),
        supabase.from('events').select('title').eq('image_url', publicUrl),
        supabase.from('leadership').select('name').eq('image_url', publicUrl),
        supabase.from('gallery').select('title').eq('image_url', publicUrl),
        supabase.from('ministries').select('name').eq('image_url', publicUrl),
        supabase.from('campus').select('name').eq('image_url', publicUrl),
      ]);
      if (s.status === 'fulfilled') (s.value.data || []).forEach(x => usages.push({ module: 'Sermons & Videos', label: x.title }));
      if (e.status === 'fulfilled') (e.value.data || []).forEach(x => usages.push({ module: 'Events', label: x.title }));
      if (l.status === 'fulfilled') (l.value.data || []).forEach(x => usages.push({ module: 'Leadership', label: x.name }));
      if (g.status === 'fulfilled') (g.value.data || []).forEach(x => usages.push({ module: 'Gallery', label: x.title }));
      if (m.status === 'fulfilled') (m.value.data || []).forEach(x => usages.push({ module: 'Ministries', label: x.name }));
      if (c.status === 'fulfilled') (c.value.data || []).forEach(x => usages.push({ module: 'Campus', label: x.name }));

      if (usages.length > 0) {
        return res.status(409).json({ error: 'File is currently in use', usages });
      }
    }

    const { error } = await supabase.storage.from(BUCKET).remove([filename]);
    if (error) { console.error('Supabase delete error:', error); return res.status(500).json({ error: 'Failed to delete file' }); }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

export default router;
