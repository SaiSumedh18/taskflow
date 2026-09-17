import type { Response } from "express";
import { z } from "zod";

import { pool } from "../config/db.js";
import type { AuthRequest } from "../middleware/auth.middleware.js";

const statusSchema = z.enum([
    "TODO",
    "IN_PROGRESS",
    "DONE",
]);

const prioritySchema = z.enum([
    "LOW",
    "MEDIUM",
    "HIGH",
]);

const createTaskSchema = z.object({
    title: z
        .string()
        .trim()
        .min(2, "Task title must contain at least 2 characters")
        .max(200),

    description: z
        .string()
        .trim()
        .max(2000)
        .optional()
        .default(""),

    status: statusSchema
        .optional()
        .default("TODO"),

    priority: prioritySchema
        .optional()
        .default("MEDIUM"),

    dueDate: z
        .string()
        .datetime()
        .nullable()
        .optional(),

    assignedTo: z
        .number()
        .int()
        .positive()
        .nullable()
        .optional(),
});

const updateTaskSchema = z.object({
    title: z
        .string()
        .trim()
        .min(2)
        .max(200)
        .optional(),

    description: z
        .string()
        .trim()
        .max(2000)
        .optional(),

    status: statusSchema.optional(),

    priority: prioritySchema.optional(),

    dueDate: z
        .string()
        .datetime()
        .nullable()
        .optional(),

    assignedTo: z
        .number()
        .int()
        .positive()
        .nullable()
        .optional(),
});

async function userIsProjectMember(
    userId: number,
    projectId: number
) {
    const result = await pool.query(
        `
    SELECT role
    FROM project_members
    WHERE user_id = $1
      AND project_id = $2
    `,
        [userId, projectId]
    );

    return result.rowCount !== null && result.rowCount > 0;
}

export async function createTask(
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

        const projectId = Number(req.params.projectId);

        if (!Number.isInteger(projectId) || projectId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid project ID",
            });
        }

        const isMember = await userIsProjectMember(
            req.userId,
            projectId
        );

        if (!isMember) {
            return res.status(403).json({
                success: false,
                message: "You do not have access to this project",
            });
        }

        const validation = createTaskSchema.safeParse(req.body);

        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: "Invalid task data",
                errors: validation.error.flatten(),
            });
        }

        const {
            title,
            description,
            status,
            priority,
            dueDate,
            assignedTo,
        } = validation.data;

        if (assignedTo) {
            const assigneeIsMember = await userIsProjectMember(
                assignedTo,
                projectId
            );

            if (!assigneeIsMember) {
                return res.status(400).json({
                    success: false,
                    message: "Assignee must be a member of the project",
                });
            }
        }

        const result = await pool.query(
            `
      INSERT INTO tasks (
        title,
        description,
        status,
        priority,
        due_date,
        project_id,
        created_by,
        assigned_to
      )
      VALUES (
        $1, $2, $3, $4,
        $5, $6, $7, $8
      )
      RETURNING *
      `,
            [
                title,
                description,
                status,
                priority,
                dueDate ?? null,
                projectId,
                req.userId,
                assignedTo ?? null,
            ]
        );

        return res.status(201).json({
            success: true,
            message: "Task created successfully",
            task: result.rows[0],
        });
    } catch (error) {
        console.error("Create task error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to create task",
        });
    }
}

export async function getProjectTasks(
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

        const projectId = Number(req.params.projectId);

        if (!Number.isInteger(projectId) || projectId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid project ID",
            });
        }

        const isMember = await userIsProjectMember(
            req.userId,
            projectId
        );

        if (!isMember) {
            return res.status(403).json({
                success: false,
                message: "You do not have access to this project",
            });
        }

        const status =
            typeof req.query.status === "string"
                ? req.query.status
                : undefined;

        const priority =
            typeof req.query.priority === "string"
                ? req.query.priority
                : undefined;

        if (
            status &&
            !["TODO", "IN_PROGRESS", "DONE"].includes(status)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid status filter",
            });
        }

        if (
            priority &&
            !["LOW", "MEDIUM", "HIGH"].includes(priority)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid priority filter",
            });
        }

        const values: unknown[] = [projectId];

        let query = `
      SELECT
        t.*,
        creator.name AS creator_name,
        assignee.name AS assignee_name
      FROM tasks t

      INNER JOIN users creator
        ON creator.id = t.created_by

      LEFT JOIN users assignee
        ON assignee.id = t.assigned_to

      WHERE t.project_id = $1
    `;

        if (status) {
            values.push(status);

            query += `
        AND t.status = $${values.length}
      `;
        }

        if (priority) {
            values.push(priority);

            query += `
        AND t.priority = $${values.length}
      `;
        }

        query += `
      ORDER BY
        t.created_at DESC
    `;

        const result = await pool.query(query, values);

        return res.status(200).json({
            success: true,
            tasks: result.rows,
        });
    } catch (error) {
        console.error("Get tasks error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve tasks",
        });
    }
}

