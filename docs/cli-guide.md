# CLI Guide

Complete reference for the `meta-surfer` command-line interface.

## Installation

After cloning the repository:

```bash
npm install
npm run build:lib
```

The CLI is available as `meta-surfer` (via the `bin/meta-surfer.mjs` shebang wrapper) or through the development runner:

```bash
# Via built CLI
node bin/meta-surfer.mjs <command>

# Via development runner (no build needed)
npx tsx src/cli.ts <command>

# Via npm script
npm run dev:cli -- <command>
```

## Global Options

These options apply to all commands and must be placed **before** the command name:

```
meta-surfer [global-options] <command> [command-options]
```

| Option            | Description                                        | Default            |
|-------------------|----------------------------------------------------|--------------------|
| `--provider <name>` | LLM provider: `openai`, `google`, `anthropic`, `xai`, `zai` | Auto-detect from env |
| `--base-url <url>`  | LLM API base URL                                   | Provider default   |
| `--api-key <key>`   | LLM API key                                        | From env var       |
| `--model <id>`      | Model ID to use                                    | Provider default   |
| `--searxng <url>`   | SearXNG service URL                                | `http://localhost:8080` |
| `--crawl4ai <url>`  | Crawl4AI service URL                               | `http://localhost:11235` |
| `--piston <url>`    | Piston service URL                                 | `http://localhost:2000` |
| `-V, --version`     | Print version number                               |                    |
| `-h, --help`        | Display help                                       |                    |

### Example: Override provider

```bash
meta-surfer --provider openai --model gpt-4o ask "What is Rust?"
```

---

## Commands

### `ask <query>`

Ask a question with AI-powered web search. The AI automatically searches the web, reads relevant pages, and synthesizes an answer with source citations.

```
meta-surfer ask [options] <query...>
```

**Arguments:**

| Argument    | Description              |
|-------------|--------------------------|
| `<query...>` | Your question (multiple words joined automatically) |

**Options:**

| Option             | Description                          | Default |
|--------------------|--------------------------------------|---------|
| `-m, --mode <mode>` | Search mode: `web` or `extreme`     | `web`   |
| `--stream`          | Stream the response token-by-token  | `false` |

**Search Modes:**

- `web` -- Standard mode. The AI uses `webSearch`, `readWebPages`, and `executeCode` tools. Up to 5 tool-calling steps.
- `extreme` -- Deep research mode. The AI uses the `extremeSearch` tool which autonomously plans research, runs multiple searches, reads pages, and optionally executes code. Limited to 3 steps.

**Examples:**

```bash
# Basic question
meta-surfer ask "What is quantum computing?"

# Stream the response
meta-surfer ask --stream "Latest news about SpaceX"

# Deep research mode
meta-surfer ask --mode extreme "Compare React, Vue, and Svelte performance in 2025"

# Multi-word queries work naturally
meta-surfer ask what is the tallest building in the world
```

---

### `search <query>`

Search the web via SearXNG without any AI processing. Returns raw search results.

```
meta-surfer search [options] <query...>
```

**Arguments:**

| Argument    | Description          |
|-------------|----------------------|
| `<query...>` | Search query        |

**Options:**

| Option           | Description                    | Default |
|------------------|--------------------------------|---------|
| `-n, --num <count>` | Maximum results to display  | `10`    |
| `--json`           | Output results as JSON        | `false` |

**Examples:**

```bash
# Basic search
meta-surfer search "TypeScript 5.0 features"

# Limit to 5 results
meta-surfer search -n 5 "best static site generators"

# JSON output (useful for piping)
meta-surfer search --json "Node.js 22" | jq '.searches[0].results[:3]'
```

**Output format (text):**

```
TypeScript 5.0 Announcement
  https://devblogs.microsoft.com/typescript/...
  TypeScript 5.0 introduces decorators, const type parameters...

15 results found.
```

---

### `scrape <urls>`

Scrape web page content using Crawl4AI (with an automatic fallback to a built-in HTML fetcher).

```
meta-surfer scrape [options] <urls...>
```

**Arguments:**

| Argument    | Description                       |
|-------------|-----------------------------------|
| `<urls...>` | One or more URLs to scrape        |

**Options:**

| Option   | Description             | Default |
|----------|-------------------------|---------|
| `--json` | Output results as JSON  | `false` |

**Examples:**

```bash
# Scrape a single page
meta-surfer scrape https://example.com

# Scrape multiple pages
meta-surfer scrape https://example.com https://example.org

# JSON output
meta-surfer scrape --json https://news.ycombinator.com
```

**Output format (text):**

