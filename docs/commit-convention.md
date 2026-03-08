# Commit Convention

Defines the Git commit message rules for this project.

## Format

```
<type>(<scope>): <subject>

<body (optional)>

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

## Types

| Type | Description | Example |
|------|-------------|---------|
| `init` | Project scaffolding, initial setup | init(project): scaffold project and build config |
| `feat` | New feature | feat(cli): implement Commander-based CLI |
| `fix` | Bug fix | fix(scraper): handle empty response from Crawl4AI |
| `refactor` | Refactoring, performance improvement (no behavior change) | refactor(provider): restructure provider factory |
| `docs` | Documentation add/update | docs(project): add getting started guide |
| `chore` | Build, CI/CD, environment config changes | chore(docker): add SearXNG container config |
| `test` | Test add/update | test(provider): add OpenAI provider unit tests |
| `style` | Formatting, whitespace (no logic change) | style(all): normalize import ordering |
| `ci` | CI/CD pipeline changes | ci(github): add release workflow |

## Rules

1. **Subject and body must be written in English**
2. Subject must be under 50 characters
3. Do not end the subject with a period
4. Body should explain "what" and "why", not "how"
5. Scope must specify the target module/area in parentheses
6. Each commit should contain only one logical change

## Scope Examples

| Scope | Target |
|-------|--------|
| `project` | Root config, whole project |
| `core` | `src/core/` |
| `tools` | `src/tools/` |
| `engine` | `src/engine.ts` |
| `cli` | `src/cli.ts` |
| `provider` | `src/core/provider.ts` |
| `web` | `app/`, `components/` |
| `docker` | `docker-compose.yml` |
| `docs` | `docs/` |
| `deps` | Dependencies |

## Example

```
feat(tools): add multi-query parallel web search

- Implement SearXNG multi-query search with deduplication
- Auto-scrape top results with content < 500 chars
- Return up to 20 deduplicated results

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```
