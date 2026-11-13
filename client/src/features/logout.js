import { api } from "../utils/axios";

export default async function logout() {
  try {
    await api.post("/auth/logout");
  } catch (error) {
    console.error("[Log-Out Error]", {
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    });
  }
}
