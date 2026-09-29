import express from 'express';
import nodemailer from 'nodemailer';
import { supabase } from './supabaseClient.js';
import { requireAuth } from './authMiddleware.js';
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
router.get('/', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase.from('contacts').select('*').order('created_at', { ascending: false }).limit(200);
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

    // Honeypot check
    if (honeypot) {
      console.warn(`Spam bot caught from IP: ${ip}`);
      return res.status(200).json({ success: true, message: 'Message sent successfully.' });
    }

    if (!firstName || !lastName || !phone || !email || !message) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const safeFirstName = String(firstName).trim().substring(0, 100);
    const safeLastName = String(lastName).trim().substring(0, 100);
    const safePhone = String(phone).trim().substring(0, 50);
    const safeEmail = String(email).trim().substring(0, 255);
    const safeMessage = String(message).trim().substring(0, 5000);
    const fullName = `${safeFirstName} ${safeLastName}`;

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

    // Optional: Send email
    if (process.env.SMTP_USER) {
      try {
        await transporter.sendMail({
          from: process.env.MAIL_FROM || `"Website Contact" <${process.env.SMTP_USER}>`,
          to: process.env.CONTACT_EMAIL || 'support@cbcsecbad.in',
          replyTo: safeEmail,
          subject: 'New Website Contact',
          text: `Name: ${fullName}\nPhone: ${safePhone}\nEmail: ${safeEmail}\n\nMessage:\n${safeMessage}`,
        });
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
