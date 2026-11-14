import fs from "fs";
import { ingestPDF, retrieveRelevantChunks } from "../utils/rag.js";
import getModel from "../utils/getModel.js";
import getSystemPrompt from "../utils/system-prompt.js";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

export async function pdfRAG(state) {
  try {
    const pdfFiles = (state.files || []).filter(
      (f) => f.mimetype === "application/pdf",
    );
    const filePaths = pdfFiles.map((f) => f.path);
    const store = await ingestPDF(filePaths);
    const context = await retrieveRelevantChunks(store, state.prompt);

    const llm = getModel("pdfRAG");
    const systemPrompt = getSystemPrompt("pdfRAG");

    const messages = [
      new SystemMessage(systemPrompt),
      new HumanMessage(`
                Context: ${context.map((doc) => doc.content).join("\n\n")}
                Question: ${state.prompt}
            `),
    ];

    const response = await llm.invoke(messages);

    return {
      ...state,
      aiResponse: response.content,
    };
  } catch (error) {
    console.error("[PDF-RAG-Agent Error]", {
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    });

    return {
      ...state,
      aiResponse: "Failed to analyze pdf!",
    };
  } finally {
    (state.files || []).forEach((f) => {
      if (f.path && fs.existsSync(f.path)) {
        try {
          fs.unlinkSync(f.path);
        } catch (cleanupError) {
          console.error("[Cleanup Error]", cleanupError.message);
        }
      }
    });
  }
}
