import type { Response } from "express";
import { z } from "zod";

import { pool } from "../config/db.js";
import type { AuthRequest } from "../middleware/auth.middleware.js";

const addMemberSchema = z.object({
    email: z
        .string()
        .trim()
        .email("Please enter a valid email address"),
});

async function getProjectForOwner(
    projectId: number,
    userId: number
) {
    const result = await pool.query(
        `
    SELECT id, owner_id
    FROM projects
    WHERE id = $1
      AND owner_id = $2
    `,
        [projectId, userId]
    );

    return result.rows[0];
}

export async function getProjectMembers(
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

        const accessResult = await pool.query(
            `
      SELECT 1
      FROM project_members
      WHERE project_id = $1
        AND user_id = $2
      `,
            [projectId, req.userId]
        );

        if (accessResult.rowCount === 0) {
            return res.status(403).json({
                success: false,
                message: "You do not have access to this project",
            });
        }

        const result = await pool.query(
            `
      SELECT
        u.id,
        u.name,
        u.email,
        pm.role,
        pm.created_at
      FROM project_members pm

      INNER JOIN users u
        ON u.id = pm.user_id

      WHERE pm.project_id = $1

      ORDER BY
        CASE
          WHEN pm.role = 'OWNER' THEN 0
          ELSE 1
        END,
        u.name ASC
      `,
            [projectId]
        );

        return res.status(200).json({
            success: true,
            members: result.rows,
        });
    } catch (error) {
        console.error("Get members error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve project members",
        });
    }
}

export async function addProjectMember(
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

        const project = await getProjectForOwner(
            projectId,
            req.userId
        );

        if (!project) {
            return res.status(403).json({
                success: false,
                message: "Only the project owner can add members",
            });
        }

        const validation = addMemberSchema.safeParse(req.body);

        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: "Invalid member data",
                errors: validation.error.flatten(),
            });
        }

        const email = validation.data.email.toLowerCase();

        const userResult = await pool.query(
            `
      SELECT id, name, email
      FROM users
      WHERE email = $1
      `,
            [email]
        );

        if (userResult.rowCount === 0) {
            return res.status(404).json({
                success: false,
                message: "No TaskFlow user exists with that email",
            });
        }

        const user = userResult.rows[0];

        const existingResult = await pool.query(
            `
      SELECT role
      FROM project_members
      WHERE project_id = $1
        AND user_id = $2
      `,
            [projectId, user.id]
        );

        if (
            existingResult.rowCount !== null &&
            existingResult.rowCount > 0
        ) {
            return res.status(409).json({
                success: false,
                message: "User is already a member of this project",
            });
        }

        await pool.query(
            `
      INSERT INTO project_members (
        project_id,
        user_id,
        role
      )
      VALUES ($1, $2, 'MEMBER')
      `,
            [projectId, user.id]
        );

        return res.status(201).json({
            success: true,
            message: "Member added successfully",
            member: {
                ...user,
                role: "MEMBER",
            },
        });
    } catch (error) {
        console.error("Add member error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to add project member",
        });
    }
}

export async function removeProjectMember(
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
        const memberUserId = Number(req.params.userId);

        if (
            !Number.isInteger(projectId) ||
            !Number.isInteger(memberUserId) ||
            projectId <= 0 ||
            memberUserId <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid project or user ID",
            });
        }

        const project = await getProjectForOwner(
            projectId,
            req.userId
        );

        if (!project) {
            return res.status(403).json({
                success: false,
                message: "Only the project owner can remove members",
            });
        }

        if (memberUserId === req.userId) {
            return res.status(400).json({
                success: false,
                message: "Project owner cannot remove themselves",
            });
        }

        const result = await pool.query(
            `
      DELETE FROM project_members
      WHERE project_id = $1
        AND user_id = $2
        AND role <> 'OWNER'
      RETURNING user_id
      `,
            [projectId, memberUserId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                success: false,
                message: "Project member not found",
            });
        }

        await pool.query(
            `
      UPDATE tasks
      SET assigned_to = NULL,
          updated_at = CURRENT_TIMESTAMP
      WHERE project_id = $1
        AND assigned_to = $2
      `,
            [projectId, memberUserId]
        );

        return res.status(200).json({
            success: true,
            message: "Member removed successfully",
        });
    } catch (error) {
        console.error("Remove member error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to remove project member",
        });
    }
}