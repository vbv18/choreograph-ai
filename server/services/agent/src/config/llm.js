import { ChatGroq } from "@langchain/groq";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOpenRouter } from "@langchain/openrouter";

// Primary models
export const groq = new ChatGroq({
  model: "openai/gpt-oss-120b",
  temperature: 1,
  apiKey: process.env.GROQ_API_KEY,
});

export const openrouter = new ChatOpenRouter({
  model: "deepseek/deepseek-chat",
  temperature: 0,
  maxTokens: 4096,
  apiKey: process.env.OPENROUTER_API_KEY,
});

export const gemini = new ChatGoogleGenerativeAI({
  model: "gemini-3.8-flash",
  temperature: 0.4,
  apiKey: process.env.GOOGLE_API_KEY,
});

// Models with fallbacks
export const chatModel = groq.withFallbacks([gemini]);

export const codingModel = openrouter.withFallbacks([groq]);

export const documentModel = groq.withFallbacks([gemini]);
