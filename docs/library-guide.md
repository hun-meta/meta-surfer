# Library Guide

Web Surfer can be used as an npm package in your own Node.js and TypeScript projects. This guide covers installation, configuration, and API usage.

## Installation

```bash
npm install web-surfer
```

**Peer dependencies** (installed automatically with npm 7+):

- `ai` (Vercel AI SDK v4)
- `@ai-sdk/openai`
- `zod`

## Configuration

Before calling any API function, configure the LLM provider and service URLs using `configure()`:

```typescript
import { configure } from "web-surfer";

configure({
  provider: "openai",
  apiKey: "sk-your-api-key",
  model: "gpt-4o",
  // Optional -- defaults to http://localhost:PORT for each service
  searxngURL: "http://localhost:8080",
  crawl4aiURL: "http://localhost:11235",
  pistonURL: "http://localhost:2000",
});
```

### Configuration Options

The `WebSurferConfig` interface accepts:

| Field        | Type          | Description                                            | Default                    |
|--------------|---------------|--------------------------------------------------------|----------------------------|
| `provider`   | `LLMProvider` | LLM provider name                                     | Auto-detect from env       |
| `baseURL`    | `string`      | API base URL (for proxies or OpenAI-compatible endpoints) | Provider default        |
| `apiKey`     | `string`      | API key                                                | From provider-specific env var |
| `model`      | `string`      | Model ID                                               | Provider default           |
| `searxngURL` | `string`      | SearXNG service URL                                    | `http://localhost:8080`    |
| `crawl4aiURL`| `string`      | Crawl4AI service URL                                   | `http://localhost:11235`   |
| `pistonURL`  | `string`      | Piston service URL                                     | `http://localhost:2000`    |

If you don't call `configure()`, the library falls back to environment variables. See [providers.md](./providers.md) for details.

## Core API

### `ask()` -- Non-Streaming

Returns a complete text response. Best for CLI tools, scripts, and batch processing.

```typescript
import { configure, ask } from "web-surfer";

configure({ provider: "openai", apiKey: process.env.OPENAI_API_KEY });

const answer = await ask({
  query: "What is the capital of France?",
  mode: "web",      // optional, defaults to "web"
});

console.log(answer);
```

**Parameters:**

| Field   | Type         | Description                        | Default |
|---------|-------------|-------------------------------------|---------|
| `query` | `string`    | The question to answer              | required |
| `mode`  | `SearchMode`| `"web"` or `"extreme"` (deep research) | `"web"` |

**Returns:** `Promise<string>` -- the full answer text.

### `chat()` -- Streaming

Returns a Vercel AI SDK `streamText` result. Best for real-time UIs and streaming responses.

```typescript
import { configure, chat } from "web-surfer";
import type { CoreMessage } from "ai";

configure({ provider: "openai", apiKey: process.env.OPENAI_API_KEY });

const messages: CoreMessage[] = [
  { role: "user", content: "Compare React and Vue" },
];

const result = chat({ messages, mode: "web" });

// Stream text chunks
for await (const chunk of result.textStream) {
  process.stdout.write(chunk);
}
```

**Parameters:**

| Field      | Type            | Description                        | Default |
|------------|-----------------|-------------------------------------|---------|
| `messages` | `CoreMessage[]` | Conversation history (AI SDK format) | required |
| `mode`     | `SearchMode`    | `"web"` or `"extreme"`              | `"web"` |

**Returns:** A Vercel AI SDK `StreamTextResult` with:
- `textStream` -- async iterable of text chunks
- `toDataStreamResponse()` -- convert to a streaming HTTP response (for web frameworks)
- `toTextStreamResponse()` -- convert to a plain text stream response

## Using Individual Tools

You can call the underlying tools directly without the AI orchestration layer.

### `searchMultiQuery()`

Search the web via SearXNG with multiple queries in parallel.

```typescript
import { configure, searchMultiQuery } from "web-surfer";

configure({ searxngURL: "http://localhost:8080" });

const response = await searchMultiQuery([
  "TypeScript 5.0 features",
  "TypeScript decorators guide",
]);

console.log(`Total results: ${response.totalResults}`);

for (const search of response.searches) {
  console.log(`\nQuery: ${search.query}`);
  for (const result of search.results) {
    console.log(`  ${result.title} - ${result.url}`);
  }
}
```

**Returns:** `MultiSearchResponse`

```typescript
interface MultiSearchResponse {
  searches: SearchQueryResult[];
  totalResults: number;
}

interface SearchQueryResult {
  query: string;
  results: SearchResult[];
}

interface SearchResult {
  title: string;
  url: string;
  content: string;
  favicon?: string;
}
```

### `scrapeUrls()`

Scrape web page content. Uses Crawl4AI as the primary scraper with a built-in HTML fallback.

