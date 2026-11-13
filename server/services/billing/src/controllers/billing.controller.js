import axios from "axios";
import * as billingRepository from "../repositories/billing.repositories.js";
import { PLANS } from "../../../lib/constant.js";
import razorpay from "../config/razorpay.js";
import crypto from "crypto";

export async function createOrder(req, res) {
  try {
    const userId = req.headers["x-user-id"];
    const plan = PLANS[req.body.planId];

    if (!plan) {
      return res.status(404).json({
        message: "Invalid plan",
      });
    }

    const order = await razorpay.orders.create({
      amount: plan.amount * 100, // in paisa
      currency: "INR",
      receipt: `receipt-${Date.now()}`,
    });

    await billingRepository.registerPayment(userId, order, plan, "created");

    return res.status(201).json({
      message: "Order created successfully",
      order,
      plan,
    });
  } catch (error) {
    console.error("[Create-Order Error]", {
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    });

    return res.status(500).json({
      message: "Internal server error",
    });
  }
}

export async function verifyPayment(req, res) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      console.error(
        "[Verify-Payment Error]: Missing payment verification details",
      );
      return res.status(400).json({
        message: "Missing payment verification details",
      });
    }

    const generateSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generateSignature !== razorpay_signature) {
      console.error("[Verify-Payment Error]: Payment verification failed");
      return res.status(400).json({
        status: false,
        message: "Payment verification failed",
      });
    }

    const payment = await billingRepository.findOneAndUpdatePayment(
      razorpay_order_id,
      razorpay_payment_id,
    );

    if (!payment) {
      console.log("[Verify-Payment Error]: Payment not found");
      return res.status(404).json({
        message: "Payment not found",
      });
    }

    await axios.patch(`${process.env.AUTH_SERVICE_URL}/payment`, {
      userId: payment.userId,
      planId: payment.planId,
    });

    return res.status(200).json({
      success: true,
      message: "Payment verified",
    });
  } catch (error) {
    console.error("[Verify-Payment Error]", {
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    });

    return res.status(500).json({
      message: "Internal server error",
    });
  }
}
