import express from "express";
import proxy from "express-http-proxy";
import proxyWithHeader from "../utils/proxyWithHeader.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { getCurrentUser } from "../controllers/user.controller.js";

const router = express.Router();

router.use("/auth", proxy(process.env.AUTH_SERVICE_URL));
router.use(authMiddleware);
router.use("/chat", proxyWithHeader(process.env.CHAT_SERVICE_URL));
router.use("/agent", proxyWithHeader(process.env.AGENT_SERVICE_URL));
router.use("/billing", proxyWithHeader(process.env.BILLING_SERVICE_URL));
router.get("/me", getCurrentUser);

export default router;
