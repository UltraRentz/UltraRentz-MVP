import jwt from "jsonwebtoken";
import { ethers } from "ethers";
import { User } from "../models";
import { logger } from "../middleware/errorHandler";

export class AuthService {
  /**
   * Generate a random nonce for wallet signature verification
   */
  static generateNonce(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }

  /**
   * Verify wallet signature using ethers.js
   */
  static verifySignature(
    address: string,
    message: string,
    signature: string
  ): boolean {
    try {
      const recoveredAddress = ethers.utils.verifyMessage(message, signature);
      return recoveredAddress.toLowerCase() === address.toLowerCase();
    } catch (error) {
      logger.error("Signature verification failed:", error);
      return false;
    }
  }

  /**
   * Generate JWT token for authenticated user
   */
  static generateToken(walletAddress: string, userId: string): string {
    const payload = {
      walletAddress: walletAddress.toLowerCase(),
      userId,
      exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours from now
    };

    const secret = process.env.JWT_SECRET || "fallback-secret-key";

    return jwt.sign(payload, secret);
  }

  /**
   * Get or create user by wallet address
   */
  static async getOrCreateUser(walletAddress: string): Promise<User> {
    const normalizedAddress = walletAddress.toLowerCase();

    let user = await User.findOne({
      where: { wallet_address: normalizedAddress },
    });

    if (!user) {
      user = await User.create({
        wallet_address: normalizedAddress,
        nonce: this.generateNonce(),
      });
      logger.info(`New user created: ${normalizedAddress}`);
    }

    return user;
  }

  /**
   * Update user nonce
   */
  static async updateUserNonce(userId: string): Promise<string> {
    const newNonce = this.generateNonce();
    await User.update({ nonce: newNonce }, { where: { id: userId } });
    return newNonce;
  }

  /**
   * Get user by wallet address
   */
  static async getUserByAddress(walletAddress: string): Promise<User | null> {
    return await User.findOne({
      where: { wallet_address: walletAddress.toLowerCase() },
    });
  }

  /**
   * Create authentication message for user to sign
   */
  static createAuthMessage(nonce: string): string {
    return `Welcome to UltraRentz!\n\nPlease sign this message to authenticate.\n\nNonce: ${nonce}\n\nThis request will not trigger a blockchain transaction or cost any gas fees.`;
  }
}
