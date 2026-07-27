import { Router } from "express";
import {
  getUser,
  createUser,
  updateUser,
  syncUser,
  getCurrentUser,
} from "../controllers/user.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

//GET /users/:id
router.get("/:id", authMiddleware, getUser);

router.get("/me", authMiddleware, getCurrentUser);

//POST /users
router.post("/", createUser);

//POST /users/sync
router.post("/sync", syncUser);

//PUT /users/:id
router.put("/:id", authMiddleware, updateUser);

export default router;
