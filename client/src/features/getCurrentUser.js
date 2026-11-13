import { api } from "../utils/axios.js";

export default async function getCurrentUser() {
  try {
    const response = await api.get("/me");
    return response.data;
  } catch (error) {
    console.error("[Get-Current-User Error]", {
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    });

    // A 401 means there is no valid authenticated session.
    if (error.response?.status === 401) {
      return null;
    }

    // Don't silently treat server/network failures as logout.
    throw error;
  }
}
