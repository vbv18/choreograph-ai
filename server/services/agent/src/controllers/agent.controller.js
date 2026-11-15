import axios from "axios";
import fs from "fs/promises";
import graph from "../graph/graph.js";
import { router } from "../graph/router.js";
import { updateMemoryBatch } from "../config/memory.js";
import deductCredits from "../utils/deductCredits.js";
import { uploadToS3, getFromS3 } from "../utils/s3.utils.js";
import rateLimiter from "../config/rateLimiter.js";

export async function agent(req, res, next) {
  const { prompt, conversationId, agent: requestedAgent } = req.body;

  const userId = req.headers["x-user-id"];
  const chatServiceUrl = process.env.CHAT_SERVICE_URL;

  let selectedAgent = requestedAgent;

  try {
    // 1. Validate request

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (
      typeof prompt !== "string" ||
      !prompt.trim() ||
      typeof conversationId !== "string" ||
      !conversationId.trim() ||
      typeof requestedAgent !== "string" ||
      !requestedAgent.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "prompt, conversationId, and agent are required",
      });
    }

    if (!chatServiceUrl) {
      throw new Error("CHAT_SERVICE_URL is not configured");
    }

    const requestHeaders = {
      "x-user-id": userId,
    };

    // 2. Agent routing

    if (requestedAgent === "auto") {
      const routedState = await router({
        prompt,
        agent: requestedAgent,
        conversationId,
        files: req.files || [],
      });

      selectedAgent = routedState?.agent;

      if (!selectedAgent || selectedAgent === "auto") {
        throw new Error("Unable to determine the appropriate agent");
      }
    }

    // 3. Rate limiting

    await rateLimiter(userId, selectedAgent);

    // 4. Upload attachments to S3

    const attachments = [];

    if (Array.isArray(req.files) && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const buffer = await fs.readFile(file.path);

          const s3FileName =
            `attachments/${conversationId}/${Date.now()}-${file.originalname}`;

          await uploadToS3(
            s3FileName,
            buffer,
            file.mimetype
          );

          const fileUrl = await getFromS3(
            s3FileName,
            7 * 24 * 60
          );

          attachments.push({
            name: file.originalname,
            url: fileUrl,
            fileType:
              file.mimetype === "application/pdf"
                ? "pdf"
                : "image",
          });

        } catch (uploadError) {
          console.error(
            "[Attachment-Upload-Error]",
            uploadError.message
          );

          throw new Error(
            `Failed to upload attachment: ${file.originalname}`
          );
        }
      }
    }

    // 5. Persist user message

    await axios.post(
      `${chatServiceUrl}/messages/`,
      {
        conversationId,
        role: "user",
        content: prompt.trim(),
        attachments,
      },
      {
        headers: requestHeaders,
        timeout: 10000,
      }
    );

    // 6. Execute selected agent

    const result = await graph.invoke({
      prompt: prompt.trim(),
      conversationId,
      agent: selectedAgent,
      files: req.files || [],
    });

    // 7. Normalize AI response

    const rawResponse =
      typeof result?.aiResponse === "string"
        ? result.aiResponse.trim()
        : "";

    const aiResponse =
      rawResponse ||
      "I'm sorry, I couldn't generate a response for your request.";

    const artifacts = Array.isArray(result?.artifact)
      ? result.artifact
      : result?.artifact
        ? [result.artifact]
        : [];

    const images = Array.isArray(result?.images)
      ? result.images
      : [];

    // 8. Persist assistant message

    await axios.post(
      `${chatServiceUrl}/messages/`,
      {
        conversationId,
        role: "assistant",
        content: aiResponse,
        images,
        artifacts,
      },
      {
        headers: requestHeaders,
        timeout: 10000,
      }
    );

    // 9. Deduct credits

    const creditResult = await deductCredits(
      userId,
      selectedAgent,
      prompt,
      result
    );

    // 10. Update Redis memory

    try {
      await updateMemoryBatch(conversationId, [
        {
          role: "user",
          content: prompt.trim(),
        },
        {
          role: "assistant",
          content: aiResponse,
        },
      ]);
    } catch (cacheError) {
      console.error(
        "[Memory-Cache-Error]",
        cacheError.message
      );
    }

    // 11. Send response

    return res.status(200).json({
      success: true,
      message: "Agent Response",
      answer: aiResponse,
      images,
      artifacts,
      credits: creditResult?.credits,
    });

  } catch (error) {
    return next(error);

  } finally {
    // 12. Clean up temporary uploaded files

    if (Array.isArray(req.files)) {
      await Promise.allSettled(
        req.files
          .filter((file) => file.path)
          .map((file) => fs.unlink(file.path))
      );
    }
  }
}
