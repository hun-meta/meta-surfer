# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.1] - 2026-03-17

### Added

- Language mismatch filter for cross-CJK search queries (e.g., filter Chinese results from Korean queries).
- Content relevance filter for cross-language results (ignore year-only keyword matches).
- Generic page filter for profile.php/detail.php directory pages.
- SearXNG fetch retry with 1.5s backoff on transient failures.
- ReadWebPages execution logging for tool call observability.

### Changed

- Enforce readWebPages as a required step after webSearch in system prompt — LLM now always reads top 2-3 URLs for detailed content.
- Prevent LLM from discarding valid search results to fall back on training data.
- Increase SearXNG timeout from 10s to 15s.
- Increase Crawl4AI timeout from 10s to 15s.
- Increase enhancedFetch timeout from 8s to 12s.
- Move web UI packages (Next.js, React, etc.) from dependencies to devDependencies.
- Clarify service requirements (required/recommended/optional) in all documentation.
- Add library quick start section to getting-started guide.
- Add warning comment against hardcoding proxy credentials in SearXNG settings.

## [0.2.0] - 2026-03-15

### Added

- Copy response button on assistant messages in web UI (show on hover with clipboard feedback).

### Changed

- Extract shared engine config (`getEngineConfig`) and `repairToolCall` handler to eliminate duplication between `chat()` and `ask()`.
- Add `experimental_repairToolCall` to `ask()` for parity with `chat()` — tool call errors are now auto-repaired in both streaming and non-streaming modes.

## [0.1.3] - 2026-03-08

### Changed

- Make `SEARXNG_PROXY_URL` required for stable search performance (previously optional).
- Update `.env.example`, Docker entrypoint, and all documentation to reflect proxy requirement.

## [0.1.2] - 2026-03-08

### Fixed

- CLI now loads `.env.local` from the current working directory instead of the package install path, fixing environment variable loading when installed via npm.

### Changed

- Update CLI guide to clarify `.env.local` is resolved relative to the working directory.

## [0.1.1] - 2026-03-08

### Changed

- Rename package from `web-surfer` to `meta-surfer`.

### Security

- Remove hardcoded proxy credentials from SearXNG settings.
- Purge leaked credentials from entire git history.

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
- Maintainer checklist and release automation command.
- 4-branch strategy documentation (dev → qa → release → main).

### Fixed

- Piston language mapping for JavaScript (`node` → `javascript`).

### Changed

- Upgrade Next.js 14 → 15.5.12 (security fixes).
- Upgrade eslint-config-next to 15.5.12 (fix glob vulnerability).
- Update CONTRIBUTING.md PR target to `dev` branch.
