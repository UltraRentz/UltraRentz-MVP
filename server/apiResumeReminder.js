// server/apiResumeReminder.js
// Express route handler to send a resume onboarding email if user abandons after email verification

const express = require('express');
const router = express.Router();
const { sendEmail } = require('./sendgrid');

// In-memory store for demo; use DB in production
const resumeReminders = {}; // { email: { address, name, lastStep, timestamp, sent } }

// POST /api/save-onboarding-progress
router.post('/save-onboarding-progress', (req, res) => {
  const { email, name, address, lastStep } = req.body;
  if (!email || !address) return res.status(400).json({ error: 'Missing required fields' });
  resumeReminders[email] = {
    address,
    name: name || '',
    lastStep: lastStep || 'email_verified',
    timestamp: Date.now(),
    sent: false
  };
  res.json({ success: true });
});

// Periodic check (every 10 min): send resume email if >2h since lastStep and not sent
setInterval(async () => {
  const now = Date.now();
  for (const [email, data] of Object.entries(resumeReminders)) {
    if (!data.sent && now - data.timestamp > 2 * 60 * 60 * 1000) {
      const subject = 'Resume your UltraRentz deposit';
      const html = `<p>Hi ${data.name || ''}, your UltraRentz deposit for <b>${data.address}</b> is ready to be secured.</p><p><a href="https://ultrarentz.app/resume?email=${encodeURIComponent(email)}">Click here to pick up where you left off.</a></p>`;
      const text = `Hi ${data.name || ''}, your UltraRentz deposit for ${data.address} is ready to be secured. Resume here: https://ultrarentz.app/resume?email=${encodeURIComponent(email)}`;
      try {
        await sendEmail({ to: [email], subject, text, html });
        data.sent = true;
      } catch (err) {
        console.error('Failed to send resume reminder:', err);
      }
    }
  }
}, 10 * 60 * 1000); // every 10 min

module.exports = router;
