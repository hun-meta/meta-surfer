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

export interface WebSurferConfig {
  /** Z.AI or OpenAI-compatible API base URL */
  baseURL?: string;
  /** API key */
  apiKey?: string;
  /** Model ID (default: glm-4-plus) */
  model?: string;
  /** SearXNG service URL */
  searxngURL?: string;
  /** Crawl4AI service URL */
  crawl4aiURL?: string;
  /** Piston code execution service URL */
  pistonURL?: string;
}
