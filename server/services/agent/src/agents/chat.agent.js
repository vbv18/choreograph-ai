import getSystemPrompt from "../utils/system-prompt.js";
import getModel from "../config/llm.js";
import { getMemory } from "../config/memory.js";
import {
  AIMessage,
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages";

export async function chatAgent(state) {
  try {
    const llm = getModel("chat");

    const searchContext = state.searchResults
      ? getSystemPrompt("search", JSON.stringify(state.searchResults))
      : "";

    const systemPrompt = getSystemPrompt("chat", searchContext);
    // console.log(systemPrompt);

    const history = (await getMemory(state.conversationId)) || [];
    const messages = [new SystemMessage(systemPrompt)];

    history.forEach((msg) => {
      if (msg.role === "user") {
        messages.push(new HumanMessage(msg.content));
      } else {
        messages.push(new AIMessage(msg.content));
      }
    });

    const lastMsg = history.at(-1);

    if (lastMsg?.role !== "user" || lastMsg?.content !== state.prompt) {
      messages.push(new HumanMessage(state.prompt));
    }

    const response = await llm.invoke(messages);

    const aiResponse =
      typeof response.content === "string"
        ? response.content.trim()
        : JSON.stringify(response.content);

    return {
      ...state,
      aiResponse,
    };
  } catch (error) {
    console.error("[Chat-Agent Error]", {
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    });

    return {
      ...state,
      aiResponse: "Failed to generate response!",
    };
  }
}
