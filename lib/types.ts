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