```typescript
import { configure, scrapeUrls } from "web-surfer";

configure({ crawl4aiURL: "http://localhost:11235" });

const results = await scrapeUrls([
  "https://example.com",
  "https://news.ycombinator.com",
]);

for (const page of results) {
  if (page.success) {
    console.log(`${page.title}: ${page.markdown.length} chars`);
  }
}
```

**Returns:** `ScrapeResult[]`

```typescript
interface ScrapeResult {
  url: string;
  markdown: string;
  title: string;
  success: boolean;
}
```

### `executeCode()`

Execute code in a sandboxed Piston environment.

```typescript
import { configure, executeCode } from "web-surfer";

configure({ pistonURL: "http://localhost:2000" });

const result = await executeCode("python", `
import math
print(f"Pi = {math.pi:.10f}")
`);

if (result.exitCode === 0) {
  console.log(result.stdout);
} else {
  console.error(result.stderr);
}
```

**Returns:** `ExecuteResult`

```typescript
interface ExecuteResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  language: string;
}
```

### `extremeSearch()`

Run the autonomous deep research pipeline. Creates a research plan, runs searches, scrapes pages, and optionally executes code -- all automatically.

```typescript
import { configure, extremeSearch } from "web-surfer";

configure({
  provider: "openai",
  apiKey: process.env.OPENAI_API_KEY,
  searxngURL: "http://localhost:8080",
  crawl4aiURL: "http://localhost:11235",
  pistonURL: "http://localhost:2000",
});

const result = await extremeSearch("How do modern CPUs handle branch prediction?");

console.log("Research plan:");
for (const step of result.plan) {
  console.log(`  ${step.title}: ${step.queries.join(", ")}`);
}

console.log(`\nSources found: ${result.sources.length}`);
console.log(`Code results: ${result.codeResults.length}`);
```

**Returns:** `ResearchResult`

```typescript
interface ResearchResult {
  plan: ResearchPlan[];
  sources: SearchResult[];
  codeResults: CodeResult[];
}

interface ResearchPlan {
  title: string;
  queries: string[];
}

interface CodeResult {
  title: string;
  code: string;
  stdout: string;
  stderr: string;
  success: boolean;
}
```

## Utility Exports

```typescript
import {
  // Provider utilities
  getModel,          // Get the configured LanguageModelV1 instance
  getConfig,         // Get the current WebSurferConfig
  detectProvider,    // Detect the active LLM provider
  isOpenAICompatible, // Check if provider uses OpenAI-compatible protocol

  // Helper functions
  truncate,          // Truncate a string to a max length
  extractDomain,     // Extract domain from a URL

  // Streaming
  markdownJoinerTransform, // Transform stream that buffers incomplete markdown tokens
  deduplicateAcrossQueries, // Deduplicate search results across multiple queries
} from "web-surfer";
```

## TypeScript Types

All types are exported and available for import:

```typescript
import type {
  SearchResult,
  SearchQueryResult,
  MultiSearchResponse,
  ScrapeResult,
  ExecuteResult,
  ResearchResult,
  ResearchPlan,
  CodeResult,
  SearchMode,        // "web" | "extreme"
  LLMProvider,       // "openai" | "google" | "anthropic" | "xai" | "zai"
  WebSurferConfig,
} from "web-surfer";
```

## Integration Examples

### Express.js Server

```typescript
import express from "express";
import { configure, chat } from "web-surfer";
import type { CoreMessage } from "ai";

configure({
  provider: "openai",
  apiKey: process.env.OPENAI_API_KEY,
});

const app = express();
app.use(express.json());

app.post("/api/chat", async (req, res) => {
  const { messages, mode } = req.body as {
    messages: CoreMessage[];
    mode?: "web" | "extreme";
  };

  const result = chat({ messages, mode });

  // Stream the response using Vercel AI SDK's built-in method
  const response = result.toDataStreamResponse();

  // Forward headers and body
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });
  res.status(response.status);

  if (response.body) {
    const reader = response.body.getReader();
    const pump = async () => {
      const { done, value } = await reader.read();
      if (done) { res.end(); return; }
      res.write(value);
      await pump();
    };
    await pump();
  }
});

app.listen(3000);
```

### Fastify Server

```typescript
import Fastify from "fastify";
import { configure, ask } from "web-surfer";

configure({
  provider: "anthropic",
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const fastify = Fastify();

fastify.post("/api/ask", async (request, reply) => {
  const { query, mode } = request.body as {
    query: string;
    mode?: "web" | "extreme";
  };

  const answer = await ask({ query, mode });
  return { answer };
});

fastify.listen({ port: 3000 });
```

### Simple Script

```typescript
import { configure, ask, searchMultiQuery } from "web-surfer";

configure({
  provider: "openai",
  apiKey: process.env.OPENAI_API_KEY,
});

async function main() {
  // Direct search without AI
  const searchResults = await searchMultiQuery(["Node.js 22 release"]);
  console.log("Search results:", searchResults.totalResults);

  // AI-powered answer
  const answer = await ask({ query: "What's new in Node.js 22?" });
  console.log("\nAI Answer:", answer);
}

main();
```
