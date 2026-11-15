import mongoose from "mongoose";
import MessageModel from "../models/message.model.js";

export async function saveMessage(
  conversationId,
  role,
  content,
  images = [],
  artifacts = [],
  attachments = [],
) {
  if (!conversationId || !mongoose.Types.ObjectId.isValid(conversationId)) {
    throw new Error("A valid conversationId is required to save a message");
  }

  const message = await MessageModel.create({
    conversationId,
    role,
    content,
    images: images || [],
    artifacts: artifacts || [],
    attachments: attachments || [],
  });

  return message;
}

export async function getMessages(conversationId) {
  if (!conversationId || !mongoose.Types.ObjectId.isValid(conversationId)) {
    return [];
  }

  const messages = await MessageModel.find({
    conversationId,
  }).sort({ createdAt: 1 });

  return messages;
}
