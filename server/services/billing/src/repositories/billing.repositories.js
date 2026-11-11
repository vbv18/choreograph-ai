import PaymentModel from "../models/payment.model.js";

export async function registerPayment(userId, order, plan, status) {
  await PaymentModel.create({
    userId,
    orderId: order.id,
    amount: plan.amount,
    credits: plan.credits,
    planId: plan.id,
    currency: order.currency,
    status: status,
  });
}

export async function findOneAndUpdatePayment(orderId, paymentId) {
  return await PaymentModel.findOneAndUpdate(
    {
      orderId,
    },
    {
      $set: {
        status: "paid",
        paymentId,
      },
    },
    {
      new: true,
      runValidators: true,
    },
  );
}
