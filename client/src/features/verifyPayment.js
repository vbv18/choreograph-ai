import { api } from "../utils/axios";

export default async function verifyPayment(payload) {
  try {
    const response = await api.post("/billing/payment", payload);
    console.log(response.data);
    return {
      order: response.data?.order,
      plan: response.data?.plan,
    };
  } catch (error) {
    console.error("[Verify-Payment Error]", {
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    });

    throw error;
  }
}
