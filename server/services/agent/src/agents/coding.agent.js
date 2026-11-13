import getSystemPrompt from "../utils/system-prompt.js";
import getModel from "../utils/getModel.js";
import { getMemory } from "../config/memory.js";
import {
  AIMessage,
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages";

function extractJson(text) {
  if (!text || typeof text !== "string") return null;
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {}

  const match = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (match?.[1]) {
    try {
      return JSON.parse(match[1].trim());
    } catch {}
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try {
      return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1));
    } catch {}
  }
  return null;
}

export async function codingAgent(state) {
  const intentLlm = getModel("intent");
  const intentPrompt = getSystemPrompt("intent", state.prompt);
  let intent = "CODE_GENERATION";

  try {
    const intentResponse = await intentLlm.invoke(intentPrompt);
    const rawIntent = (intentResponse?.content || "")
      .toString()
      .trim()
      .toUpperCase();

    if (rawIntent) {
      intent = rawIntent;
    }
  } catch (error) {
    console.error("[CodingAgent] Intent classification warning:", {
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    });
  }

  if (intent === "CODE_GENERATION") {
    const llm = getModel("coding");
    const systemPrompt = getSystemPrompt("code_generation", state.prompt);

    let data = "";
    // Primary model invocation with fallback
    try {
      const response = await llm.invoke(systemPrompt);
      data = extractJson(response?.content || "");
      console.log(data);
    } catch (error) {
      console.error("[Code-Generate-Agent Error] LLM failed", {
        status: error.response?.status,
        message: error.message,
        data: error.response?.data,
      });
    }

    if (data) {
      const rawFiles = Array.isArray(data.files) ? data.files : [];
      const files = rawFiles.map((file, idx) => ({
        name: file?.name || `file_${idx + 1}`,
        content: file?.content || "",
      }));

      const artifactData = {
        id: String(data.id || Date.now()),
        title: data.title || "Code Artifact",
        taskType: data.taskType || "code",
        language: data.language || "",
        framework: data.framework || "",
        files,
        entryPoint: data.entryPoint || files[0]?.name || "",
        notes: Array.isArray(data.notes) ? data.notes : [],
      };

      return {
        ...state,
        aiResponse:
          data.explanation ||
          `I've generated the code artifact: "${artifactData.title}". You can explore, inspect, and copy all files in the artifact panel.`,
        artifact: [artifactData],
      };
    }
  } else {
    const llm = getModel("code_review");
    const systemPrompt = getSystemPrompt("code_review", state.prompt);
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

    let response;
    try {
      response = await llm.invoke(messages);
    } catch (error) {
      console.error("[Code-Review-Agent Error] LLM failed", {
        status: error.response?.status,
        message: error.message,
        data: error.response?.data,
      });
    }

    const aiResponse =
      typeof response?.content === "string"
        ? response.content.trim()
        : JSON.stringify(response?.content || "");

    return {
      ...state,
      aiResponse,
      artifact: [],
    };
  }
}
