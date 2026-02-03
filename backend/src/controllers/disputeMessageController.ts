import { Request, Response } from "express";
import { DisputeMessage } from "../models";

export class DisputeMessageController {
  static async getMessages(req: Request, res: Response): Promise<void> {
    try {
      const { disputeId } = req.params;
      const messages = await DisputeMessage.findAll({
        where: { dispute_id: disputeId },
        order: [["created_at", "ASC"]],
      });
      res.json({ messages });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  }

  static async postMessage(req: Request, res: Response): Promise<void> {
    try {
      const { disputeId } = req.params;
      const sender = req.user?.address?.toLowerCase();
      const { message } = req.body;
      if (!sender || !message) {
        res.status(400).json({ error: "Missing sender or message" });
        return;
      }
      const msg = await DisputeMessage.create({
        dispute_id: disputeId,
        sender,
        message,
      });
      // Optionally emit websocket event here
      res.json({ message: msg });
    } catch (error) {
      res.status(500).json({ error: "Failed to post message" });
    }
  }
}
