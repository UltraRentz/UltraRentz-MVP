// server/utils/approvalToken.js
const crypto = require('crypto');
const TOKEN_SECRET = process.env.APPROVAL_TOKEN_SECRET || 'change_this_secret';

// Generate a secure, single-use token for signatory approval links
function generateApprovalToken(email, escrowId) {
  const data = `${email}:${escrowId}:${Date.now()}`;
  return crypto.createHmac('sha256', TOKEN_SECRET).update(data).digest('hex');
}

// In-memory store for demo; use DB with expiry in production
const tokenStore = {}; // { token: { email, escrowId, expiresAt } }

function storeApprovalToken(token, email, escrowId) {
  tokenStore[token] = { email, escrowId, expiresAt: Date.now() + 1000 * 60 * 60 };
}

function validateApprovalToken(token) {
  const entry = tokenStore[token];
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    delete tokenStore[token];
    return null;
  }
  return entry;
}

module.exports = { generateApprovalToken, storeApprovalToken, validateApprovalToken };
