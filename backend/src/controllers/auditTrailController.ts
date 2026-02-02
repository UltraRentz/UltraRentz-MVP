import { Request, Response } from "express";
import { ethers } from "ethers";
import { escrowContract } from "../config/blockchain";

export class AuditTrailController {
  /**
   * Get on-chain event history for a deposit
   */
  static async getDepositAuditTrail(req: Request, res: Response): Promise<void> {
    try {
      const { depositId } = req.params;
      // Query events for this depositId
      const filter = escrowContract.filters.DepositReceived(Number(depositId));
      const events = await escrowContract.queryFilter(filter, 0, "latest");
      // TODO: Add more event types (DepositReleased, DisputeTriggered, etc.)
      // Map and return events
      const history = events.map(e => ({
        event: e.event,
        args: e.args,
        blockNumber: e.blockNumber,
        transactionHash: e.transactionHash,
        timestamp: null, // Optionally fetch block timestamp
      }));
      res.json({ history });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch audit trail" });
    }
  }
}
