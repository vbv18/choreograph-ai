import mongoose from "mongoose";
import { artifactSchema } from "./artifact.model.js";

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "conversations",
      index: true,
    },
    role: {
      type: String,
      enum: ["user", "assistant"],
    },
    content: {
      type: String,
    },
    attachments: [
      {
        name: String,
        url: String,
        fileType: String,
      },
    ],
    images: [String],
    artifacts: [artifactSchema],
  },
  {
    timestamps: true,
  },
);

const MessageModel = mongoose.model("messages", messageSchema);

export default MessageModel;
