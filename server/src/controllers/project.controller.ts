import type { Response } from "express";
import { z } from "zod";

import { pool } from "../config/db.js";
import type { AuthRequest } from "../middleware/auth.middleware.js";

const createProjectSchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, "Project name must contain at least 2 characters")
        .max(150),

    description: z
        .string()
        .trim()
        .max(1000)
        .optional()
        .default(""),
});

export async function createProject(
    req: AuthRequest,
    res: Response
) {
    const client = await pool.connect();

    try {
        if (!req.userId) {
            return res.status(401).json({
                success: false,
                message: "Not authenticated",
            });
        }

        const validation = createProjectSchema.safeParse(req.body);

        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: "Invalid project data",
                errors: validation.error.flatten(),
            });
        }

        const { name, description } = validation.data;

        await client.query("BEGIN");

        const projectResult = await client.query(
            `
      INSERT INTO projects (
        name,
        description,
        owner_id
      )
      VALUES ($1, $2, $3)
      RETURNING
        id,
        name,
        description,
        owner_id,
        created_at,
        updated_at
      `,
            [name, description, req.userId]
        );

        const project = projectResult.rows[0];

        await client.query(
            `
      INSERT INTO project_members (
        project_id,
        user_id,
        role
      )
      VALUES ($1, $2, $3)
      `,
            [project.id, req.userId, "OWNER"]
        );

        await client.query("COMMIT");

        return res.status(201).json({
            success: true,
            message: "Project created successfully",
            project,
        });
    } catch (error) {
        await client.query("ROLLBACK");

        console.error("Create project error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to create project",
        });
    } finally {
        client.release();
    }
}

export async function getProjects(
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
        p.id,
        p.name,
        p.description,
        p.owner_id,
        pm.role,
        p.created_at,
        p.updated_at
      FROM projects p
      INNER JOIN project_members pm
        ON pm.project_id = p.id
      WHERE pm.user_id = $1
      ORDER BY p.created_at DESC
      `,
            [req.userId]
        );

        return res.status(200).json({
            success: true,
            projects: result.rows,
        });
    } catch (error) {
        console.error("Get projects error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve projects",
        });
    }
}

export async function getProjectById(
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

        const projectId = Number(req.params.id);

        if (!Number.isInteger(projectId) || projectId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid project ID",
            });
        }

        const result = await pool.query(
            `
      SELECT
        p.id,
        p.name,
        p.description,
        p.owner_id,
        pm.role,
        p.created_at,
        p.updated_at
      FROM projects p
      INNER JOIN project_members pm
        ON pm.project_id = p.id
      WHERE p.id = $1
        AND pm.user_id = $2
      `,
            [projectId, req.userId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                success: false,
                message: "Project not found",
            });
        }

        return res.status(200).json({
            success: true,
            project: result.rows[0],
        });
    } catch (error) {
        console.error("Get project error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve project",
        });
    }
}