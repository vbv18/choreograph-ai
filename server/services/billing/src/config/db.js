import mongoose from "mongoose";

export async function connectDatabase() {
  try {
    const connectionString = process.env.MONGO_URI;
    await mongoose.connect(connectionString);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("[DB] Error connecting to MongoDB", error);
    process.exit(1);
  }
}
