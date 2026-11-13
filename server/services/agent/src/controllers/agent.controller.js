import axios from "axios";
import graph from "../graph/graph.js";
import { updateMemoryBatch } from "../config/memory.js";
import deductCredits from "../utils/deductCredits.js";
import { router } from "../graph/router.js";

export async function agent(req, res) {
  let result;

  const { prompt, conversationId, agent } = req.body;

  const userId = req.headers["x-user-id"];
  const chatServiceUrl = process.env.CHAT_SERVICE_URL;

  let selectedAgent;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  if (!prompt?.trim() || !conversationId?.trim() || !agent?.trim()) {
    return res.status(400).json({
      message: "prompt, conversationId, and agent are required",
    });
  }

  if (!chatServiceUrl) {
    throw new Error("CHAT_SERVICE_URL is not configured");
  }

  try {
    const requestHeaders = { "x-user-id": userId };

    // 1. Persist user message.
    await axios.post(
      `${chatServiceUrl}/messages/`,
      {
        conversationId,
        role: "user",
        content: prompt,
      },
      {
        headers: requestHeaders,
        timeout: 10000,
      },
    );

    // Routing to agent
    if (agent === "auto") {
      const routedState = await router({
        prompt,
        agent,
        conversationId,
      });

      selectedAgent = routedState.agent;
    }

    // 2. Generate the response.
    result = await graph.invoke({
      prompt,
      conversationId,
      agent: selectedAgent,
    });

    const rawResponse =
      typeof result?.aiResponse === "string" ? result.aiResponse.trim() : "";
    const aiResponse =
      rawResponse ||
      "I'm sorry, I couldn't generate a response for your request.";

    const artifacts = Array.isArray(result?.artifact)
      ? result.artifact
      : result?.artifact
        ? [result.artifact]
        : [];

    // Deduct Credits
    const creditResult = await deductCredits(
      userId,
      selectedAgent,
      prompt,
      result,
    );

    // 3. Persist assistant message.
    await axios.post(
      `${chatServiceUrl}/messages/`,
      {
        conversationId,
        role: "assistant",
        content: aiResponse,
        images: result?.images || [],
        artifacts,
        artifact: artifacts,
      },
      {
        headers: requestHeaders,
        timeout: 10000,
      },
    );

    // 4. Update Redis once, after persistence succeeds.
    try {
      await updateMemoryBatch(conversationId, [
        { role: "user", content: prompt },
        { role: "assistant", content: aiResponse },
      ]);
    } catch (cacheError) {
      console.error("[Memory-Cache-Error]", cacheError.message);
    }

    return res.status(200).json({
      message: "Agent Response",
      answer: aiResponse,
      images: result?.images || [],
      artifacts,
      artifact: artifacts,
      credits: creditResult.credits,
    });
  } catch (error) {
    console.error("[Agent-Controller Error]", {
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    });

    const statusCode = error?.response?.status || 500;

    const clientMessage =
      error?.response?.data?.message ||
      error?.message ||
      "Internal Server Error";

    return res.status(statusCode).json({
      status: false,
      message: clientMessage,
    });
  }
}
