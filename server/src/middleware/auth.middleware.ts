import type { NextFunction, Request, Response } from "express";
import { verifyToken } from "../utils/jwt.js";

export interface AuthRequest extends Request {
    userId?: number;
}

export function requireAuth(
    req: AuthRequest,
    res: Response,
    next: NextFunction
) {
    try {
        const authorization = req.headers.authorization;

        if (!authorization) {
            return res.status(401).json({
                success: false,
                message: "Authorization token is required",
            });
        }

        const [scheme, token] = authorization.split(" ");

        if (scheme !== "Bearer" || !token) {
            return res.status(401).json({
                success: false,
                message: "Invalid authorization format",
            });
        }

        const payload = verifyToken(token);

        req.userId = payload.userId;

        next();
    } catch {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token",
        });
    }
}