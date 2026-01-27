// server/apiSendDepositNotification.js
// Express route handler to send deposit notifications using SendGrid

const express = require('express');
const router = express.Router();
const { sendEmail } = require('./sendgrid');
const { generateApprovalToken, storeApprovalToken } = require('./utils/approvalToken');

// POST /api/send-deposit-notification
router.post('/send-deposit-notification', async (req, res) => {
  const { renterEmail, landlordEmail, escrowId, amount, signatoryEmails = [] } = req.body;
  if (!renterEmail || !landlordEmail || !escrowId || !amount) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const recipients = [renterEmail, landlordEmail, ...signatoryEmails].filter(Boolean);
  const subject = `UltraRentz: Rent Deposit Created (Escrow #${escrowId})`;
  let html = `<p>A new rent deposit has been <b>created and locked in escrow</b>.</p><ul><li><b>Escrow ID:</b> ${escrowId}</li><li><b>Amount:</b> ${amount}</li></ul><p>You are receiving this notification as a party or signatory to the agreement.</p>`;

  // Add secure approval links for each email signatory
  if (signatoryEmails.length > 0) {
    html += '<ul>';
    for (const email of signatoryEmails) {
      const token = generateApprovalToken(email, escrowId);
      storeApprovalToken(token, email, escrowId);
      const approvalUrl = `${process.env.APPROVAL_BASE_URL || 'https://ultrarentz.app'}/sign/approve?escrowId=${escrowId}&token=${token}`;
      html += `<li><b>Signatory:</b> ${email} – <a href="${approvalUrl}">Approve or Reject (secure link)</a></li>`;
    }
    html += '</ul>';
  }

  const text = `A new rent deposit has been created and locked in escrow.\n\nEscrow ID: ${escrowId}\nAmount: ${amount}\n\nYou are receiving this notification as a party or signatory to the agreement.`;
  try {
    await sendEmail({ to: recipients, subject, text, html });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
