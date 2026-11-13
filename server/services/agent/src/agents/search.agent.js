// Search Agent Implementation Roadmap:
// 1. Query external search API (e.g. Tavily, Serper, Google Search) with state.prompt
// 2. Synthesize or rank relevant search results and web citations
// 3. Attach search context to state before passing down the graph to chatAgent
import { searchTool } from "../config/tavily.js";

export async function searchAgent(state) {
  try {
    const results = await searchTool.invoke({
      query: state.prompt,
    });

    // console.log(results);

    return {
      ...state,
      searchResults: results,
      images: results.images,
    };
  } catch (error) {
    console.error("[Search-Agent Error]", {
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    });

    return {
      ...state,
      searchResults: [],
      images: [],
    };
  }
}
