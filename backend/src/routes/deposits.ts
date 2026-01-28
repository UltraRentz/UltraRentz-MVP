import { Router } from "express";
import {
  DepositController,
  validateDepositId,
  validateUserAddress,
  validateDepositQuery,
} from "../controllers/depositController";
import { authenticate, optionalAuth } from "../middleware/auth";

const router = Router();

/**
 * @route GET /api/deposits
 * @desc Get all deposits with optional filters
 * @access Public (with optional auth)
 */
router.get(
  "/",
  optionalAuth,
  validateDepositQuery,
  DepositController.getAllDeposits
);

/**
 * @route GET /api/deposits/stats
 * @desc Get deposit statistics
 * @access Public
 */
router.get("/stats", DepositController.getDepositStats);

/**
 * @route GET /api/deposits/:id
 * @desc Get deposit details by ID
 * @access Public
 */
router.get("/:id", validateDepositId, DepositController.getDepositById);

/**
 * @route GET /api/deposits/user/:address
 * @desc Get deposits by user address
 * @access Public
 */
router.get(
  "/user/:address",
  validateUserAddress,
  validateDepositQuery,
  DepositController.getDepositsByUser
);

/**
 * @route POST /api/deposits/sync/:chainId
 * @desc Sync deposit from blockchain
 * @access Private
 */
router.post("/sync/:chainId", authenticate, DepositController.syncDeposit);

export default router;

