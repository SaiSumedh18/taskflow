import { Router } from "express";

import {
    createProject,
    getProjectById,
    getProjects,
} from "../controllers/project.controller.js";

import {
    addProjectMember,
    getProjectMembers,
    removeProjectMember,
} from "../controllers/member.controller.js";

import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.use(requireAuth);

// Create a new project
router.post("/", createProject);

// Get all projects for the logged-in user
router.get("/", getProjects);

// Get all members of a project
router.get("/:id/members", getProjectMembers);

// Add a member to a project
router.post("/:id/members", addProjectMember);

// Remove a member from a project
router.delete("/:id/members/:userId", removeProjectMember);

// Get one project by ID
router.get("/:id", getProjectById);

export default router;