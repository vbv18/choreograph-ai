import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    firebaseUid: {
      type: String,
      unique: true,
      sparse: true,
    },
    name: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      index: true,
      lowercase: true,
      trim: true,
    },
    avatar: String,
    planId: {
      type: String,
      enum: ["free", "starter", "pro"],
      default: "free",
    },
    credits: {
      type: Number,
      min: 0,
    },
    totalCredits: {
      type: Number,
      min: 0,
    },
    planExpiresAt: {
      type: Date,
      default: () =>
        new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000, // + 30 days
        ),
    },
  },
  {
    timestamps: true,
  },
);

const UserModel = mongoose.model("users", userSchema);

export default UserModel;
