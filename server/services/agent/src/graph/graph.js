import { StateGraph } from "@langchain/langgraph";
import { AgentState } from "./state.js";
import { router } from "./router.js";
import * as agents from "../agents/agents.js";

const workflow = new StateGraph(AgentState);

workflow.addNode("router", router);
workflow.addNode("chat", agents.chatAgent);
workflow.addNode("coding", agents.codingAgent);
workflow.addNode("image", agents.imageAgent);
workflow.addNode("pdf", agents.pdfAgent);
workflow.addNode("pdfRAG", agents.pdfRAG);
workflow.addNode("ppt", agents.pptAgent);
workflow.addNode("search", agents.searchAgent);
workflow.addNode("vision", agents.visionAgent);

workflow.addEdge("__start__", "router");
workflow.addConditionalEdges(
  "router",
  (state) => {
    switch (state.agent) {
      case "chat":
        return "chat";
      case "coding":
        return "coding";
      case "image":
        return "image";
      case "pdf":
        return "pdf";
      case "pdfRAG":
        return "pdfRAG";
      case "ppt":
        return "ppt";
      case "search":
        return "search";
      case "vision":
        return "vision";

      default:
        return "chat";
    }
  },
  {
    chat: "chat",
    coding: "coding",
    image: "image",
    pdf: "pdf",
    pdfRAG: "pdfRAG",
    ppt: "ppt",
    search: "search",
    vision: "vision",
  },
);

workflow.addEdge("pdfRAG", "chat");
workflow.addEdge("search", "chat");
workflow.addEdge("vision", "chat");

workflow.addEdge("chat", "__end__");
workflow.addEdge("coding", "__end__");
workflow.addEdge("image", "__end__");
workflow.addEdge("pdf", "__end__");
workflow.addEdge("ppt", "__end__");

const graph = workflow.compile();

export default graph;
