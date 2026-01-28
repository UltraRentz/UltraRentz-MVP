
// server/routes/accountAbstractionRoutes.cjs
const express = require('express');
const router = express.Router();
const { onboardEmailSignatory, approveEscrow } = require('../accountAbstraction.cjs');

// GET /api/escrows-by-email?email=foo@bar.com
router.get('/escrows-by-email', (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'Missing email' });
  // signatoryAccounts is in-memory in accountAbstraction.js
  const { signatoryAccounts } = require('../accountAbstraction.cjs');
  const escrows = signatoryAccounts[email] || [];
  // Only return escrowId and address for dashboard
  res.json({ escrows: escrows.map(e => ({ escrowId: e.escrowId, address: e.address })) });
});

// POST /api/onboard-signatory
router.post('/onboard-signatory', async (req, res) => {
  const { email, escrowId } = req.body;
  if (!email || !escrowId) return res.status(400).json({ error: 'Missing email or escrowId' });
  try {
    const address = await onboardEmailSignatory(email, escrowId);
    res.json({ address });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/approve-escrow
router.post('/approve-escrow', async (req, res) => {
  const { email, escrowId, contractAddress, abi } = req.body;
  if (!email || !escrowId || !contractAddress || !abi) return res.status(400).json({ error: 'Missing required fields' });
  try {
    const tx = await approveEscrow(email, escrowId, contractAddress, abi);
    res.json({ txHash: tx.hash });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
