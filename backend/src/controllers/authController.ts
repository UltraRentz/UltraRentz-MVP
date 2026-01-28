import { Request, Response } from "express";
import { body, validationResult } from "express-validator";
import { AuthService } from "../services/authService";
import { logger } from "../middleware/errorHandler";

export class AuthController {
  /**
   * Get nonce for wallet signature
   */
  static async getNonce(req: Request, res: Response): Promise<void> {
    try {
      const { address } = req.query;

      if (!address || typeof address !== "string") {
        res.status(400).json({
          error: "Wallet address is required",
        });
        return;
      }

      // Validate Ethereum address format
      if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
        res.status(400).json({
          error: "Invalid wallet address format",
        });
        return;
      }

      const user = await AuthService.getOrCreateUser(address);
      const message = AuthService.createAuthMessage(user.nonce);

      res.json({
        nonce: user.nonce,
        message,
        userId: user.id,
      });
      return;
    } catch (error) {
      logger.error("Error getting nonce:", error);
      res.status(500).json({
        error: "Failed to generate nonce",
      });
      return;
    }
  }

  /**
   * Verify signature and authenticate user
   */
  static async verifySignature(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          error: "Validation failed",
          details: errors.array(),
        });
        return;
      }

      const { address, signature, message } = req.body;

      // Verify signature
      const isValidSignature = AuthService.verifySignature(
        address,
        message,
        signature
      );

      if (!isValidSignature) {
        res.status(401).json({
          error: "Invalid signature",
        });
        return;
      }

      // Get user and verify nonce
      const user = await AuthService.getUserByAddress(address);
      if (!user) {
        res.status(404).json({
          error: "User not found",
        });
        return;
      }

      // Verify that the message contains the correct nonce
      if (!message.includes(user.nonce)) {
        res.status(401).json({
          error: "Invalid nonce in message",
        });
        return;
      }

      // Generate JWT token
      const token = AuthService.generateToken(address, user.id);

      // Update nonce for security
      await AuthService.updateUserNonce(user.id);

      logger.info(`User authenticated: ${address}`);

      res.json({
        token,
        user: {
          id: user.id,
          walletAddress: user.wallet_address,
        },
      });
      return;
    } catch (error) {
      logger.error("Error verifying signature:", error);
      res.status(500).json({
        error: "Authentication failed",
      });
      return;
    }
  }

  /**
   * Logout user (invalidate token on client side)
   */
  static async logout(req: Request, res: Response): Promise<void> {
    // In a stateless JWT system, logout is handled on the client side
    // by removing the token. We could implement a token blacklist here
    // for enhanced security if needed.

    res.json({
      message: "Logged out successfully",
    });
    return;
  }

  /**
   * Get current user profile
   */
  static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          error: "Authentication required",
        });
        return;
      }

      const user = await AuthService.getUserByAddress(req.user.walletAddress);
      if (!user) {
        res.status(404).json({
          error: "User not found",
        });
        return;
      }

      res.json({
        user: {
          id: user.id,
          walletAddress: user.wallet_address,
          createdAt: user.created_at,
        },
      });
      return;
    } catch (error) {
      logger.error("Error getting profile:", error);
      res.status(500).json({
        error: "Failed to get profile",
      });
      return;
    }
  }
}

// Validation middleware
export const validateSignature = [
  body("address")
    .isString()
    .matches(/^0x[a-fA-F0-9]{40}$/)
    .withMessage("Valid Ethereum address is required"),
  body("signature")
    .isString()
    .isLength({ min: 130, max: 132 })
    .withMessage("Valid signature is required"),
  body("message").isString().notEmpty().withMessage("Message is required"),
];

