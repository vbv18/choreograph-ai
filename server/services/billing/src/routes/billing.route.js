import express from "express";

import * as billingController from "../controllers/billing.controller.js";

const router = express.Router();

router.post("/order", billingController.createOrder);
router.post("/payment", billingController.verifyPayment);

export default router;
