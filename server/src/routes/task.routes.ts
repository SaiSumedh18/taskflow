import { Router } from "express";

import {
    createTask,
    deleteTask,
    getProjectTasks,
    getTaskById,
    updateTask,
} from "../controllers/task.controller.js";

import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.use(requireAuth);

router.post(
    "/projects/:projectId/tasks",
    createTask
);

router.get(
    "/projects/:projectId/tasks",
    getProjectTasks
);

router.get(
    "/tasks/:id",
    getTaskById
);

router.patch(
    "/tasks/:id",
    updateTask
);

router.delete(
    "/tasks/:id",
    deleteTask
);

export default router;