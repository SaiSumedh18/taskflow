import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import { z } from "zod";

import { pool } from "../config/db.js";
import { generateToken } from "../utils/jwt.js";
import type { AuthRequest } from "../middleware/auth.middleware.js";

const registerSchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, "Name must contain at least 2 characters")
        .max(100),

    email: z
        .string()
        .trim()
        .email("Please enter a valid email address"),

    password: z
        .string()
        .min(8, "Password must contain at least 8 characters")
        .max(100),
});

const loginSchema = z.object({
    email: z
        .string()
        .trim()
        .email("Please enter a valid email address"),

    password: z
        .string()
        .min(1, "Password is required"),
});

export async function register(req: Request, res: Response) {
    try {
        const validation = registerSchema.safeParse(req.body);

        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: "Invalid registration data",
                errors: validation.error.flatten(),
            });
        }

        const { name, password } = validation.data;
        const email = validation.data.email.toLowerCase();

        const existingUser = await pool.query(
            `
      SELECT id
      FROM users
      WHERE email = $1
      `,
            [email]
        );

        if (existingUser.rowCount && existingUser.rowCount > 0) {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists",
            });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const result = await pool.query(
            `
      INSERT INTO users (
        name,
        email,
        password_hash
      )
      VALUES ($1, $2, $3)
      RETURNING
        id,
        name,
        email,
        created_at
      `,
            [name, email, passwordHash]
        );

        const user = result.rows[0];

        const token = generateToken(user.id);

        return res.status(201).json({
            success: true,
            message: "Account created successfully",
            user,
            token,
        });
    } catch (error) {
        console.error("Registration error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to create account",
        });
    }
}

export async function login(req: Request, res: Response) {
    try {
        const validation = loginSchema.safeParse(req.body);

        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: "Invalid login data",
                errors: validation.error.flatten(),
            });
        }

        const email = validation.data.email.toLowerCase();
        const { password } = validation.data;

        const result = await pool.query(
            `
      SELECT
        id,
        name,
        email,
        password_hash,
        created_at
      FROM users
      WHERE email = $1
      `,
            [email]
        );

        if (result.rowCount === 0) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        const user = result.rows[0];

        const passwordMatches = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!passwordMatches) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        const token = generateToken(user.id);

        return res.status(200).json({
            success: true,
            message: "Login successful",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                created_at: user.created_at,
            },
            token,
        });
    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to log in",
        });
    }
}

export async function getCurrentUser(
    req: AuthRequest,
    res: Response
) {
    try {
        if (!req.userId) {
            return res.status(401).json({
                success: false,
                message: "Not authenticated",
            });
        }

        const result = await pool.query(
            `
      SELECT
        id,
        name,
        email,
        created_at,
        updated_at
      FROM users
      WHERE id = $1
      `,
            [req.userId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        return res.status(200).json({
            success: true,
            user: result.rows[0],
        });
    } catch (error) {
        console.error("Current user error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve user",
        });
    }
}