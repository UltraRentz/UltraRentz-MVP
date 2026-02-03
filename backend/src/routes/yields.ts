import { Router } from "express";
import {
  YieldController,
  validateUserAddress,
  validateYieldQuery,
} from "../controllers/yieldController";
import { optionalAuth } from "../middleware/auth";

const router = Router();

/**
 * @route GET /api/yields/stats
 * @desc Get overall yield statistics
 * @access Public
 */
router.get("/stats", YieldController.getYieldStats);

/**
 * @route GET /api/yields/:address
 * @desc Get yield history for a user
 * @access Public
 */
router.get(
  "/:address",
  validateUserAddress,
  validateYieldQuery,
  YieldController.getYieldHistory
);

/**
 * @route GET /api/yields/summary/:address
 * @desc Get yield summary for a user
 * @access Public
 */
router.get(
  "/summary/:address",
  validateUserAddress,
  YieldController.getYieldSummary
);

/**
 * @route GET /api/yields/chart/:address
 * @desc Get yield chart data for a user
 * @access Public
 */
router.get(
  "/chart/:address",
  validateUserAddress,
  validateYieldQuery,
  YieldController.getYieldChartData
);

export default router;







