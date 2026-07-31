import { Router } from "express";
import {
  getUser,
  createUser,
  updateUser,
  syncUser,
  getCurrentUser,
  searchUsers,
} from "../controllers/user.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

//GET /users/me
router.get("/me", authMiddleware, getCurrentUser);

//GET /users/search?name=
router.get("/search", authMiddleware, searchUsers);

//GET /users/:id
router.get("/:id", authMiddleware, getUser);

//POST /users
router.post("/", createUser);

//POST /users/sync
router.post("/sync", syncUser);

//PUT /users/:id
router.put("/:id", authMiddleware, updateUser);

export default router;
