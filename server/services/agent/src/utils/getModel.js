import * as llm from "../config/llm.js";

export const MODEL_REGISTRY = {
  chat: llm.chatModel,
  coding: llm.codingModel,
  image: llm.gemini,
  pdf: llm.documentModel,
  pdfRAG: llm.documentModel,
  ppt: llm.documentModel,
  search: llm.gemini,
  vision: llm.gemini,
};

export default function getModel(agent = "chat") {
  return MODEL_REGISTRY[agent] ?? llm.chatModel;
}
