import "dotenv/config";
import express from "express";
import morgan from "morgan";
import cors from "cors";
import cookieParser from "cookie-parser";
import router from "./src/routes/services.route.js";

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  }),
);

app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());

// Services' Routes
app.use("/api/v1", router);

app.listen(process.env.PORT, () => {
  console.log(`Server Gateway is running on port ${process.env.PORT}`);
});
