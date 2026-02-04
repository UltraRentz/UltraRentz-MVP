import { Router } from "express";
import { Vote } from "../models/Vote";
import { Deposit } from "../models/Deposit";
import { Dispute } from "../models/Dispute";

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

// POST /api/votes/:depositId - Cast a vote on a dispute
router.post("/:depositId", async (req, res) => {
  try {
    const { depositId } = req.params;
    const { voterAddress, choice, signature } = req.body;

    // Validate required fields
    if (!voterAddress || !choice) {
      return res.status(400).json({ error: "voterAddress and choice are required" });
    }

    // Validate choice
    const validChoices = ["refund_tenant", "pay_landlord", "split"];
    if (!validChoices.includes(choice)) {
      return res.status(400).json({
        error: `Invalid choice. Must be one of: ${validChoices.join(", ")}`
      });
    }

    // Check if deposit exists
    const deposit = await Deposit.findByPk(depositId);
    if (!deposit) {
      return res.status(404).json({ error: "Deposit not found" });
    }

    // Check if there's an active dispute for this deposit
    const dispute = await Dispute.findOne({
      where: { deposit_id: depositId, status: "active" }
    });
    if (!dispute) {
      return res.status(400).json({ error: "No active dispute for this deposit" });
    }

    // Check if user already voted
    const existingVote = await Vote.findOne({
      where: { deposit_id: depositId, address: voterAddress.toLowerCase() }
    });
    if (existingVote) {
      return res.status(400).json({ error: "You have already voted on this dispute" });
    }

    // Create the vote
    const vote = await Vote.create({
      deposit_id: depositId,
      address: voterAddress.toLowerCase(),
      choice,
      signature: signature || null,
      voted_at: new Date(),
    });

    // Get updated vote count
    const allVotes = await Vote.findAll({ where: { deposit_id: depositId } });
    const voteCount = {
      refund_tenant: allVotes.filter(v => v.get("choice") === "refund_tenant").length,
      pay_landlord: allVotes.filter(v => v.get("choice") === "pay_landlord").length,
      split: allVotes.filter(v => v.get("choice") === "split").length,
      total: allVotes.length,
    };

    // Check if threshold reached (4 of 6 for same choice = resolution)
    const threshold = 4;
    let resolutionReached = false;
    let winningChoice = null;

    if (voteCount.refund_tenant >= threshold) {
      winningChoice = "refund_tenant";
      resolutionReached = true;
    } else if (voteCount.pay_landlord >= threshold) {
      winningChoice = "pay_landlord";
      resolutionReached = true;
    }

    // If resolution reached, update dispute status
    if (resolutionReached && winningChoice) {
      await Dispute.update(
        {
          status: "resolved",
          resolution: winningChoice,
          resolved_at: new Date(),
        },
        { where: { id: dispute.get("id") } }
      );
    }

    res.status(201).json({
      success: true,
      vote: {
        id: vote.get("id"),
        address: vote.get("address"),
        choice: vote.get("choice"),
        voted_at: vote.get("voted_at"),
      },
      voteCount,
      resolutionReached,
      winningChoice,
    });

  } catch (error: any) {
    console.error("Error casting vote:", error);
    res.status(500).json({ error: error.message || "Failed to cast vote" });
  }
});

// GET /api/votes/:depositId/can-vote/:address - Check if user can vote
router.get("/:depositId/can-vote/:address", async (req, res) => {
  try {
    const { depositId, address } = req.params;

    // Check if there's an active dispute
    const dispute = await Dispute.findOne({
      where: { deposit_id: depositId, status: "active" }
    });
    if (!dispute) {
      return res.json({ canVote: false, reason: "No active dispute" });
    }

    // Check if already voted
    const existingVote = await Vote.findOne({
      where: { deposit_id: depositId, address: address.toLowerCase() }
    });
    if (existingVote) {
      return res.json({
        canVote: false,
        reason: "Already voted",
        existingChoice: existingVote.get("choice"),
      });
    }

    res.json({ canVote: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to check vote eligibility" });
  }
});

export default router;
