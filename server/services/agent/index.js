import express from "express";
import "dotenv/config";
import { connectDatabase } from "./src/config/db.js";
import agentRouter from "./src/routes/agent.route.js";
import errorMiddleware from "./src/middlewares/error.middleware.js";

const app = express();

app.use(express.json());

app.use("/", agentRouter);

app.use(errorMiddleware);

const port = process.env.PORT;
app.listen(port, () => {
  console.log(`Agent Service is running on port ${port}`);
  connectDatabase();
});
