import * as conversationRepository from "../repositories/conversation.repositories.js";

export async function createConversation(req, res) {
  try {
    const userId = req.headers["x-user-id"];
    const conversation =
      await conversationRepository.createConversation(userId);

    return res.status(201).json({
      message: "Conversation created successfully",
      conversation,
    });
  } catch (error) {
    console.error("[Create-Conversation-Error]", {
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    });

    return res.status(500).json({
      message: "Internal server error",
    });
  }
}

export async function getConversations(req, res) {
  try {
    const userId = req.headers["x-user-id"];
    const conversations = await conversationRepository.getConversations(userId);

    return res.status(200).json({
      message: "Conversations fetched successfully",
      conversations,
    });
  } catch (error) {
    console.error("[Get-Conversations-Error]", {
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    });

    return res.status(500).json({
      message: "Internal server error",
    });
  }
}

export async function editConversation(req, res) {
  try {
    const { conversationId } = req.params;
    const userId = req.headers["x-user-id"];
    const title = req.body?.newTitle;

    if (!conversationId) {
      return res.status(400).json({
        message: "Conversation ID is required in URL parameters",
      });
    }

    if (title === undefined || title === null || String(title).trim() === "") {
      return res.status(400).json({
        message: "Title is required",
      });
    }

    const conversation = await conversationRepository.updateConversationById(
      conversationId,
      userId,
      String(title).trim(),
    );

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation not found or unauthorized",
      });
    }

    return res.status(200).json({
      message: "Conversation updated successfully",
      conversation,
    });
  } catch (error) {
    console.error("[Edit-Conversation-Error]", {
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    });

    return res.status(500).json({
      message: "Internal server error",
    });
  }
}

export async function deleteConversation(req, res) {
  try {
    const { conversationId } = req.params;
    const userId = req.headers["x-user-id"];

    if (!conversationId) {
      return res.status(400).json({
        message: "Conversation ID is required in URL parameters",
      });
    }

    const conversation = await conversationRepository.deleteConversationById(
      conversationId,
      userId,
    );

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation not found or unauthorized",
      });
    }

    return res.status(200).json({
      message: "Conversation deleted successfully",
      conversationId,
    });
  } catch (error) {
    console.error("[Delete-Conversation-Error]", {
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    });

    return res.status(500).json({
      message: "Internal server error",
    });
  }
}
