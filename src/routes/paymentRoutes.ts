import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { completePayment, createPayment, getPayments } from "../controllers/paymentController.js";

const router = Router();

//GET /projects/:id/payments
router.get("/:id/payments", authMiddleware, getPayments);

//POST /projects/:id/payments
router.post("/:id/payments", authMiddleware, createPayment);

//PUT /projects/:id/payments/:paymentId
router.put("/:id/payments/:paymentId", authMiddleware, completePayment);

export default router;