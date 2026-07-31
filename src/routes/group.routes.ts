import { Router } from "express";
import { createGroup, deleteGroup, getGroupById, getGroups, updateGroup } from "../controllers/group.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

//GET /groups
router.get("/", authMiddleware, getGroups);

//GET /groups/:id
router.get("/:id", authMiddleware, getGroupById);

//POST /groups
router.post("/", authMiddleware, createGroup);

//PUT /groups/:id
router.put("/:id", authMiddleware, updateGroup)

//DELETE /groups/:id
router.delete("/:id", authMiddleware, deleteGroup);

export default router;
