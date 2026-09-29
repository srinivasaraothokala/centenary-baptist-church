import express from 'express';
import multer from 'multer';
import { supabase } from './supabaseClient.js';
import { requireAuth } from './authMiddleware.js';
const router = express.Router();
import crypto from 'crypto';

const BUCKET = 'public-images';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('INVALID_FILE_TYPE'));
    }
  }
});


// GET /api/media — list all files in Supabase Storage bucket
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase.storage.from(BUCKET).list('', {
      limit: 500,
      sortBy: { column: 'created_at', order: 'desc' }
    });
    if (error) throw error;

    // Attach public URLs
    const files = (data || [])
      .filter(f => f.name && !f.name.startsWith('.')) // skip hidden/placeholder files
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

// POST /api/media — upload a new file
router.post('/', requireAuth, (req, res) => {
  upload.single('file')(req, res, async (err) => {
    if (err) {
      if (err.message === 'INVALID_FILE_TYPE') {
        return res.status(400).json({ error: 'Invalid file type. Only JPG, PNG, and WebP are allowed.' });
      }
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'File too large. Maximum size is 5MB.' });
      }
      return res.status(400).json({ error: 'File upload error' });
    }

    try {
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

      const file = req.file;
      const mimeMap = { 'image/jpeg': 'jpeg', 'image/png': 'png', 'image/webp': 'webp' };
      const ext = mimeMap[file.mimetype] || 'bin';
      // Generate safe filename using crypto.randomUUID()
      const safeName = crypto.randomUUID();
      const fileName = `${safeName}.${ext}`;

      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(fileName, file.buffer, { contentType: file.mimetype, upsert: false });
      if (error) {
        console.error('Supabase upload error:', error);
        return res.status(500).json({ error: 'Upload failed' });
      }

      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
      res.status(201).json({ name: fileName, url: urlData.publicUrl });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Upload failed' });
    }
  });
});

// DELETE /api/media/:filename — delete a file from storage
router.delete('/:filename', requireAuth, async (req, res) => {
  try {
    const filename = decodeURIComponent(req.params.filename);
    
    // Prevent path traversal
    if (filename.includes('/') || filename.includes('..')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }

    const { error } = await supabase.storage
      .from(BUCKET)
      .remove([filename]);
    if (error) {
      console.error('Supabase delete error:', error);
      return res.status(500).json({ error: 'Failed to delete file' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

export default router;
