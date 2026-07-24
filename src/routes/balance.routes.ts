import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { getBalances, getDebts } from "../controllers/balance.controller.js";

const router = Router();

//GET /projects/:id/balances
router.get("/:id/balances", authMiddleware, getBalances);

//GET /projects/:id/debts
router.get("/:id/debts", authMiddleware, getDebts);

export default router;