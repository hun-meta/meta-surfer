# Getting Started

This guide walks you through setting up Web Surfer from scratch -- from installing prerequisites to running your first AI-powered search query.

## Prerequisites

- **Node.js 20+** -- required for the CLI and library
- **Docker** and **Docker Compose** -- required for external services (SearXNG, Crawl4AI, Piston)
- **An LLM API key** -- at least one of: OpenAI, Google, Anthropic, xAI, or Z.AI

## Step 1: Clone the Repository

```bash
git clone https://github.com/your-org/web-surfer.git
cd web-surfer
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
```

The provider is auto-detected from whichever API key is present. See [providers.md](./providers.md) for details on provider priority and configuration.

## Step 4: Start Docker Services

The external services (search engine, web scraper, code sandbox) run via Docker Compose:

```bash
docker compose up -d
```

This starts three services:

| Service  | Port  | Purpose                  |
|----------|-------|--------------------------|
| SearXNG  | 8080  | Meta search engine       |
| Crawl4AI | 11235 | Web page scraping        |
| Piston   | 2000  | Sandboxed code execution |

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
node bin/web-surfer.mjs ask "What is the current weather in Tokyo?"
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

## What's Next

- [CLI Guide](./cli-guide.md) -- complete CLI command and option reference
- [Library Guide](./library-guide.md) -- use Web Surfer as an npm package in your own projects
- [Providers](./providers.md) -- configure different LLM providers
- [Web UI Guide](./web-ui-guide.md) -- run the optional browser-based interface
- [Docker Setup](./docker-setup.md) -- detailed service configuration and troubleshooting
