# Meta Surfer

A self-hosted, AI-powered web search engine. An open-source alternative to Perplexity that runs entirely on your own infrastructure.

[![npm version](https://img.shields.io/npm/v/meta-surfer)](https://www.npmjs.com/package/meta-surfer)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](https://nodejs.org)

## Features

- **Multi-provider LLM support** -- OpenAI, Google Gemini, Anthropic Claude, xAI Grok, and Z.AI out of the box, with automatic provider detection
- **Self-hosted search** -- SearXNG meta search engine for private, untracked web queries
- **Three interfaces** -- CLI tool, importable Node.js library, and optional Next.js web UI
- **Deep research mode** -- Autonomous multi-step research that plans queries, searches, scrapes pages, and synthesizes answers
- **Code execution** -- Sandboxed code running via Piston for calculations and data analysis
- **Streaming** -- Real-time streamed responses in both CLI and library modes

## Quick Start

```bash
# 1. Clone and install
git clone https://github.com/hun-meta/meta-surfer.git
cd meta-surfer
npm install

# 2. Configure your LLM provider
cp .env.example .env.local
# Edit .env.local — set at least one API key (e.g. OPENAI_API_KEY)

# 3. Start external services
docker compose up -d

# 4. Ask your first question
npx tsx src/cli.ts ask "What is the current population of Tokyo?"
```

## Installation

```bash
# As a project dependency
npm install meta-surfer

# Global install for CLI usage
npm install -g meta-surfer
```

After global install, the `meta-surfer` command is available system-wide.

## Configuration

Copy the example environment file and set your API keys:

```bash
cp .env.example .env.local
```

```dotenv
# Pick a provider — only one API key is required.
# The provider is auto-detected from whichever key is set.
OPENAI_API_KEY=sk-...

# External services (defaults match docker-compose.yml)
SEARXNG_URL=http://localhost:8080
CRAWL4AI_URL=http://localhost:11235
PISTON_URL=http://localhost:2000
```

You can also set `LLM_PROVIDER` and `LLM_MODEL` explicitly to override auto-detection. See [docs/providers.md](docs/providers.md) for full configuration details.

## Usage

### CLI

```bash
# AI-powered search
meta-surfer ask "How does photosynthesis work?"

# Deep research mode
meta-surfer ask "Compare React and Vue in 2025" --mode extreme

# Stream the response
meta-surfer ask "Latest news on SpaceX" --stream

# Raw web search (no AI)
meta-surfer search "TypeScript 5.7 release notes" -n 5

# Scrape a web page
meta-surfer scrape https://example.com --json

# Execute code in a sandbox
meta-surfer execute python -c "print(sum(range(100)))"

# Deep autonomous research
meta-surfer research "Impact of AI on healthcare" --ai

# Start the web UI
meta-surfer serve --port 3000
```

Global options (`--provider`, `--base-url`, `--api-key`, `--model`, `--searxng`, `--crawl4ai`, `--piston`) can be passed before any command to override environment configuration.

### Library

```typescript
import { configure, ask, chat } from "meta-surfer";

// Configure the provider (or rely on env vars)
configure({
  provider: "openai",
  apiKey: process.env.OPENAI_API_KEY,
});

// Simple question — returns the full answer
const answer = await ask({ query: "What is quantum computing?" });
console.log(answer);

// Streaming chat
const result = chat({
  messages: [{ role: "user", content: "Explain REST vs GraphQL" }],
  mode: "web",
});

for await (const chunk of result.textStream) {
  process.stdout.write(chunk);
}
```

The library also exports individual tools (`searchMultiQuery`, `scrapeUrls`, `executeCode`, `extremeSearch`) for lower-level usage.

### Web UI

An optional Next.js 14 web interface is included.

```bash
# Development
npm run dev

# Production
npm run build:web && npm start

# Or via Docker
docker compose --profile web up
```

## Supported Providers

| Provider   | Default Model          | Env Var             |
|------------|------------------------|---------------------|
| OpenAI     | `gpt-5.1-chat-latest`    | `OPENAI_API_KEY`    |
| Google     | `gemini-3.1-flash`    | `GOOGLE_API_KEY`    |
| Anthropic  | `claude-opus-4.6`  | `ANTHROPIC_API_KEY` |
| xAI        | `grok-4.1`            | `XAI_API_KEY`       |
| Z.AI       | `glm-5`               | `ZAI_API_KEY`       |

Set one or more API keys in your `.env.local`. The provider is auto-detected from whichever key is present (checked in the order listed above). Override with `LLM_PROVIDER` and `LLM_MODEL` if needed.

## Architecture

Meta Surfer chains three self-hosted services with an LLM to answer questions:

```
User Query
    |
    v
 SearXNG  ------>  Crawl4AI  ------>  LLM  ------>  Answer
 (search)          (scrape)          (synthesize)
    |
    v
 Piston (optional code execution)
```

**External services** (managed via `docker-compose.yml`):

- **SearXNG** -- Privacy-respecting meta search engine aggregating results from multiple search providers
- **Crawl4AI** -- Web page scraper that extracts clean markdown content from URLs
- **Piston** -- Sandboxed code execution engine supporting 50+ programming languages

The core engine (`src/engine.ts`) orchestrates these services as LLM tool calls using the Vercel AI SDK, allowing the model to decide when to search, read pages, or run code.

## Documentation

| Guide | Description |
|-------|-------------|
| [Getting Started](docs/getting-started.md) | Prerequisites, installation, and first query |
| [CLI Guide](docs/cli-guide.md) | Full command reference with examples |
| [Library Guide](docs/library-guide.md) | Programmatic usage, API reference, integrations |
| [Providers](docs/providers.md) | LLM provider configuration and auto-detection |
| [Web UI Guide](docs/web-ui-guide.md) | Next.js web interface setup |
| [Docker Setup](docs/docker-setup.md) | External services configuration and troubleshooting |
| [Commit Convention](docs/commit-convention.md) | Git commit message format |

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

[MIT](LICENSE) -- Copyright (c) hun-meta
