import { Annotation } from "@langchain/langgraph";

export const AgentState = Annotation.Root({
  prompt: Annotation(),
  aiResponse: Annotation(),
  agent: Annotation(),
  conversationId: Annotation(),
  searchResults: Annotation(),
  images: Annotation(),
  artifact: Annotation(),
  file: Annotation(),
});
