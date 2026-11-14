import fs from "fs/promises";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import getModel from "../utils/getModel.js";
import getSystemPrompt from "../utils/system-prompt.js";

export async function visionAgent(state) {
  try {
    const llm = await getModel("vision");
    const systemPrompt = getSystemPrompt("vision");

    const imageFiles = (state.files || []).filter((f) =>
      f.mimetype?.startsWith("image/"),
    );

    const imageParts = await Promise.all(
      imageFiles.map(async (file) => {
        const imageBuffer = await fs.readFile(file.path);
        const base64Image = imageBuffer.toString("base64");
        return {
          type: "image_url",
          image_url: {
            url: `data:${file.mimetype};base64,${base64Image}`,
          },
        };
      }),
    );

    const messages = [
      new SystemMessage(systemPrompt),
      new HumanMessage({
        content: [
          {
            type: "text",
            text: state.prompt || "analyze the image",
          },
          ...imageParts,
        ],
      }),
    ];

    const response = await llm.invoke(messages);

    return {
      ...state,
      aiResponse:
        typeof response.content === "string"
          ? response.content
          : JSON.stringify(response.content),
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
    for (const f of state.files || []) {
      if (f.path) {
        try {
          await fs.unlink(f.path);
        } catch (cleanupError) {
          console.error("[Cleanup Error]", cleanupError.message);
        }
      }
    }
  }
}
