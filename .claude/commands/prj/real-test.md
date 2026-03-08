End-to-end validation of the published npm package. Installs meta-surfer from npm in a temp directory and tests both CLI and Library modes with a real AI-powered search query.

## Arguments

Parse `$ARGUMENTS` for:
- **Query** (optional): Custom test query string. Default: `"2026년 삼성전자, 하이닉스 영업이익 전망"`
- **--cli-only**: Skip Library test, run CLI only
- **--lib-only**: Skip CLI test, run Library only
- **--keep**: Do not delete the temp directory after testing

## Procedure

### Phase 1: Setup

#### 1.1 Read Environment

Read the current project's `.env.local` to extract:
- `LLM_PROVIDER`, `LLM_MODEL`
- Provider-specific API key and base URL (e.g., `ZAI_API_KEY`, `ZAI_BASE_URL`)
- `SEARXNG_URL`, `CRAWL4AI_URL`, `PISTON_URL`

#### 1.2 Check Local Services

Verify that SearXNG, Crawl4AI, and Piston are reachable:

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:8080 --max-time 5
curl -s -o /dev/null -w "%{http_code}" http://localhost:11235 --max-time 5
curl -s -o /dev/null -w "%{http_code}" http://localhost:2000 --max-time 5
```

If any service is down, **STOP** and report which services are unreachable.

#### 1.3 Create Temp Directory

```bash
mkdir -p /tmp/meta-surfer-real-test
cd /tmp/meta-surfer-real-test
npm init -y --silent
```

Set `"type": "module"` in package.json for ESM support.

#### 1.4 Install from npm

```bash
npm install meta-surfer
```

Verify the installed version matches the latest published version.

#### 1.5 Create .env.local

Write a `.env.local` in the temp directory using the values extracted in Phase 1.1.
**Do NOT include `SEARXNG_PROXY_URL`** — proxy is configured at the Docker level, not the application level.

### Phase 2: CLI Test

Skip if `--lib-only` is set.

#### 2.1 Version Check

```bash
npx meta-surfer --version
```

Confirm:
- Version number is printed
- `.env.local` is loaded (dotenv injection message appears)

#### 2.2 Ask Command (AI + Web Search)

```bash
npx meta-surfer ask "<query>"
```

Validate the response includes:
- `[WebSearch]` log indicating web search was triggered
- Structured markdown output (headings, tables, lists)
- Source citations with URLs
- Substantive answer content (not just "search unavailable" fallback)

If the response falls back to LLM-only (no web search results), report it as a **warning** — the test still passes if the LLM responds, but search integration should be noted as degraded.

### Phase 3: Library Test

Skip if `--cli-only` is set.

#### 3.1 Create Test Script

Write a test file `test-lib.mjs` that:
1. Imports `configure` and `ask` from `"meta-surfer"`
2. Calls `configure()` with the provider settings from `.env.local`
3. Calls `ask({ query: "<query>" })`
4. Prints the response

#### 3.2 Run Test

```bash
node test-lib.mjs
```

Validate the same criteria as Phase 2.2.

### Phase 4: Cleanup & Report

#### 4.1 Cleanup

Unless `--keep` is set, delete the temp directory:

```bash
rm -rf /tmp/meta-surfer-real-test
```

#### 4.2 Final Report

Print a summary in this format:

```
meta-surfer@X.Y.Z Real-World Test Results
──────────────────────────────────────────
Query: "<query>"

CLI Test:
  ✅/❌ Version         X.Y.Z
  ✅/❌ .env.local      loaded / not loaded
  ✅/❌ Web Search      N sources scraped / timeout / fallback
  ✅/❌ LLM Response    structured answer with citations / error

Library Test:
  ✅/❌ configure()     success / error
  ✅/❌ ask()           structured answer with citations / error

Overall: PASS / FAIL
```

## Required Rules
- **NEVER hardcode API keys** in test scripts — always read from `.env.local`
- **NEVER leave temp directories** behind (unless `--keep`)
- **ALWAYS verify the installed version** matches the expected latest
- Report degraded search (LLM fallback) as a warning, not a failure
- If any phase fails, continue to the next phase and report all results at the end
