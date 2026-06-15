// server/middleware/auth.ts
import { Request, Response, NextFunction } from "express";
import { clerkMiddleware, getAuth } from "@clerk/express";

export interface AuthRequest extends Request {
  auth?: {
    userId: string;
    sessionId: string;
  };
}

// Export Clerk's middleware initializer (mount this in server/index.ts)
export const clerkAuth = clerkMiddleware();

// Route-level guard: rejects requests with no valid Clerk session
export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const auth = getAuth(req);

  if (!auth.userId) {
    return res.status(401).json({
      error: "UNAUTHORIZED",
      message: "Valid Clerk session required.",
    });
  }

  next();
}