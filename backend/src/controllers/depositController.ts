import { Request, Response } from "express";
import { query, param, validationResult } from "express-validator";
import { Deposit, Signatory, Vote, Dispute, YieldHistory } from "../models";
import { logger } from "../middleware/errorHandler";

export class DepositController {
  /**
   * Get all deposits with optional filters
   */
  static async getAllDeposits(req: Request, res: Response): Promise<void> {
    try {
      const { user, status, limit = "50", offset = "0" } = req.query;

      const whereClause: any = {};

      if (user && typeof user === "string") {
        whereClause[Op.or] = [
          { tenant_address: user.toLowerCase() },
          { landlord_address: user.toLowerCase() },
        ];
      }

      if (status && typeof status === "string") {
        whereClause.status = status;
      }

      const deposits = await Deposit.findAndCountAll({
        where: whereClause,
        include: [
          {
            association: "signatories",
            attributes: ["address", "signatory_index"],
          },
          {
            association: "votes",
            attributes: ["signatory_address", "vote_choice", "created_at"],
          },
          {
            association: "disputes",
            attributes: ["status", "triggered_by", "created_at"],
          },
        ],
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        order: [["created_at", "DESC"]],
      });

      res.json({
        deposits: deposits.rows,
        total: deposits.count,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      });
    } catch (error) {
      logger.error("Error getting deposits:", error);
      res.status(500).json({
        error: "Failed to get deposits",
      });
    }
  }

  /**
   * Get deposit by ID with full details
   */
  static async getDepositById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const deposit = await Deposit.findOne({
        where: { chain_deposit_id: parseInt(id) },
        include: [
          {
            association: "signatories",
            attributes: ["address", "signatory_index"],
          },
          {
            association: "votes",
            attributes: ["signatory_address", "vote_choice", "created_at"],
          },
          {
            association: "disputes",
            attributes: [
              "status",
              "triggered_by",
              "resolution",
              "tenant_amount",
              "landlord_amount",
              "created_at",
              "resolved_at",
            ],
          },
          {
            association: "yieldHistory",
            attributes: [
              "user_address",
              "yield_amount",
              "apy",
              "claimed",
              "created_at",
              "claimed_at",
            ],
          },
        ],
      });

      if (!deposit) {
        res.status(404).json({
          error: "Deposit not found",
        });
        return;
      }

      res.json({ deposit });
      return;
      return;
    } catch (error) {
      logger.error("Error getting deposit:", error);
      res.status(500).json({
        error: "Failed to get deposit",
      });
      return;
    }
  }

  /**
   * Get deposits by user address (tenant, landlord, or signatory)
   */
  static async getDepositsByUser(req: Request, res: Response): Promise<void> {
    try {
      const { address } = req.params;
      const { limit = "50", offset = "0" } = req.query;

      // Get deposits where user is tenant or landlord
      const userDeposits = await Deposit.findAndCountAll({
        where: {
          [Op.or]: [
            { tenant_address: address.toLowerCase() },
            { landlord_address: address.toLowerCase() },
          ],
        },
        include: [
          {
            association: "signatories",
            attributes: ["address", "signatory_index"],
          },
          {
            association: "votes",
            attributes: ["signatory_address", "vote_choice", "created_at"],
          },
        ],
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        order: [["created_at", "DESC"]],
      });

      // Get deposits where user is a signatory
      const signatoryDeposits = await Deposit.findAndCountAll({
        include: [
          {
            association: "signatories",
            where: { address: address.toLowerCase() },
            attributes: ["address", "signatory_index"],
          },
          {
            association: "votes",
            attributes: ["signatory_address", "vote_choice", "created_at"],
          },
        ],
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        order: [["created_at", "DESC"]],
      });

      // Combine and deduplicate results
      const allDeposits = [...userDeposits.rows, ...signatoryDeposits.rows];
      const uniqueDeposits = allDeposits.filter(
        (deposit, index, self) =>
          index === self.findIndex((d) => d.id === deposit.id)
      );

      res.json({
        deposits: uniqueDeposits,
        total: uniqueDeposits.length,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      });
    } catch (error) {
      logger.error("Error getting deposits by user:", error);
      res.status(500).json({
        error: "Failed to get user deposits",
      });
    }
  }

  /**
   * Sync deposit from blockchain (manual sync)
   */
  static async syncDeposit(req: Request, res: Response): Promise<void> {
    try {
      const { chainId } = req.params;

      // This would typically involve calling the smart contract
      // to get the latest deposit data and update the database
      // For now, we'll return a placeholder response

      res.json({
        message: `Deposit ${chainId} sync initiated`,
        status: "pending",
      });
    } catch (error) {
      logger.error("Error syncing deposit:", error);
      res.status(500).json({
        error: "Failed to sync deposit",
      });
    }
  }

  /**
   * Get deposit statistics
   */
  static async getDepositStats(req: Request, res: Response): Promise<void> {
    try {
      const totalDeposits = await Deposit.count();
      const activeDeposits = await Deposit.count({
        where: { status: "active" },
      });
      const releasedDeposits = await Deposit.count({
        where: { status: "released" },
      });
      const disputedDeposits = await Deposit.count({
        where: { in_dispute: true },
      });

      const totalAmount = await Deposit.sum("amount", {
        where: { status: "active" },
      });

      res.json({
        totalDeposits,
        activeDeposits,
        releasedDeposits,
        disputedDeposits,
        totalActiveAmount: totalAmount || "0",
      });
    } catch (error) {
      logger.error("Error getting deposit stats:", error);
      res.status(500).json({
        error: "Failed to get deposit statistics",
      });
    }
  }
}

// Import Op for Sequelize operators
import { Op } from "sequelize";

// Validation middleware
export const validateDepositId = [
  param("id").isInt({ min: 0 }).withMessage("Valid deposit ID is required"),
];

export const validateUserAddress = [
  param("address")
    .isString()
    .matches(/^0x[a-fA-F0-9]{40}$/)
    .withMessage("Valid Ethereum address is required"),
];

export const validateDepositQuery = [
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  query("offset")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Offset must be non-negative"),
  query("status")
    .optional()
    .isIn(["pending", "active", "released", "disputed", "resolved"])
    .withMessage("Invalid status"),
];
