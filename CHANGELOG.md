# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
