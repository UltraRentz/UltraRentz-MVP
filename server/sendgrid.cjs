// server/sendgrid.js
// Node.js utility to send transactional emails using SendGrid

const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Send an email using SendGrid
 * @param {string[]} to - Array of recipient emails
 * @param {string} subject - Email subject
 * @param {string} text - Plain text body
 * @param {string} html - HTML body
 */
async function sendEmail({ to, subject, text, html }) {
  const msg = {
    to,
    from: process.env.SENDGRID_FROM_EMAIL, // Must be verified sender
    subject,
    text,
    html,
  };
  await sgMail.sendMultiple(msg);
}

module.exports = { sendEmail };
