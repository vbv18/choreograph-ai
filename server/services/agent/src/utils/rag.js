import fs from "fs";
import { PDFParse } from "pdf-parse";
import textSplitter from "../config/text-splitter.js";
import vectorStore from "../config/vectorDB.js";

export async function ingestPDF(filePaths) {
  try {
    const paths = Array.isArray(filePaths) ? filePaths : [filePaths];
    const textPromises = paths.map(async (fp) => {
      const data = await fs.promises.readFile(fp);
      const pdf = new PDFParse({
        data,
      });
      const { text } = await pdf.getText();
      return text;
    });

    const texts = await Promise.all(textPromises);
    const validTexts = texts.filter(Boolean);
    if (!validTexts.length) return null;

    const docs = await textSplitter.createDocuments(validTexts);
    const collectionName = `pdf-${Date.now()}`;

    return await vectorStore(docs, collectionName);
  } catch (error) {
    console.error("[Ingest-PDF Error]", {
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    });
  }
}

export async function retrieveRelevantChunks(store, prompt) {
  try {
    if (!store) return "";
    const relevantDocs = await store.similaritySearch(prompt, 5);

    return relevantDocs.map((doc) => ({
      content: doc.pageContent,
      metadata: doc.metadata,
    }));
  } catch (error) {
    console.error("[Retrieve-Relevant-Chunks Error]", {
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    });
  }
}
