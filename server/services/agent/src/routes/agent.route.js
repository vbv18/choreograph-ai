import { Router } from "express";
import * as agentController from "../controllers/agent.controller.js";
import multer from "../config/multer.js";

const agentRouter = new Router();

agentRouter.post("/chat", multer.single("file"), agentController.agent);

export default agentRouter;
