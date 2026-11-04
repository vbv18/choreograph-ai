import { ChatGroq } from "@langchain/groq";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOpenRouter } from "@langchain/openrouter";

// Groq with gpt-oss-120b: ultra-fast, robust for chat, routing, and high-quality coding artifacts
export const groq = new ChatGroq({
  model: "openai/gpt-oss-120b",
  temperature: 1,
  apiKey: process.env.GROQ_API_KEY,
});

// OpenRouter deepseek-chat
export const openrouter = new ChatOpenRouter({
  model: "deepseek/deepseek-chat",
  temperature: 0,
  maxTokens: 4096,
  apiKey: process.env.OPENROUTER_API_KEY,
});

// Gemini
export const gemini = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash",
  temperature: 0.4,
  apiKey: process.env.GOOGLE_API_KEY,
});

export default function getModel(agent) {
  switch (agent) {
    case "chat":
      return groq;

    case "coding":
      return openrouter;

    case "search":
      return gemini;

    case "image":
      return groq;

    case "pdf":
      return groq;

    case "ppt":
      return groq;

    default:
      return groq;
  }
}
