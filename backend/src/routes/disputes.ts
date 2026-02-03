import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { optionalAuth } from "../middleware/auth";
import {
  DisputeController,
  validateDepositId,
  validateUserAddress,
  validateDisputeQuery,
} from "../controllers/disputeController";

const router = Router();

/**
 * @route POST /api/disputes/:depositId
 * @desc Raise a dispute (partial or full) by landlord
 * @access Private (landlord only)
 */
router.post(
  "/:depositId",
  authenticate,
  DisputeController.raiseDispute
);

/**
 * @route GET /api/disputes
 * @desc Get all disputes with optional filters
 * @access Public (with optional auth)
 */
router.get(
  "/",
  optionalAuth,
  validateDisputeQuery,
  DisputeController.getAllDisputes
);

/**
 * @route GET /api/disputes/stats
 * @desc Get dispute statistics
 * @access Public
 */
router.get("/stats", DisputeController.getDisputeStats);

/**
 * @route GET /api/disputes/active
 * @desc Get active disputes count
 * @access Public
 */
router.get("/active", DisputeController.getActiveDisputesCount);

/**
 * @route GET /api/disputes/:depositId
 * @desc Get dispute by deposit ID
 * @access Public
 */
router.get(
  "/:depositId",
  validateDepositId,
  DisputeController.getDisputeByDepositId
);

/**
 * @route GET /api/disputes/user/:address
 * @desc Get disputes by user address
 * @access Public
 */
router.get(
  "/user/:address",
  validateUserAddress,
  validateDisputeQuery,
  DisputeController.getDisputesByUser
);

export default router;







