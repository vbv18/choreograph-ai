import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    orderId: {
      type: String,
      required: true,
      unique: true,
    },
    paymentId: {
      type: String,
    },
    amount: Number,
    currency: {
      type: String,
      default: "INR",
    },
    credits: {
      type: Number,
      min: 0,
    },
    planId: {
      type: String,
      enum: ["free", "starter", "pro"],
      default: "free",
    },
    status: {
      type: String,
      enum: ["created", "paid", "failed"],
      default: "created",
    },
  },
  {
    timestamps: true,
  },
);

const PaymentModel = mongoose.model("payments", paymentSchema);

export default PaymentModel;
