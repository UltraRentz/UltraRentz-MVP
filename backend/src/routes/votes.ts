import { Router } from "express";
import { Vote } from "../models/Vote";

const router = Router();

// GET /api/votes/:depositId - Get all votes for a dispute
router.get("/:depositId", async (req, res) => {
  try {
    const { depositId } = req.params;
    const votes = await Vote.findAll({ where: { deposit_id: depositId } });
    res.json({ votes });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch votes" });
  }
});

export default router;
