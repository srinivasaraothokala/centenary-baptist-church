import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security Headers
app.use(helmet({
  contentSecurityPolicy: false, // Disabled to prevent breaking existing inline scripts/styles until properly audited
  crossOriginEmbedderPolicy: false // Disabled for cross-origin resources (Supabase, Maps)
}));

// CORS Configuration
const allowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',') 
  : (process.env.NODE_ENV === 'production' ? [] : ['http://localhost:5173', 'http://localhost:5174']);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());
import eventsRoutes from './eventsRoutes.js';
app.use('/api/events', eventsRoutes);

import donationRoutes from './donationRoutes.js';
app.use('/api/donations', donationRoutes);

// Serve uploads
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// Basic spam protection: rate limiting in memory
const ipRateLimit = new Map();
const RATE_LIMIT_MS = 60000; // 1 minute per IP
const RATE_LIMIT_MAX = 3;

function isRateLimited(ip) {
  const now = Date.now();
  if (!ipRateLimit.has(ip)) {
    ipRateLimit.set(ip, { count: 1, lastTime: now });
    return false;
  }
  const entry = ipRateLimit.get(ip);
  if (now - entry.lastTime > RATE_LIMIT_MS) {
    entry.count = 1;
    entry.lastTime = now;
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX;
}

import contactRoutes from './contactRoutes.js';
import visitorRoutes from './visitorRoutes.js';
import uploadRoutes from './uploadRoutes.js';
import galleryRoutes from './galleryRoutes.js';
import sermonRoutes from './sermonRoutes.js';
import adminUserRoutes from './adminUserRoutes.js';
import siteSettingsRoutes from './siteSettingsRoutes.js';

// Apply rate limiting middleware to the specific post endpoint inside contactRoutes? Or just apply it here.
app.use('/api/contact', (req, res, next) => {
  if (req.method === 'POST') {
    const ip = req.ip || req.connection.remoteAddress;
    if (isRateLimited(ip)) {
      return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }
  }
  next();
}, contactRoutes);

app.use('/api/visitor', visitorRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/sermons', sermonRoutes);
app.use('/api/admin-users', adminUserRoutes);
app.use('/api/settings', siteSettingsRoutes);

import ministriesRoutes from './ministriesRoutes.js';
app.use('/api/ministries', ministriesRoutes);

import campusRoutes from './campusRoutes.js';
app.use('/api/campus', campusRoutes);

import mediaRoutes from './mediaRoutes.js';
app.use('/api/media', mediaRoutes);

import auditLogRoutes from './auditLogRoutes.js';
app.use('/api/audit-logs', auditLogRoutes);

import leadershipRoutes from './leadershipRoutes.js';
app.use('/api/leadership', leadershipRoutes);

// Serve static files in production
if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'production_render') {
  app.use(express.static(path.join(__dirname, 'dist')));
  
  // Any request that doesn't match an API route or static file gets sent to index.html (client-side routing)
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api/')) {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    } else {
      res.status(404).json({ error: 'API route not found' });
    }
  });
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
