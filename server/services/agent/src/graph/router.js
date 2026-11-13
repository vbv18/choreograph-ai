import getSystemPrompt from "../utils/system-prompt.js";
import getModel from "../utils/getModel.js";

export async function router(state) {
  if (state.agent && state.agent !== "auto") {
    return {
      ...state,
      agent: state.agent,
    };
  }

  // PDF-RAG Agent Routing
  if (state.file.mimetype === "application/pdf") {
    return {
      ...state,
      agent: "pdfRAG",
    };
  }

  // Vision Agent Routing
  if (state.file.startsWith === "image/") {
    return {
      ...state,
      agent: "vision",
    };
  }

  const llm = getModel("router");
  const systemPrompt = getSystemPrompt("router", state.prompt);
  // console.log(systemPrompt);

  const response = await llm.invoke(systemPrompt);
  const text = (response?.content || "").toLowerCase().trim();

  console.log("Agent used:", text);

  const validAgents = [
    "chat",
    "coding",
    "image",
    "pdf",
    "pdfRAG",
    "ppt",
    "search",
    "vision",
  ];
  const matchedAgent =
    validAgents.find((agent) => text.includes(agent)) || "chat";

  return {
    ...state,
    agent: matchedAgent,
  };
}
