import { Router } from "express";
import {
  AuthController,
  validateSignature,
} from "../controllers/authController";
import { authenticate } from "../middleware/auth";

const router = Router();

/**
 * @route GET /api/auth/nonce
 * @desc Get nonce for wallet signature
 * @access Public
 */
router.get("/nonce", AuthController.getNonce);

/**
 * @route POST /api/auth/verify
 * @desc Verify signature and authenticate user
 * @access Public
 */
router.post("/verify", validateSignature, AuthController.verifySignature);

/**
 * @route POST /api/auth/logout
 * @desc Logout user
 * @access Private
 */
router.post("/logout", authenticate, AuthController.logout);

/**
 * @route GET /api/auth/profile
 * @desc Get current user profile
 * @access Private
 */
router.get("/profile", authenticate, AuthController.getProfile);

export default router;







