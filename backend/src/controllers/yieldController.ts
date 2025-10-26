import { Request, Response } from "express";
import { param, query, validationResult } from "express-validator";
import { YieldHistory, Deposit } from "../models";
import { logger } from "../middleware/errorHandler";
import { Op } from "sequelize";

export class YieldController {
  /**
   * Get yield history for a user
   */
  static async getYieldHistory(req: Request, res: Response): Promise<void> {
    try {
      const { address } = req.params;
      const { limit = "50", offset = "0", claimed } = req.query;

      const whereClause: any = {
        user_address: address.toLowerCase(),
      };

      if (claimed !== undefined) {
        whereClause.claimed = claimed === "true";
      }

      const yieldHistory = await YieldHistory.findAndCountAll({
        where: whereClause,
        include: [
          {
            association: "deposit",
            attributes: [
              "chain_deposit_id",
              "tenant_address",
              "landlord_address",
              "amount",
            ],
          },
        ],
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        order: [["created_at", "DESC"]],
      });

      res.json({
        yieldHistory: yieldHistory.rows,
        total: yieldHistory.count,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      });
    } catch (error) {
      logger.error("Error getting yield history:", error);
      res.status(500).json({
        error: "Failed to get yield history",
      });
    }
  }

  /**
   * Get yield summary for a user
   */
  static async getYieldSummary(req: Request, res: Response): Promise<void> {
    try {
      const { address } = req.params;

      // Get total yield earned
      const totalYield = await YieldHistory.sum("yield_amount", {
        where: {
          user_address: address.toLowerCase(),
        },
      });

      // Get claimable yield (unclaimed)
      const claimableYield = await YieldHistory.sum("yield_amount", {
        where: {
          user_address: address.toLowerCase(),
          claimed: false,
        },
      });

      // Get claimed yield
      const claimedYield = await YieldHistory.sum("yield_amount", {
        where: {
          user_address: address.toLowerCase(),
          claimed: true,
        },
      });

      // Get current APY (average of recent yields)
      const recentYields = await YieldHistory.findAll({
        where: {
          user_address: address.toLowerCase(),
          created_at: {
            [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
        attributes: ["apy"],
        order: [["created_at", "DESC"]],
        limit: 10,
      });

      const currentAPY =
        recentYields.length > 0
          ? recentYields.reduce(
              (sum, yield_) => sum + parseFloat(yield_.apy),
              0
            ) / recentYields.length
          : 8.5; // Default APY

      // Get active deposits count
      const activeDeposits = await Deposit.count({
        where: {
          [Op.or]: [
            { tenant_address: address.toLowerCase() },
            { landlord_address: address.toLowerCase() },
          ],
          status: "active",
        },
      });

      res.json({
        totalYield: totalYield || "0",
        claimableYield: claimableYield || "0",
        claimedYield: claimedYield || "0",
        currentAPY: currentAPY.toFixed(2),
        activeDeposits,
      });
    } catch (error) {
      logger.error("Error getting yield summary:", error);
      res.status(500).json({
        error: "Failed to get yield summary",
      });
    }
  }

  /**
   * Get yield chart data for a user (7-day history)
   */
  static async getYieldChartData(req: Request, res: Response): Promise<void> {
    try {
      const { address } = req.params;
      const { days = "7" } = req.query;

      const daysBack = parseInt(days as string);
      const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

      // Get daily yield data
      const dailyYields = await YieldHistory.findAll({
        where: {
          user_address: address.toLowerCase(),
          created_at: {
            [Op.gte]: startDate,
          },
        },
        attributes: ["created_at", "yield_amount", "apy"],
        order: [["created_at", "ASC"]],
      });

      // Group by date and calculate daily totals
      const chartData: Array<{
        date: string;
        yield: number;
        apy: number;
      }> = [];

      const dateMap = new Map<
        string,
        { totalYield: number; apy: number; count: number }
      >();

      dailyYields.forEach((yield_) => {
        const date = yield_.created_at.toISOString().split("T")[0];
        const existing = dateMap.get(date) || {
          totalYield: 0,
          apy: 0,
          count: 0,
        };

        existing.totalYield += parseFloat(yield_.yield_amount);
        existing.apy += parseFloat(yield_.apy);
        existing.count += 1;

        dateMap.set(date, existing);
      });

      // Convert to chart format
      dateMap.forEach((data, date) => {
        chartData.push({
          date: new Date(date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          yield: parseFloat(data.totalYield.toFixed(4)),
          apy: parseFloat((data.apy / data.count).toFixed(2)),
        });
      });

      // Fill in missing dates with zero values
      const filledChartData = [];
      for (let i = 0; i < daysBack; i++) {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split("T")[0];
        const existingData = chartData.find(
          (d) =>
            d.date ===
            new Date(dateStr).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })
        );

        filledChartData.unshift({
          date: new Date(dateStr).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          yield: existingData ? existingData.yield : 0,
          apy: existingData ? existingData.apy : 8.5,
        });
      }

      res.json({
        chartData: filledChartData,
        period: `${daysBack} days`,
      });
    } catch (error) {
      logger.error("Error getting yield chart data:", error);
      res.status(500).json({
        error: "Failed to get yield chart data",
      });
    }
  }

  /**
   * Get yield statistics for all users
   */
  static async getYieldStats(req: Request, res: Response): Promise<void> {
    try {
      const totalYieldDistributed = await YieldHistory.sum("yield_amount");
      const totalClaimedYield = await YieldHistory.sum("yield_amount", {
        where: { claimed: true },
      });
      const totalUnclaimedYield = await YieldHistory.sum("yield_amount", {
        where: { claimed: false },
      });

      const uniqueUsers = await YieldHistory.count({
        distinct: true,
        col: "user_address",
      });

      const averageAPY = await YieldHistory.findOne({
        attributes: [
          [
            YieldHistory.sequelize!.fn(
              "AVG",
              YieldHistory.sequelize!.col("apy")
            ),
            "avgAPY",
          ],
        ],
      });

      res.json({
        totalYieldDistributed: totalYieldDistributed || "0",
        totalClaimedYield: totalClaimedYield || "0",
        totalUnclaimedYield: totalUnclaimedYield || "0",
        uniqueUsers,
        averageAPY: averageAPY
          ? parseFloat((averageAPY as any).dataValues.avgAPY).toFixed(2)
          : "8.50",
      });
    } catch (error) {
      logger.error("Error getting yield stats:", error);
      res.status(500).json({
        error: "Failed to get yield statistics",
      });
    }
  }
}

// Validation middleware
export const validateUserAddress = [
  param("address")
    .isString()
    .matches(/^0x[a-fA-F0-9]{40}$/)
    .withMessage("Valid Ethereum address is required"),
];

export const validateYieldQuery = [
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  query("offset")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Offset must be non-negative"),
  query("claimed")
    .optional()
    .isBoolean()
    .withMessage("Claimed must be boolean"),
  query("days")
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage("Days must be between 1 and 365"),
];
