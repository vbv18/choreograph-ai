import { api } from "../utils/axios.js";

export default async function sendMessage(payload) {
  try {
    const response = await api.post("/agent/chat", payload);
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error("[Send-Message Error]", {
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    });
    throw error;
  }
}
