// Core
export { configure, getModel, getConfig, detectProvider, isOpenAICompatible } from "./core/provider.js";
export type {
  SearchResult,
  SearchQueryResult,
  MultiSearchResponse,
  ScrapeResult,
  ExecuteResult,
  ResearchResult,
  ResearchPlan,
  CodeResult,
  SearchMode,
  LLMProvider,
  MetaSurferConfig,
} from "./core/types.js";
export { truncate, extractDomain } from "./core/utils.js";
export { markdownJoinerTransform } from "./core/parser.js";

// Tools
export { searchMultiQuery, deduplicateAcrossQueries } from "./tools/web-search.js";
export { scrapeUrls } from "./tools/web-scrape.js";
export { executeCode } from "./tools/code-execute.js";
export { extremeSearch } from "./tools/extreme-search.js";

// Engine
export { chat, ask } from "./engine.js";

// Re-export AI SDK types used in public API
export type { ModelMessage, StreamTextResult, ToolSet } from "ai";
