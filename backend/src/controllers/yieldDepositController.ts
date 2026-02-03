import { Request, Response } from "express";
import { YieldDeposit } from "../models";
import { logger } from "../middleware/errorHandler";

export class YieldDepositController {
  /**
   * Create a new yield deposit
   */
  static async createYieldDeposit(req: Request, res: Response): Promise<void> {
    try {
      const { user_address, deposit_amount, duration, expectedAPY, useAave } = req.body;

      // If no user_address provided and user is authenticated, use authenticated user's address
      const finalUserAddress = user_address || req.user?.walletAddress;

      if (!finalUserAddress) {
        res.status(400).json({
          error: "user_address is required or user must be authenticated",
        });
        return;
      }

      // Validate required fields
      if (!finalUserAddress || !deposit_amount || !duration || !expectedAPY) {
        res.status(400).json({
          error:
            "Missing required fields: user_address, deposit_amount, duration, expectedAPY",
        });
        return;
      }

      // Validate data types and ranges
      const depositAmount = parseFloat(deposit_amount);
      const durationDays = parseInt(duration);
      const apy = parseFloat(expectedAPY);

      if (isNaN(depositAmount) || depositAmount <= 0) {
        res.status(400).json({ error: "Invalid deposit amount" });
        return;
      }

      if (isNaN(durationDays) || durationDays < 1 || durationDays > 3650) {
        res.status(400).json({ error: "Invalid duration (1-3650 days)" });
        return;
      }

      if (isNaN(apy) || apy < 0 || apy > 100) {
        res.status(400).json({ error: "Invalid APY (0-100%)" });
        return;
      }

      // Create yield deposit
      const yieldDeposit = await YieldDeposit.create({
        user_address: finalUserAddress.toLowerCase(),
        deposit_amount: depositAmount.toString(),
        duration_days: durationDays,
        expected_apy: apy.toString(),
        status: "pending",
        use_aave: !!useAave,
      });

      logger.info(
        `Yield deposit created: ${yieldDeposit.id} for ${finalUserAddress}`
      );

      res.status(201).json({
        message: "Yield deposit created successfully",
        data: {
          id: yieldDeposit.id,
          user_address: yieldDeposit.user_address,
          deposit_amount: yieldDeposit.deposit_amount,
          duration_days: yieldDeposit.duration_days,
          expected_apy: yieldDeposit.expected_apy,
          status: yieldDeposit.status,
          created_at: yieldDeposit.created_at,
        },
      });
    } catch (error) {
      logger.error("Error creating yield deposit:", error);
      res.status(500).json({ error: "Failed to create yield deposit" });
      return;
    }
  }

  /**
   * Get yield deposits for a user
   */
  static async getUserYieldDeposits(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { address } = req.params;
      const { status, limit = 10, offset = 0 } = req.query;

      const whereClause: any = {
        user_address: address.toLowerCase(),
      };

      if (status) {
        whereClause.status = status;
      }

      const yieldDeposits = await YieldDeposit.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        order: [["created_at", "DESC"]],
      });

      res.json({
        data: yieldDeposits.rows,
        pagination: {
          total: yieldDeposits.count,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
        },
      });
    } catch (error) {
      logger.error("Error fetching user yield deposits:", error);
      res.status(500).json({ error: "Failed to fetch yield deposits" });
      return;
    }
  }

  /**
   * Get yield deposit by ID
   */
  static async getYieldDepositById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const yieldDeposit = await YieldDeposit.findByPk(id);

      if (!yieldDeposit) {
        res.status(404).json({ error: "Yield deposit not found" });
        return;
      }

      res.json({ data: yieldDeposit });
    } catch (error) {
      logger.error("Error fetching yield deposit:", error);
      res.status(500).json({ error: "Failed to fetch yield deposit" });
      return;
    }
  }

  /**
   * Update yield deposit status
   */
  static async updateYieldDepositStatus(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { id } = req.params;
      const { status, tx_hash } = req.body;

      const validStatuses = ["pending", "active", "completed", "cancelled"];
      if (!validStatuses.includes(status)) {
        res.status(400).json({ error: "Invalid status" });
        return;
      }

      const yieldDeposit = await YieldDeposit.findByPk(id);

      if (!yieldDeposit) {
        res.status(404).json({ error: "Yield deposit not found" });
        return;
      }

      const updateData: any = { status };

      if (status === "active" && !yieldDeposit.activated_at) {
        updateData.activated_at = new Date();
      }

      if (status === "completed" && !yieldDeposit.completed_at) {
        updateData.completed_at = new Date();
      }

      if (tx_hash) {
        updateData.tx_hash = tx_hash;
      }

      await yieldDeposit.update(updateData);

      logger.info(`Yield deposit ${id} status updated to ${status}`);

      res.json({
        message: "Yield deposit status updated successfully",
        data: yieldDeposit,
      });
    } catch (error) {
      logger.error("Error updating yield deposit status:", error);
      res.status(500).json({ error: "Failed to update yield deposit status" });
      return;
    }
  }
}
