import { api } from "../utils/axios";

export default async function createConversation() {
  try {
    const response = await api.post("/chat/conversations");
    return response.data.conversation;
  } catch (error) {
    console.error("[Create-Conversation Error]", {
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    });
    return null;
  }
}
