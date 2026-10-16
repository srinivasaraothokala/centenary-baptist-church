import express from 'express';
import nodemailer from 'nodemailer';
import { supabase } from './supabaseClient.js';
import { requireAuth, requireAdmin } from './authMiddleware.js';
const router = express.Router();

// Nodemailer Transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

// GET /api/contact - Admin view all messages
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase.from('contacts').select('*').order('date', { ascending: false }).limit(200);
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// POST /api/contact - Submit new message
router.post('/', async (req, res) => {
  try {
    const ip = req.ip || req.connection.remoteAddress;
    const { firstName, lastName, phone, email, message, honeypot } = req.body;

    const { data: settingsRow, error: settingsError } = await supabase
      .from('site_settings')
      .select('settings')
      .eq('id', 1)
      .maybeSingle();
    if (settingsError) throw settingsError;
    const formSettings = settingsRow?.settings?.contactForm || {};
    if (formSettings.enabled === false) {
      return res.status(503).json({ error: 'The contact form is temporarily unavailable.' });
    }

    // Honeypot check
    if (honeypot) {
      console.warn(`Spam bot caught from IP: ${ip}`);
      return res.status(200).json({ success: true, message: 'Message sent successfully.' });
    }

    const safeFirstName = String(firstName).trim().substring(0, 100);
    const safeLastName = String(lastName).trim().substring(0, 100);
    const safePhone = String(phone).trim().substring(0, 50);
    const safeEmail = String(email).trim().substring(0, 255);
    const safeMessage = String(message).trim().substring(0, 5000);
    const fullName = `${safeFirstName} ${safeLastName}`;

    if (!safeFirstName || !safeLastName || !safePhone || !safeEmail || !safeMessage) {
      return res.status(400).json({ error: 'All fields are required.' });
    }
    if (safePhone.replace(/[^0-9+]/g, '').length < 8) {
      return res.status(400).json({ error: 'Please provide a valid phone number.' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(safeEmail)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    const newContact = {
      name: fullName,
      phone: safePhone,
      email: safeEmail,
      message: safeMessage
    };

    // Save to Supabase DB
    const { error } = await supabase.from('contacts').insert([newContact]);
    if (error) {
      console.error('Supabase insert error:', error);
      throw error;
    }

    // Optional: Send staff notification and a visitor auto-reply.
    if (process.env.SMTP_USER) {
      try {
        const notificationEmail = formSettings.notificationEmail || process.env.CONTACT_EMAIL || 'support@cbcsecbad.in';
        await transporter.sendMail({
          from: process.env.MAIL_FROM || `"Website Contact" <${process.env.SMTP_USER}>`,
          to: notificationEmail,
          replyTo: safeEmail,
          subject: 'New Website Contact',
          text: `Name: ${fullName}\nPhone: ${safePhone}\nEmail: ${safeEmail}\n\nMessage:\n${safeMessage}`,
        });

        if (formSettings.autoReplyEnabled && formSettings.autoReplyMessage) {
          await transporter.sendMail({
            from: process.env.MAIL_FROM || `"Centenary Baptist Church" <${process.env.SMTP_USER}>`,
            to: safeEmail,
            subject: 'Thank you for contacting Centenary Baptist Church',
            text: String(formSettings.autoReplyMessage).substring(0, 5000),
          });
        }
      } catch (e) {
        console.error("Email send failed, but saved to DB.");
      }
    }

    res.status(200).json({ success: true, message: 'Message sent successfully.' });
  } catch (error) {
    console.error('Contact Form Error:', error);
    res.status(500).json({ error: 'An error occurred while sending the message.' });
  }
});

export default router;
