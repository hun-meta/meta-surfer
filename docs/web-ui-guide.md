# Web UI Guide

Web Surfer includes an optional browser-based search interface built with Next.js 14, React 18, and TailwindCSS. The web UI provides a conversational search experience with real-time streaming responses.

## Overview

The web UI consists of:

- **Landing page** with a search input, mode toggle (Web / Deep Research), and suggestion chips
- **Chat interface** that streams AI responses with markdown rendering and source citations
- **Mode toggle** to switch between standard web search and deep research mode
- **API route** at `/api/chat` that bridges the frontend to the core `chat()` engine

### Architecture

```
app/
  layout.tsx          -- Root layout with metadata
  page.tsx            -- Main page (search input + chat interface)
  globals.css         -- TailwindCSS styles
  api/chat/route.ts   -- POST endpoint that calls chat() and streams response

components/
  search-input.tsx    -- Search input with submit/stop controls
  message-list.tsx    -- Renders conversation messages
  markdown-renderer.tsx -- Renders markdown with syntax highlighting
  source-card.tsx     -- Displays source citations
```

The API route imports directly from `src/engine.ts` and returns a streaming response via the Vercel AI SDK's `toDataStreamResponse()`. The frontend uses `@ai-sdk/react`'s `useChat` hook for real-time streaming.

## Development Mode

Run the web UI with hot reload for development:

```bash
# Make sure Docker services are running
docker compose up -d

# Start Next.js dev server
npm run dev
```

This starts the development server at `http://localhost:3000`.

Alternatively, use the CLI:

```bash
npx tsx src/cli.ts serve --dev
```

Or with a custom port:

```bash
npx tsx src/cli.ts serve --dev --port 8000
```

## Production Build

Build and run the optimized production version:

```bash
# Build both library and Next.js app
npm run build

# Start the production server
npm start
```

Or build only the web UI:

```bash
npm run build:web
npm start
```

Or via the CLI (builds and starts in one step):

```bash
web-surfer serve --port 3000
```

## Docker Deployment

The web UI can run as a Docker container alongside the other services.

### Using Docker Compose

The `docker-compose.yml` includes a `web` service under the `web` profile. To start everything including the web UI:

```bash
docker compose --profile web up -d
```

This builds the Next.js app from the included `Dockerfile` and starts it on port 3000. The web container automatically connects to the other services using Docker's internal DNS:

| Service  | Internal URL                |
|----------|----------------------------|
| SearXNG  | `http://searxng:8080`      |
| Crawl4AI | `http://crawl4ai:11235`    |
| Piston   | `http://piston:2000`       |

### Docker Environment Variables

The web service in Docker uses these environment variables (configured in `docker-compose.yml`):

```yaml
environment:
  - ZAI_API_KEY=${ZAI_API_KEY}
  - ZAI_BASE_URL=${ZAI_BASE_URL:-https://api.z.ai/api/coding/paas/v4}
  - ZAI_MODEL=${ZAI_MODEL:-glm-5}
  - SEARXNG_URL=http://searxng:8080
  - CRAWL4AI_URL=http://crawl4ai:11235
  - PISTON_URL=http://piston:2000
```

To use a different provider in Docker, update the environment variables:

```bash
# In .env.local (loaded by docker compose)
OPENAI_API_KEY=sk-your-key
LLM_PROVIDER=openai
LLM_MODEL=gpt-4o
```

## Configuration

The web UI reads configuration from environment variables. Since the API route runs server-side in Node.js, it follows the same provider auto-detection as the CLI and library. See [providers.md](./providers.md) for details.

### Key Environment Variables

| Variable          | Purpose                           | Default                                    |
|-------------------|-----------------------------------|--------------------------------------------|
| `LLM_PROVIDER`   | LLM provider to use              | Auto-detect                                |
| `LLM_MODEL`      | Model ID                         | Provider default                           |
| `OPENAI_API_KEY`  | OpenAI API key                   |                                            |
| `GOOGLE_API_KEY`  | Google AI API key                |                                            |
| `ANTHROPIC_API_KEY`| Anthropic API key               |                                            |
| `XAI_API_KEY`     | xAI API key                     |                                            |
| `ZAI_API_KEY`     | Z.AI API key                    |                                            |
| `ZAI_BASE_URL`    | Z.AI base URL                   | `https://api.z.ai/api/coding/paas/v4`     |
| `SEARXNG_URL`     | SearXNG service URL             | `http://localhost:8080`                    |
| `CRAWL4AI_URL`    | Crawl4AI service URL            | `http://localhost:11235`                   |
| `PISTON_URL`      | Piston service URL              | `http://localhost:2000`                    |

### Request Timeout

The API route sets `maxDuration = 300` (5 minutes) to accommodate deep research queries that involve multiple search and scrape operations. If deploying to a platform with shorter function timeouts (e.g., Vercel free tier at 10 seconds), be aware that extreme mode queries may time out.

## Features

### Search Modes

The UI provides a toggle to switch between two modes:

- **Web** -- Standard search. The AI uses web search, page reading, and code execution tools. Best for quick factual questions.
- **Deep Research** -- Extreme mode. The AI runs the autonomous research pipeline for comprehensive multi-step investigation. Best for complex research questions.

### Streaming

Responses stream in real-time as the AI generates them. The streaming pipeline includes a `markdownJoinerTransform` that buffers incomplete markdown tokens (links, bold text, tables) to prevent rendering glitches mid-stream.

### Markdown Rendering

AI responses are rendered as rich markdown with:
- Headings, lists, and paragraphs
- Code blocks with syntax highlighting (via `rehype-highlight`)
- Tables (via `remark-gfm`)
- Inline citations as clickable links

## Troubleshooting

**Blank page or hydration errors:**
Make sure you are running Node.js 20+ and have all dependencies installed (`npm install`).

**"Failed to fetch" errors in the browser console:**
The Docker services (SearXNG, Crawl4AI, Piston) may not be running. Start them with `docker compose up -d`.

**Responses are cut off:**
If deployed to a serverless platform, check the function timeout. The `maxDuration` is set to 300 seconds, but the platform may enforce a lower limit.

**Provider not found:**
Ensure at least one API key environment variable is set. Check with:
```bash
echo $OPENAI_API_KEY
```
