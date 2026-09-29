import express from 'express';
import multer from 'multer';
import { supabase } from './supabaseClient.js';
import { requireAuth } from './authMiddleware.js';
import crypto from 'crypto';

const router = express.Router();

// Multer setup for image upload (Memory Storage for Supabase)
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

// GET Config
router.get('/config', async (req, res) => {
  try {
    const { data, error } = await supabase.from('donation_config').select('note, qr_code_url').single();
    if (error) {
      return res.json({ note: '', qrCodeUrl: '' });
    }
    // Convert snake_case to camelCase for frontend
    res.json({ note: data.note || '', qrCodeUrl: data.qr_code_url || '' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch config' });
  }
});

// POST Config (Update note and optional QR code)
router.post('/config', requireAuth, (req, res) => {
  upload.single('qrCode')(req, res, async (err) => {
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
      let qrCodeUrl = undefined;
      if (req.file) {
        const file = req.file;
        const mimeMap = { 'image/jpeg': 'jpeg', 'image/png': 'png', 'image/webp': 'webp' };
        const ext = mimeMap[file.mimetype] || 'bin';
        const fileName = `qr-${crypto.randomUUID()}.${ext}`;
        
        const { error: uploadError } = await supabase.storage
          .from('public-images')
          .upload(fileName, file.buffer, {
            contentType: file.mimetype,
            upsert: false
          });
          
        if (uploadError) throw uploadError;
        
        const { data: publicUrlData } = supabase.storage
          .from('public-images')
          .getPublicUrl(fileName);
          
        qrCodeUrl = publicUrlData.publicUrl;
      }

      const updateData = {};
      if (req.body.note !== undefined) updateData.note = req.body.note;
      if (qrCodeUrl !== undefined) updateData.qr_code_url = qrCodeUrl;
      
      // Fetch the singleton ID to update it securely
      const { data: existing, error: fetchErr } = await supabase.from('donation_config').select('id').single();
      if (fetchErr) throw fetchErr;

      const { data: updatedConfig, error: updateErr } = await supabase
        .from('donation_config')
        .update(updateData)
        .eq('id', existing.id)
        .select()
        .single();
        
      if (updateErr) throw updateErr;

      res.json({ note: updatedConfig.note, qrCodeUrl: updatedConfig.qr_code_url });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to update config' });
    }
  });
});

// GET Donations (Admin)
router.get('/', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase.from('donations').select('*');
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch donations' });
  }
});

// POST Donation (Frontend submission)
router.post('/', async (req, res) => {
  try {
    const { name, amount, anonymous, email, purpose } = req.body;
    
    const finalName = anonymous ? 'Anonymous' : (name || 'Anonymous');
    
    const newDonation = {
      id: crypto.randomUUID(),
      name: finalName,
      amount: parseFloat(amount) || 0,
      anonymous: !!anonymous,
      email: anonymous ? null : (email || null),
      purpose: purpose || 'General Fund',
      date: new Date().toISOString()
    };

    const { data, error } = await supabase.from('donations').insert([newDonation]).select();
    if (error) throw error;
    
    res.status(201).json(data[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit donation' });
  }
});

export default router;
