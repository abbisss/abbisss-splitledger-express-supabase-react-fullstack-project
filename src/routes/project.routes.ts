import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { createProject, getProjects, getProject, updateProject, deleteProject} from "../controllers/project.controller.js";

const router = Router();

//GET /groups/:id/projects
router.get("/:id/projects", authMiddleware, getProjects);

//GET groups/projects/:id
router.get("/projects/:id", authMiddleware, getProject);

//POST /groups/:id/projects
router.post("/:id/projects", authMiddleware, createProject);

//PUT groups/projects/:id
router.put("/projects/:id", authMiddleware, updateProject);

//DELETE groups/projects/:id
router.delete("/projects/:id", authMiddleware, deleteProject);

export default router;