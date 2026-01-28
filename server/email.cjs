// server/email.js
// Express endpoint for sending transactional emails via Neomail SMTP

const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());

// Configure with your Neomail SMTP credentials
const transporter = nodemailer.createTransport({
  host: process.env.NEOMAIL_SMTP_HOST || 'mail.yourdomain.com', // e.g. mail.yourdomain.com
  port: 465, // or 587 for TLS
  secure: true, // true for 465, false for 587
  auth: {
    user: process.env.NEOMAIL_USER, // your full email address
    pass: process.env.NEOMAIL_PASS, // your email password
  },
});

// POST /api/send-notification
app.post('/api/send-notification', async (req, res) => {
  const { to, subject, html } = req.body;
  if (!to || !subject || !html) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    await transporter.sendMail({
      from: process.env.NEOMAIL_USER,
      to,
      subject,
      html,
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Email send error:', err);
    res.status(500).json({ error: 'Failed to send email' });
  }
});


module.exports = app;

// Example usage (POST JSON):
// {
//   "to": "renter@example.com",
//   "subject": "UltraRentz: Payment Received",
//   "html": "<b>Your deposit has been received and locked in escrow.</b>"
// }
