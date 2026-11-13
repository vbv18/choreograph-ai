import express from "express";
import * as authController from "../controllers/auth.controller.js";
import internalMiddleware from "../middlewares/internal.middleware.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/login", authController.login);
router.post("/logout", authController.logout);
router.patch(
  "/internal/deduct-credits",
  internalMiddleware,
  authController.deductCredits,
);
router.patch(
  "/internal/refund-credits",
  internalMiddleware,
  authController.refundCredits,
);
router.use(authMiddleware);
router.patch("/payment", authController.updateUserPayment);

export default router;
