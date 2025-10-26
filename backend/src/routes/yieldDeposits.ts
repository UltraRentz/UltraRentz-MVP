import { Router } from "express";
import { YieldDepositController } from "../controllers/yieldDepositController";
import { authenticate, optionalAuth } from "../middleware/auth";

const router = Router();

/**
 * @route POST /api/yield-deposits
 * @desc Create a new yield deposit
 * @access Private (optional for testing)
 */
router.post("/", optionalAuth, YieldDepositController.createYieldDeposit);

/**
 * @route GET /api/yield-deposits/user/:address
 * @desc Get yield deposits for a user
 * @access Public
 */
router.get("/user/:address", YieldDepositController.getUserYieldDeposits);

/**
 * @route GET /api/yield-deposits/:id
 * @desc Get yield deposit by ID
 * @access Public
 */
router.get("/:id", YieldDepositController.getYieldDepositById);

/**
 * @route PUT /api/yield-deposits/:id/status
 * @desc Update yield deposit status
 * @access Private
 */
router.put(
  "/:id/status",
  authenticate,
  YieldDepositController.updateYieldDepositStatus
);

export default router;
