import * as prompts from "../../../lib/prompts.js";

export default function getSystemPrompt(agent, content = "") {
  switch (agent) {
    case "router":
      return prompts.router + content;

    case "chat":
      return prompts.chat + content;

    case "code_generation":
      return prompts.code_generation + content;

    case "code_review":
      return prompts.code_review + content;

    case "image_description":
      return prompts.image_description + content;

    case "pdf":
      return prompts.pdf + content;

    case "ppt":
      return prompts.ppt + content;

    case "search":
      return prompts.search + content;

    case "intent":
      return prompts.intent + content;

    default:
      return "";
  }
}
