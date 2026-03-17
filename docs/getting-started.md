# Getting Started

This guide walks you through setting up Meta Surfer from scratch -- from installing prerequisites to running your first AI-powered search query.

## Prerequisites

- **Node.js 20+** -- required for the CLI and library
- **An LLM API key** -- at least one of: OpenAI, Google, Anthropic, xAI, or Z.AI
- **SearXNG** (required) -- meta search engine. Without it, web search is unavailable
- **Crawl4AI** (recommended) -- web page scraper. A built-in HTML fallback is used when unavailable
- **Piston** (optional) -- code execution sandbox. Only needed for calculations and code analysis

**Running the services:** The included `docker-compose.yml` is the easiest way to run SearXNG, Crawl4AI, and Piston locally. However, Docker is not strictly required -- you can point Meta Surfer to services hosted anywhere by setting their URLs via `configure()` or environment variables.

## Step 1: Clone the Repository

```bash
git clone https://github.com/your-org/meta-surfer.git
cd meta-surfer
```

## Step 2: Install Dependencies

```bash
npm install
```

## Step 3: Configure Environment Variables

Copy the example environment file and fill in your API keys:

```bash
cp .env.example .env.local
```

Open `.env.local` and set at minimum one LLM provider API key:

```bash
# Pick one (or more) provider(s):
OPENAI_API_KEY=sk-your-openai-key
# GOOGLE_API_KEY=your-google-key
# ANTHROPIC_API_KEY=your-anthropic-key
# XAI_API_KEY=your-xai-key
# ZAI_API_KEY=your-zai-key

# Service URLs (defaults shown -- no changes needed for standard Docker setup)
SEARXNG_URL=http://localhost:8080
CRAWL4AI_URL=http://localhost:11235
PISTON_URL=http://localhost:2000

# SearXNG outbound proxy (required for stable search performance)
SEARXNG_PROXY_URL=http://user:pass@proxy-host:port
```

The provider is auto-detected from whichever API key is present. See [providers.md](./providers.md) for details on provider priority and configuration.

## Step 4: Start Docker Services

The external services (search engine, web scraper, code sandbox) run via Docker Compose:

```bash
docker compose up -d
```

This starts three services:

| Service  | Port  | Required? | Purpose                  |
|----------|-------|-----------|--------------------------|
| SearXNG  | 8080  | **Required** | Meta search engine       |
| Crawl4AI | 11235 | Recommended | Web page scraping (has built-in fallback) |
| Piston   | 2000  | Optional | Sandboxed code execution |

Wait about 30 seconds for all services to finish initializing before proceeding.

## Step 5: Verify Services Are Running

Check that each service responds:

```bash
# SearXNG -- should return JSON search results
curl "http://localhost:8080/search?q=test&format=json" | head -c 200

# Crawl4AI -- should return a health check or status
curl http://localhost:11235/health

# Piston -- should list available runtimes
curl http://localhost:2000/api/v2/runtimes | head -c 200
```

If Piston returns no runtimes, install a language runtime:

```bash
# Install Python runtime in Piston
curl -X POST http://localhost:2000/api/v2/packages \
  -H "Content-Type: application/json" \
  -d '{"language": "python", "version": "3.10.0"}'
```

## Step 6: Build the CLI

```bash
npm run build:lib
```

This compiles the library and CLI to the `dist/` directory.

## Step 7: Run Your First Query

Using the development runner (no build step required):

```bash
npx tsx src/cli.ts ask "What is the current weather in Tokyo?"
```

Or using the built CLI:

```bash
node bin/meta-surfer.mjs ask "What is the current weather in Tokyo?"
```

You should see the AI search the web via SearXNG, read relevant pages, and return a sourced answer.

## Step 8: Try More Commands

```bash
# Raw web search (no AI)
npx tsx src/cli.ts search "Node.js 22 release date"

# Scrape a specific web page
npx tsx src/cli.ts scrape https://example.com

# Execute code in a sandbox
npx tsx src/cli.ts execute python -c "print(sum(range(100)))"

# Deep research mode
npx tsx src/cli.ts ask --mode extreme "Compare the top 3 JavaScript frameworks in 2025"
```

See the [CLI Guide](./cli-guide.md) for the full command reference.

## Library Quick Start

If you want to use Meta Surfer as an npm package in your own project (instead of the CLI), follow these steps:

```bash
npm install meta-surfer
```

> **Important:** The library does **not** auto-load `.env` files. Unlike the CLI (which reads `.env.local` and `.env` automatically), library users must pass configuration explicitly via `configure()` or ensure environment variables are set by their own application.

```typescript
import { configure, ask } from "meta-surfer";

// You must configure before calling any API function
configure({
  provider: "openai",
  apiKey: process.env.OPENAI_API_KEY,
  searxngURL: "http://localhost:8080",  // required -- SearXNG must be reachable
});

const answer = await ask({ query: "What is quantum computing?" });
console.log(answer);
```

**Requirements:**

- **Node.js >= 20** with **ESM support** (`"type": "module"` in your `package.json`, or use `.mts` files)
- **SearXNG** reachable at the configured URL (search will fail without it)
- **At least one LLM API key** passed via `configure()` or environment variables
- **Network connectivity** from your runtime to SearXNG, Crawl4AI (if used), and the LLM provider API

See the [Library Guide](./library-guide.md) for full API reference and integration examples.

## What's Next

- [CLI Guide](./cli-guide.md) -- complete CLI command and option reference
- [Library Guide](./library-guide.md) -- use Meta Surfer as an npm package in your own projects
- [Providers](./providers.md) -- configure different LLM providers
- [Web UI Guide](./web-ui-guide.md) -- run the optional browser-based interface
- [Docker Setup](./docker-setup.md) -- detailed service configuration and troubleshooting
