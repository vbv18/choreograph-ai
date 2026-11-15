import "dotenv/config";
import { QdrantVectorStore } from "@langchain/qdrant";
import embeddings from "./embeddings.js";

export default async function vectorStore(docs, collectionName) {
  const vectorStore = await QdrantVectorStore.fromDocuments(docs, embeddings, {
    url: process.env.QDRANT_URL,
    collectionName,
  });

  return vectorStore;
}
