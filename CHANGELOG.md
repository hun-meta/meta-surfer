# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-03-08

### Added

- Multi-provider LLM support (OpenAI, Google, Anthropic, xAI, ZAI) via Vercel AI SDK.
- CLI with `ask`, `search`, `scrape`, `execute`, `research`, and `serve` commands.
- Framework-independent core library with `chat()` and `ask()` entry points.
- SearXNG meta search integration for multi-engine web search.
- Crawl4AI web scraping integration with fallback scraper.
- Piston code execution sandbox for safe remote code running.
- Deep research mode via extreme search for autonomous multi-step investigation.
- Optional Next.js web UI with streaming chat interface.
- Streaming support with markdown buffering (MarkdownJoiner transform).
- Docker Compose setup for external services (SearXNG, Crawl4AI, Piston).
