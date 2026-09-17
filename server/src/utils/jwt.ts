import jwt from "jsonwebtoken";

interface TokenPayload {
    userId: number;
}

export function generateToken(userId: number): string {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new Error("JWT_SECRET is not defined");
    }

    const expiresIn = (process.env.JWT_EXPIRES_IN ??
        "7d") as jwt.SignOptions["expiresIn"];

    return jwt.sign(
        {
            userId,
        },
        secret,
        {
            expiresIn,
        }
    );
}

export function verifyToken(token: string): TokenPayload {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new Error("JWT_SECRET is not defined");
    }

    return jwt.verify(token, secret) as TokenPayload;
}