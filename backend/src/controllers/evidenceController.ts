import { Request, Response } from "express";
import { Evidence, Dispute } from "../models";
import path from "path";

export class EvidenceController {
  static async uploadEvidence(req: Request, res: Response): Promise<void> {
    try {
      const { disputeId } = req.params;
      // @ts-ignore
      const userAddress = req.user?.walletAddress?.toLowerCase();
      // @ts-ignore
      if (!req.file) {
        res.status(400).json({ error: "No file uploaded" });
        return;
      }
      // Check dispute exists
      const dispute = await Dispute.findByPk(disputeId);
      if (!dispute) {
        res.status(404).json({ error: "Dispute not found" });
        return;
      }
      // Only parties to dispute can upload
      // (Assume landlord or tenant for now)
      // TODO: Add tenant check if needed
      // @ts-ignore
      if (userAddress !== dispute.triggered_by) {
        res.status(403).json({ error: "Not authorized to upload evidence" });
        return;
      }
      // @ts-ignore
      const fileUrl = `/uploads/${req.file.filename}`;
      const evidence = await Evidence.create({
        dispute_id: disputeId,
        uploaded_by: userAddress,
        file_url: fileUrl,
        // @ts-ignore
        file_type: req.file.mimetype,
        // @ts-ignore
        file_name: req.file.originalname,
      });
      res.json({ message: "Evidence uploaded", evidence });
    } catch (error) {
      res.status(500).json({ error: "Failed to upload evidence" });
    }
  }

  static async getEvidenceForDispute(req: Request, res: Response): Promise<void> {
    try {
      const { disputeId } = req.params;
      const evidence = await Evidence.findAll({
        where: { dispute_id: disputeId },
        order: [["created_at", "ASC"]],
      });
      res.json({ evidence });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch evidence" });
    }
  }
}
