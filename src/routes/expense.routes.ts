import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { createExpense, deleteExpense, getExpense, getExpenses, updateExpense } from "../controllers/expense.controller.js";

const router = Router();

//GET /projects/:id/expenses
router.get("/:id/expenses", authMiddleware, getExpenses);

//GET projects/expenses/:id
router.get("/expenses/:id", authMiddleware, getExpense);

//POST /projects/:id/expenses
router.post("/:id/expenses", authMiddleware, createExpense);

//PUT projects/expenses/:id
router.put("/expenses/:id", authMiddleware, updateExpense);

//DELETE projects/expenses/:id
router.delete("/expenses/:id", authMiddleware, deleteExpense);

export default router;