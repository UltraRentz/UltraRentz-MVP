// server/routes/accountAbstractionRoutes.js
const express = require('express');
const router = express.Router();
const { onboardEmailSignatory, approveEscrow } = require('../accountAbstraction');

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
