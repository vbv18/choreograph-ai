import fs from "fs";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import getModel from "../utils/getModel.js";
import getSystemPrompt from "../utils/system-prompt.js";

export async function visionAgent(state) {
  try {
    const llm = await getModel("vision");
    const systemPrompt = getSystemPrompt("vision");

    const imageBuffer = await fs.readFile(state.file.path);
    const base64Image = imageBuffer.toString("base64");

    const messages = [
      new SystemMessage(systemPrompt),
      new HumanMessage({
        content: [
          {
            type: "text",
            text: state.prompt || "analyze the image",
          },
          {
            type: "image_url",
            image_url: {
              url: `data:${state.file.mimetype};base64,${base64Image}`,
            },
          },
        ],
      }),
    ];

    const response = await llm.invoke(messages);

    return {
      ...state,
      aiRsponse: response.content,
    };
  } catch (error) {
    console.error("[Vision-Agent Error]", {
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    });

    return {
      ...state,
      aiResponse: "Failed to analyze the image!",
    };
  } finally {
    fs.unlink(state.file.path);
  }
}
