import { api } from "../utils/axios";

export default async function deleteConversation(conversationId) {
  try {
    const response = await api.delete(`/chat/conversations/${conversationId}`);
    return response.data;
  } catch (error) {
    console.error("[Delete-Conversation Error]", {
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    });
    return null;
  }
}
