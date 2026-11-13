import { api } from "../utils/axios";

export default async function editConversation(conversationId, newTitle) {
  try {
    const response = await api.patch(`/chat/conversations/${conversationId}`, {
      newTitle,
    });
    return response.data.conversation;
  } catch (error) {
    console.error("[Edit-Conversation Error]", {
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    });
    return null;
  }
}
