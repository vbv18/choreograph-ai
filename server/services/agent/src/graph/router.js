import getSystemPrompt from "../utils/system-prompt.js";
import getModel from "../utils/getModel.js";

export async function router(state) {
  if (state.agent && state.agent !== "auto") {
    console.log("Agent used:", state.agent);

    return {
      ...state,
      agent: state.agent,
    };
  }

  const files = state.files || [];

  // PDF-RAG Agent Routing
  if (files.some((f) => f.mimetype === "application/pdf")) {
    console.log("Agent used: pdfRAG");

    return {
      ...state,
      agent: "pdfRAG",
    };
  }

  // Vision Agent Routing
  if (files.some((f) => f.mimetype?.startsWith("image/"))) {
    console.log("Agent used: vision");

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
