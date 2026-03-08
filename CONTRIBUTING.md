# Contributing to Web Surfer

Thank you for your interest in contributing to Web Surfer. This guide covers everything you need to get started.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Code Style and Conventions](#code-style-and-conventions)
- [Commit Convention](#commit-convention)
- [Pull Request Guidelines](#pull-request-guidelines)
- [Reporting Issues](#reporting-issues)
- [Code of Conduct](#code-of-conduct)

## Getting Started

1. **Fork** the repository on GitHub.
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/<your-username>/web-surfer.git
   cd web-surfer
   ```
3. **Create a branch** for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```
4. **Make your changes**, commit, and push to your fork.
5. **Open a Pull Request** against the `main` branch.

## Development Setup

### Prerequisites

- Node.js 20 or later
- npm
- Docker and Docker Compose (for external services)

### Installation

```bash
npm install
```

### External Services

Web Surfer depends on several external services managed via Docker Compose:

```bash
# Start core services (SearXNG, Crawl4AI, Piston)
docker compose up -d

# Optionally include the Next.js web UI
docker compose --profile web up -d
```

| Service  | Port  | Purpose              |
|----------|-------|----------------------|
| SearXNG  | 8080  | Meta search engine   |
| Crawl4AI | 11235 | Web page scraping    |
| Piston   | 2000  | Code execution sandbox |

### Running in Development

```bash
# CLI development (via tsx)
npm run dev:cli

# Web UI development (Next.js dev server)
npm run dev
```

### Building

```bash
# Build library and CLI only
npm run build:lib

# Build web UI only
npm run build:web

# Build everything
npm run build
```

### Linting

```bash
npm run lint
```

## Code Style and Conventions

- **Language**: TypeScript throughout. Use strict types; avoid `any`.
- **Module system**: ESM (`"type": "module"` in package.json).
- **Imports**: Use relative paths within `src/`. Web UI files under `lib/` re-export from `src/` for `@/` alias compatibility.
- **Architecture**: Core library lives in `src/`. Web UI is optional and lives in `app/` and `components/`. Keep them decoupled.
- **Naming**: camelCase for variables and functions, PascalCase for types, interfaces, and React components. kebab-case for file names.
- **Error handling**: Fail explicitly with meaningful error messages. Never suppress errors silently.
- **Dependencies**: Prefer existing dependencies before adding new ones. Justify any new dependency.

## Commit Convention

This project uses a **Korean-language commit convention**. All commit messages (type, scope, subject, and body) are written in Korean.

See [docs/commit-convention.md](docs/commit-convention.md) for the full specification, including commit types, scope naming, and formatting rules.

If you are not comfortable writing in Korean, write your commit message in English and note it in the PR description. The maintainer will adjust it during the merge.

## Pull Request Guidelines

- Target the `main` branch unless instructed otherwise.
- Keep PRs focused on a single concern. Avoid mixing unrelated changes.
- Provide a clear summary of what changed and why.
- Ensure `npm run lint` passes before submitting.
- If your change adds a new feature, update relevant documentation.
- If your change introduces a breaking change, clearly state it in the PR description.
- Use the [pull request template](.github/PULL_REQUEST_TEMPLATE.md) provided.

## Reporting Issues

- Use the appropriate [issue template](.github/ISSUE_TEMPLATE/) when creating a new issue.
- Search existing issues before creating a new one to avoid duplicates.
- Provide as much context as possible: steps to reproduce, expected vs. actual behavior, environment details.
- For security vulnerabilities, please contact the maintainer directly instead of opening a public issue.

## Code of Conduct

Be respectful and constructive in all interactions. Harassment, discrimination, and toxic behavior are not tolerated. The maintainers reserve the right to remove contributions or ban participants who violate these expectations.
