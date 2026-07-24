import { Router } from "express";
import { getGroupMembers, leaveGroup, removeGroupMember } from "../controllers/groupMember.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

//GET /groups/:id/members
router.get("/:id/members", authMiddleware, getGroupMembers);

//DELETE /groups/:id/members/:userId
router.delete("/:id/members/:userId", authMiddleware, removeGroupMember);

// POST /groups/:id/leave
router.post("/:id/leave", authMiddleware, leaveGroup);


export default router;