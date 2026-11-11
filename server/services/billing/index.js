import express from "express";
import "dotenv/config";

import { connectDatabase } from "./src/config/db.js";
import router from "./src/routes/billing.route.js";

const app = express();

app.use(express.json());

app.use("/", router);

const port = process.env.PORT;

app.listen(port, () => {
  console.log(`Billing Service is running on port ${port}`);
  connectDatabase();
});
