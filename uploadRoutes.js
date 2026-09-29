import express from 'express';
import multer from 'multer';
import { supabase } from './supabaseClient.js';
import { requireAuth } from './authMiddleware.js';
const router = express.Router();
import crypto from 'crypto';

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
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const file = req.file;
      const mimeMap = { 'image/jpeg': 'jpeg', 'image/png': 'png', 'image/webp': 'webp' };
      const ext = mimeMap[file.mimetype] || 'bin';
      const fileName = `${crypto.randomUUID()}.${ext}`;
      
      const { error } = await supabase.storage
        .from('public-images')
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: false
        });

      if (error) {
        console.error('Supabase upload error:', error);
        return res.status(500).json({ error: 'File upload failed' });
      }

      const { data: publicUrlData } = supabase.storage
        .from('public-images')
        .getPublicUrl(fileName);

      res.status(201).json({ url: publicUrlData.publicUrl });
    } catch (error) {
      console.error('Upload Error:', error);
      res.status(500).json({ error: 'File upload failed' });
    }
  });
});

export default router;