```
--- Example Domain ---
URL: https://example.com
Success: true
This domain is for use in illustrative examples...
```

---

### `execute <language>`

Execute code in a sandboxed environment via Piston. Supports multiple programming languages.

```
meta-surfer execute [options] <language>
```

**Arguments:**

| Argument     | Description                                              |
|--------------|----------------------------------------------------------|
| `<language>` | Programming language (see supported languages below)     |

**Options:**

| Option            | Description                    | Default |
|-------------------|--------------------------------|---------|
| `-c, --code <code>` | Inline code to execute       |         |
| `-f, --file <path>` | Path to a file to execute    |         |
| `--json`            | Output result as JSON         | `false` |

You must provide either `--code` or `--file`. The process exits with code 0 on success and 1 on failure.

**Supported Languages:**

| Name           | Aliases            | Piston Runtime | Version  |
|----------------|--------------------|----------------|----------|
| Python         | `python`           | python         | 3.10.0   |
| JavaScript     | `javascript`, `js`, `node` | node   | 18.15.0  |
| TypeScript     | `typescript`, `ts` | typescript     | 5.0.3    |
| Bash           | `bash`             | bash           | 5.2.0    |
| Ruby           | `ruby`             | ruby           | 3.0.1    |
| Go             | `go`               | go             | 1.16.2   |
| Java           | `java`             | java           | 15.0.2   |
| C              | `c`                | c              | 10.2.0   |
| C++            | `cpp`              | cpp            | 10.2.0   |
| Rust           | `rust`             | rust           | 1.68.2   |

**Examples:**

```bash
# Inline Python
meta-surfer execute python -c "print(sum(range(100)))"

# From a file
meta-surfer execute javascript -f script.js

# JSON output
meta-surfer execute --json python -c "import sys; print(sys.version)"

# TypeScript
meta-surfer execute ts -c "const x: number = 42; console.log(x)"
```

**Notes:**
- Execution timeout is 3 seconds (both compile and run).
- Piston must have the target language runtime installed. See [docker-setup.md](./docker-setup.md) for instructions.

---

### `research <query>`

Perform deep autonomous research on a topic. This command runs the extreme search pipeline directly: it creates a research plan, executes multiple searches, reads key pages, and optionally runs code for data analysis.

```
meta-surfer research [options] <query...>
```

**Arguments:**

| Argument    | Description           |
|-------------|-----------------------|
| `<query...>` | Research question    |

**Options:**

| Option   | Description                                        | Default |
|----------|----------------------------------------------------|---------|
| `--json` | Output raw research results as JSON                | `false` |
| `--ai`   | Synthesize results with AI into a final answer     | `false` |

**Examples:**

```bash
# Raw research results (plan, sources, code results)
meta-surfer research "What are the latest advances in fusion energy?"

# JSON output for programmatic use
meta-surfer research --json "Compare GDP growth of G7 countries in 2024"

# AI-synthesized answer (uses extreme mode under the hood)
meta-surfer research --ai "How does WebAssembly compare to JavaScript performance?"
```

**Output format (text, without --ai):**

```
=== Research Plan ===

## Current State of Fusion Energy
  - latest fusion energy breakthroughs 2025
  - ITER project progress update

## Commercial Viability
  - fusion energy commercial timeline
  - private fusion companies funding

=== Sources (42) ===

Fusion Energy Progress Report
  https://example.com/fusion-report
  The latest developments in fusion energy...
```

---

### `serve`

Start the optional Next.js web UI. This launches a browser-based search interface.

```
meta-surfer serve [options]
```

**Options:**

| Option            | Description              | Default |
|-------------------|--------------------------|---------|
| `-p, --port <port>` | Port number            | `3000`  |
| `--dev`             | Run in development mode | `false` |

**Examples:**

```bash
# Start production server (builds first, then serves)
meta-surfer serve

# Development mode with hot reload
meta-surfer serve --dev

# Custom port
meta-surfer serve --port 8000 --dev
```

See the [Web UI Guide](./web-ui-guide.md) for more details.

---

## Environment Variable Loading

The CLI automatically loads environment variables from these files (in order) relative to the **current working directory** (where you run the command):

1. `.env.local` (Next.js convention, higher priority)
2. `.env`

Variables from `.env.local` take precedence over `.env`. Both files are optional.

When installed globally or via npm, place your `.env.local` in the directory where you invoke `meta-surfer`.

## Exit Codes

| Code | Meaning                                   |
|------|-------------------------------------------|
| `0`  | Success                                   |
| `1`  | Error (code execution failure, missing arguments, etc.) |
