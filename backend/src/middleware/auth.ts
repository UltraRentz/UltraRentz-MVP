import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        walletAddress: string;
        userId: string;
        iat: number;
        exp: number;
      };
    }
  }
}

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ error: "Access token required" });
    return;
  }

  // Handle demo tokens for testing
  if (token.startsWith("demo_token_")) {
    // Extract wallet address from demo token
    const parts = token.split("_");
    if (parts.length >= 3) {
      const walletAddress = parts[2];
      req.user = {
        walletAddress: `0x${walletAddress}`,
        userId: `demo_user_${Date.now()}`,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
      };
      next();
      return;
    }
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    req.user = {
      walletAddress: decoded.walletAddress,
      userId: decoded.userId,
      iat: decoded.iat,
      exp: decoded.exp,
    };
    next();
  } catch (error) {
    res.status(403).json({ error: "Invalid or expired token" });
    return;
  }
};

// Optional authentication middleware (doesn't fail if no token)
export const optionalAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (token) {
    // Handle demo tokens for testing
    if (token.startsWith("demo_token_")) {
      const parts = token.split("_");
      if (parts.length >= 3) {
        const walletAddress = parts[2];
        req.user = {
          walletAddress: `0x${walletAddress}`,
          userId: `demo_user_${Date.now()}`,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
        };
      }
    } else {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        req.user = {
          walletAddress: decoded.walletAddress,
          userId: decoded.userId,
          iat: decoded.iat,
          exp: decoded.exp,
        };
      } catch (error) {
        // Token is invalid, but we continue without user
      }
    }
  }

  next();
};
