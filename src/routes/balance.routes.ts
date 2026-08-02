import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { getBalances, calculateDebts} from "../controllers/balance.controller.js";

const router = Router();

//GET /projects/:id/balances
router.get("/:id/balances", authMiddleware, getBalances);

//PUT /projects/:id/calculate-debts
router.put("/:id/calculate-debts", authMiddleware, calculateDebts);

export default router;