export async function getTaskById(
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

        const taskId = Number(req.params.id);

        if (!Number.isInteger(taskId) || taskId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid task ID",
            });
        }

        const result = await pool.query(
            `
      SELECT
        t.*,
        creator.name AS creator_name,
        assignee.name AS assignee_name
      FROM tasks t

      INNER JOIN project_members pm
        ON pm.project_id = t.project_id

      INNER JOIN users creator
        ON creator.id = t.created_by

      LEFT JOIN users assignee
        ON assignee.id = t.assigned_to

      WHERE t.id = $1
        AND pm.user_id = $2
      `,
            [taskId, req.userId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                success: false,
                message: "Task not found",
            });
        }

        return res.status(200).json({
            success: true,
            task: result.rows[0],
        });
    } catch (error) {
        console.error("Get task error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve task",
        });
    }
}

export async function updateTask(
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

        const taskId = Number(req.params.id);

        if (!Number.isInteger(taskId) || taskId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid task ID",
            });
        }

        const existingResult = await pool.query(
            `
      SELECT
        t.*
      FROM tasks t

      INNER JOIN project_members pm
        ON pm.project_id = t.project_id

      WHERE t.id = $1
        AND pm.user_id = $2
      `,
            [taskId, req.userId]
        );

        if (existingResult.rowCount === 0) {
            return res.status(404).json({
                success: false,
                message: "Task not found",
            });
        }

        const validation = updateTaskSchema.safeParse(req.body);

        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: "Invalid task data",
                errors: validation.error.flatten(),
            });
        }

        const data = validation.data;

        if (Object.keys(data).length === 0) {
            return res.status(400).json({
                success: false,
                message: "No task fields were provided",
            });
        }

        const existingTask = existingResult.rows[0];

        if (data.assignedTo) {
            const assigneeIsMember = await userIsProjectMember(
                data.assignedTo,
                existingTask.project_id
            );

            if (!assigneeIsMember) {
                return res.status(400).json({
                    success: false,
                    message: "Assignee must be a member of the project",
                });
            }
        }

        const fields: string[] = [];
        const values: unknown[] = [];

        if (data.title !== undefined) {
            values.push(data.title);
            fields.push(`title = $${values.length}`);
        }

        if (data.description !== undefined) {
            values.push(data.description);
            fields.push(`description = $${values.length}`);
        }

        if (data.status !== undefined) {
            values.push(data.status);
            fields.push(`status = $${values.length}`);
        }

        if (data.priority !== undefined) {
            values.push(data.priority);
            fields.push(`priority = $${values.length}`);
        }

        if (data.dueDate !== undefined) {
            values.push(data.dueDate);
            fields.push(`due_date = $${values.length}`);
        }

        if (data.assignedTo !== undefined) {
            values.push(data.assignedTo);
            fields.push(`assigned_to = $${values.length}`);
        }

        fields.push("updated_at = CURRENT_TIMESTAMP");

        values.push(taskId);

        const result = await pool.query(
            `
      UPDATE tasks
      SET ${fields.join(", ")}
      WHERE id = $${values.length}
      RETURNING *
      `,
            values
        );

        return res.status(200).json({
            success: true,
            message: "Task updated successfully",
            task: result.rows[0],
        });
    } catch (error) {
        console.error("Update task error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to update task",
        });
    }
}

export async function deleteTask(
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

        const taskId = Number(req.params.id);

        if (!Number.isInteger(taskId) || taskId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid task ID",
            });
        }

        const result = await pool.query(
            `
      DELETE FROM tasks
      WHERE id = $1
        AND project_id IN (
          SELECT project_id
          FROM project_members
          WHERE user_id = $2
        )
      RETURNING id
      `,
            [taskId, req.userId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                success: false,
                message: "Task not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Task deleted successfully",
        });
    } catch (error) {
        console.error("Delete task error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to delete task",
        });
    }
}