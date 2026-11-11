import { api } from "../utils/axios";

export default async function createOrder(payload) {
  try {
    const response = await api.post("/billing/order", payload);

    return {
      order: response.data?.order,
      plan: response.data?.plan,
    };
  } catch (error) {
    console.error("[Create-Order Error]", error);
    throw error;
  }
}
