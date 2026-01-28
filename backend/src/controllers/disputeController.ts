import { Request, Response } from "express";
import { query, param, validationResult } from "express-validator";
import { Dispute, Deposit } from "../models";
import { logger } from "../middleware/errorHandler";
import { Op } from "sequelize";

export class DisputeController {
  /**
   * Get all disputes with optional filters
   */
  static async getAllDisputes(req: Request, res: Response): Promise<void> {
    try {
      const { status, limit = "50", offset = "0" } = req.query;

      const whereClause: any = {};

      if (status && typeof status === "string") {
        whereClause.status = status;
      }

      const disputes = await Dispute.findAndCountAll({
        where: whereClause,
        include: [
          {
            association: "deposit",
            attributes: [
              "chain_deposit_id",
              "tenant_address",
              "landlord_address",
              "amount",
              "status",
            ],
          },
        ],
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        order: [["created_at", "DESC"]],
      });

      res.json({
        disputes: disputes.rows,
        total: disputes.count,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      });
    } catch (error) {
      logger.error("Error getting disputes:", error);
      res.status(500).json({
        error: "Failed to get disputes",
      });
    }
  }

  /**
   * Get dispute by deposit ID
   */
  static async getDisputeByDepositId(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { depositId } = req.params;

      const dispute = await Dispute.findOne({
        where: { deposit_id: depositId },
        include: [
          {
            association: "deposit",
            attributes: [
              "chain_deposit_id",
              "tenant_address",
              "landlord_address",
              "amount",
              "status",
              "created_at",
            ],
          },
        ],
      });

      if (!dispute) {
        res.status(404).json({
          error: "Dispute not found",
        });
        return;
      }

      res.json({ dispute });
    } catch (error) {
      logger.error("Error getting dispute:", error);
      res.status(500).json({
        error: "Failed to get dispute",
      });
    }
  }

  /**
   * Get active disputes count
   */
  static async getActiveDisputesCount(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const activeCount = await Dispute.count({
        where: { status: "active" },
      });

      const resolvedCount = await Dispute.count({
        where: { status: "resolved" },
      });

      const totalCount = await Dispute.count();

      res.json({
        activeDisputes: activeCount,
        resolvedDisputes: resolvedCount,
        totalDisputes: totalCount,
      });
    } catch (error) {
      logger.error("Error getting active disputes count:", error);
      res.status(500).json({
        error: "Failed to get disputes count",
      });
    }
  }

  /**
   * Get disputes by user (triggered by or involved in)
   */
  static async getDisputesByUser(req: Request, res: Response): Promise<void> {
    try {
      const { address } = req.params;
      const { limit = "50", offset = "0" } = req.query;

      // Get disputes triggered by the user
      const triggeredDisputes = await Dispute.findAndCountAll({
        where: {
          triggered_by: address.toLowerCase(),
        },
        include: [
          {
            association: "deposit",
            attributes: [
              "chain_deposit_id",
              "tenant_address",
              "landlord_address",
              "amount",
              "status",
            ],
          },
        ],
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        order: [["created_at", "DESC"]],
      });

      // Get disputes where user is involved (tenant or landlord)
      const involvedDisputes = await Dispute.findAndCountAll({
        include: [
          {
            association: "deposit",
            where: {
              [Op.or]: [
                { tenant_address: address.toLowerCase() },
                { landlord_address: address.toLowerCase() },
              ],
            },
            attributes: [
              "chain_deposit_id",
              "tenant_address",
              "landlord_address",
              "amount",
              "status",
            ],
          },
        ],
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        order: [["created_at", "DESC"]],
      });

      // Combine and deduplicate results
      const allDisputes = [...triggeredDisputes.rows, ...involvedDisputes.rows];
      const uniqueDisputes = allDisputes.filter(
        (dispute, index, self) =>
          index === self.findIndex((d) => d.id === dispute.id)
      );

      res.json({
        disputes: uniqueDisputes,
        total: uniqueDisputes.length,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      });
    } catch (error) {
      logger.error("Error getting disputes by user:", error);
      res.status(500).json({
        error: "Failed to get user disputes",
      });
    }
  }

  /**
   * Get dispute statistics
   */
  static async getDisputeStats(req: Request, res: Response): Promise<void> {
    try {
      const totalDisputes = await Dispute.count();
      const activeDisputes = await Dispute.count({
        where: { status: "active" },
      });
      const resolvedDisputes = await Dispute.count({
        where: { status: "resolved" },
      });

      // Get average resolution time
      const resolvedDisputesWithTime = await Dispute.findAll({
        where: {
          status: "resolved",
          resolved_at: { [Op.ne]: null },
        },
        attributes: ["created_at", "resolved_at"],
      });

      let averageResolutionTime = 0;
      if (resolvedDisputesWithTime.length > 0) {
        const totalTime = resolvedDisputesWithTime.reduce((sum, dispute) => {
          const resolutionTime =
            dispute.resolved_at!.getTime() - dispute.created_at.getTime();
          return sum + resolutionTime;
        }, 0);
        averageResolutionTime = totalTime / resolvedDisputesWithTime.length;
      }

      res.json({
        totalDisputes,
        activeDisputes,
        resolvedDisputes,
        averageResolutionTimeHours: Math.round(
          averageResolutionTime / (1000 * 60 * 60)
        ),
      });
    } catch (error) {
      logger.error("Error getting dispute stats:", error);
      res.status(500).json({
        error: "Failed to get dispute statistics",
      });
    }
  }
}

// Validation middleware
export const validateDepositId = [
  param("depositId").isUUID().withMessage("Valid deposit ID is required"),
];

export const validateUserAddress = [
  param("address")
    .isString()
    .matches(/^0x[a-fA-F0-9]{40}$/)
    .withMessage("Valid Ethereum address is required"),
];

export const validateDisputeQuery = [
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
    .isIn(["active", "resolved"])
    .withMessage("Invalid status"),
];
