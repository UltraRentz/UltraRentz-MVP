// server/routes/approvalActionRoutes.cjs
const express = require('express');
const router = express.Router();
const { validateApprovalToken } = require('../utils/approvalToken.cjs');
const { approveEscrow } = require('../accountAbstraction.cjs');

// POST /api/approve-action
router.post('/approve-action', async (req, res) => {
  const { token, contractAddress, abi } = req.body;
  if (!token || !contractAddress || !abi) return res.status(400).json({ error: 'Missing required fields' });
  const entry = validateApprovalToken(token);
  if (!entry) return res.status(401).json({ error: 'Invalid or expired token' });
  try {
    const tx = await approveEscrow(entry.email, entry.escrowId, contractAddress, abi);
    res.json({ txHash: tx.hash });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
