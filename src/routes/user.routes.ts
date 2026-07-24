import { Router } from "express";
import {
  getUser,
  createUser,
  updateUser,
} from "../controllers/user.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

//GET /users/:id
router.get("/:id", authMiddleware, getUser);

//POST /users
router.post("/", createUser);

//PUT /users/:id
router.put("/:id", authMiddleware, updateUser);

export default router;
