import express from "express";

import * as authController from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/login", authController.login);
router.post("/logout", authController.logout);
router.patch("/payment", authController.updateUserPayment);

export default router;
