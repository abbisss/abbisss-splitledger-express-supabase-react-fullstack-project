import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { createInvitation, getInvitations, updateInvitation } from "../controllers/invitation.controller.js";

const router = Router();

//GET /invitations
router.get("/", authMiddleware, getInvitations);

//invitations/groups/:id
router.post("/group/:id", authMiddleware, createInvitation);

//invitations/:id
router.put("/:id", authMiddleware, updateInvitation);

export default router;