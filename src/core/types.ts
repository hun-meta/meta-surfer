export interface SearchResult {
  title: string;
  url: string;
  content: string;
  favicon?: string;
}

export interface SearchQueryResult {
  query: string;
  results: SearchResult[];
}

export interface MultiSearchResponse {
  searches: SearchQueryResult[];
  totalResults: number;
}

export interface ScrapeResult {
  url: string;
  markdown: string;
  title: string;
  success: boolean;
}

export interface ExecuteResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  language: string;
}

export interface ResearchResult {
  plan: ResearchPlan[];
  sources: SearchResult[];
  codeResults: CodeResult[];
}

export interface ResearchPlan {
  title: string;
  queries: string[];
}

export interface CodeResult {
  title: string;
  code: string;
  stdout: string;
  stderr: string;
  success: boolean;
}

export type SearchMode = "web" | "extreme";

export type LLMProvider = "openai" | "google" | "anthropic" | "xai" | "zai";

export interface MetaSurferConfig {
  /** LLM provider: openai, google, anthropic, xai, zai (default: auto-detect from env) */
  provider?: LLMProvider;
  /** API base URL (only needed for OpenAI-compatible / ZAI) */
  baseURL?: string;
  /** API key (falls back to provider-specific env var) */
  apiKey?: string;
  /** Model ID (defaults per provider: gpt-5.1-chat-latest, gemini-3.1-flash, claude-opus-4.6, grok-4.1, glm-5) */
  model?: string;
  /** SearXNG service URL */
  searxngURL?: string;
  /** Crawl4AI service URL */
  crawl4aiURL?: string;
  /** Piston code execution service URL */
  pistonURL?: string;
}
