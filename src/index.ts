// Core
export { configure, getModel, getConfig, detectProvider, isOpenAICompatible } from "./core/provider";
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
  WebSurferConfig,
} from "./core/types";
export { truncate, extractDomain } from "./core/utils";
export { markdownJoinerTransform } from "./core/parser";

// Tools
export { searchMultiQuery, deduplicateAcrossQueries } from "./tools/web-search";
export { scrapeUrls } from "./tools/web-scrape";
export { executeCode } from "./tools/code-execute";
export { extremeSearch } from "./tools/extreme-search";

// Engine
export { chat, ask } from "./engine";
