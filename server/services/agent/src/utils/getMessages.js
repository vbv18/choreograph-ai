import axios from "axios";

export default async function getMessages(conversationId) {
  const chatServiceUrl = process.env.CHAT_SERVICE_URL;

  try {
    const response = await axios.get(
      `${chatServiceUrl}/messages/${conversationId}`,
    );
    return response.data.messages;
  } catch (error) {
    console.error("[Get-Messages Error]", {
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    });

    return null;
  }
}
