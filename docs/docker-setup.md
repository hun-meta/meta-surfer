# Docker Setup

Meta Surfer relies on three external services for search, scraping, and code execution. All three run via Docker Compose.

## Service Overview

| Service  | Image                              | Port  | Purpose                              |
|----------|------------------------------------|-------|--------------------------------------|
| SearXNG  | `searxng/searxng:latest`          | 8080  | Privacy-respecting meta search engine |
| Crawl4AI | `unclecode/crawl4ai:latest`       | 11235 | Web page scraping and content extraction |
| Piston   | `ghcr.io/engineer-man/piston:latest` | 2000 | Sandboxed multi-language code execution |
| Web UI   | Built from `Dockerfile`           | 3000  | Optional Next.js web interface        |

## Quick Start

Start all required services (search, scrape, code execution):

```bash
docker compose up -d
```

Start everything including the optional web UI:

```bash
docker compose --profile web up -d
```

Stop all services:

```bash
docker compose down
```

Stop and remove all data (volumes):

```bash
docker compose down -v
```

## Port Mapping

| Service  | Container Port | Host Port | URL                        |
|----------|---------------|-----------|----------------------------|
| SearXNG  | 8080          | 8080      | `http://localhost:8080`    |
| Crawl4AI | 11235         | 11235     | `http://localhost:11235`   |
| Piston   | 2000          | 2000      | `http://localhost:2000`    |
| Web UI   | 3000          | 3000      | `http://localhost:3000`    |

If you need to change ports (e.g., port 8080 is already in use), modify `docker-compose.yml` and update the corresponding environment variable:

```yaml
# docker-compose.yml
searxng:
  ports:
    - "9090:8080"  # changed host port to 9090
```

```bash
# .env.local
SEARXNG_URL=http://localhost:9090
```

## Individual Service Configuration

### SearXNG

SearXNG is a meta search engine that aggregates results from multiple search providers (Google, Bing, DuckDuckGo, etc.).

**Configuration files** (mounted as volumes):

| File                              | Purpose                        |
|-----------------------------------|--------------------------------|
| `docker/searxng/settings.yml`    | Search engine settings         |
| `docker/searxng/limiter.toml`    | Rate limiter configuration     |
| `docker/searxng/entrypoint.sh`   | Custom startup script          |

**Environment variables:**

| Variable             | Description           | Default                    |
|----------------------|-----------------------|----------------------------|
| `SEARXNG_BASE_URL`   | Public URL for SearXNG | `http://localhost:8080`   |

**Custom settings:**

Edit `docker/searxng/settings.yml` to:
- Enable or disable specific search engines
- Configure result language and region
- Adjust timeout settings
- Configure an outbound proxy

**Outbound proxy** (required for stable search performance):

Without a proxy, upstream search engines (Google, Bing, etc.) will rate-limit requests, causing frequent timeouts. A proxy is required for reliable operation.

```bash
# In .env.local
SEARXNG_PROXY_URL=http://user:pass@proxy-host:port
# Also supports: https://, socks5h://
```

**Rate limiter:**

The rate limiter is disabled by default for local use (configured in `docker/searxng/limiter.toml`). If deploying SearXNG publicly, re-enable it.

**Verify SearXNG:**

```bash
curl "http://localhost:8080/search?q=hello&format=json" | python3 -m json.tool | head -20
```

---

### Crawl4AI

Crawl4AI is a web scraping service that extracts clean markdown content from web pages.

**Environment variables:**

| Variable                | Description                 | Default |
|-------------------------|-----------------------------|---------|
| `CRAWL4AI_API_TOKEN`    | API authentication token    | `""`    |
| `MAX_CONCURRENT_TASKS`  | Max simultaneous scrape jobs | `5`    |

**API format note:**

The Crawl4AI `/crawl` endpoint expects URLs as an **array**, not a string:

```json
{
  "urls": ["https://example.com"],
  "priority": 10,
  "word_count_threshold": 50
}
```

Meta Surfer handles this automatically, but be aware if making direct API calls.

**Verify Crawl4AI:**

```bash
curl http://localhost:11235/health
```

```bash
curl -X POST http://localhost:11235/crawl \
  -H "Content-Type: application/json" \
  -d '{"urls": ["https://example.com"], "priority": 10}' | python3 -m json.tool | head -20
```

---

### Piston

Piston is a code execution sandbox that supports many programming languages. Each execution runs in an isolated environment with resource limits.

**Docker configuration notes:**

```yaml
piston:
  image: ghcr.io/engineer-man/piston:latest
  privileged: true                    # REQUIRED -- Piston needs this for container isolation
  ports:
    - "2000:2000"
  tmpfs:
    - /piston/jobs:exec,size=256m     # In-memory job storage
  volumes:
    - piston-packages:/piston/packages # Persistent language runtime storage
```

**Execution limits** (set by Meta Surfer in each request):

| Limit             | Value   |
|-------------------|---------|
| `run_timeout`     | 3000 ms |
| `compile_timeout` | 3000 ms |

These are the maximum values that Piston accepts. Longer-running code will be killed.

**Installing language runtimes:**

Piston ships with no runtimes by default. Install them via the API:

```bash
# Install Python
curl -X POST http://localhost:2000/api/v2/packages \
  -H "Content-Type: application/json" \
  -d '{"language": "python", "version": "3.10.0"}'

# Install Node.js (for JavaScript)
curl -X POST http://localhost:2000/api/v2/packages \
  -H "Content-Type: application/json" \
  -d '{"language": "node", "version": "18.15.0"}'

# Install TypeScript
curl -X POST http://localhost:2000/api/v2/packages \
  -H "Content-Type: application/json" \
  -d '{"language": "typescript", "version": "5.0.3"}'
```

Available runtimes used by Meta Surfer:

| Language    | Piston Name  | Version  |
|-------------|-------------|----------|
| Python      | `python`    | 3.10.0   |
| JavaScript  | `node`      | 18.15.0  |
| TypeScript  | `typescript`| 5.0.3    |
| Bash        | `bash`      | 5.2.0    |
| Ruby        | `ruby`      | 3.0.1    |
| Go          | `go`        | 1.16.2   |
| Java        | `java`      | 15.0.2   |
| C           | `c`         | 10.2.0   |
| C++         | `cpp`       | 10.2.0   |
| Rust        | `rust`      | 1.68.2   |

**List installed runtimes:**

```bash
curl http://localhost:2000/api/v2/runtimes | python3 -m json.tool
```

**Verify Piston:**

```bash
curl -X POST http://localhost:2000/api/v2/execute \
  -H "Content-Type: application/json" \
  -d '{
    "language": "python",
    "version": "3.10.0",
    "files": [{"name": "main.py", "content": "print(\"hello\")"}]
  }'
```

Expected output:
```json
{"run":{"stdout":"hello\n","stderr":"","code":0,"signal":null,"output":"hello\n"},...}
```

---

### Web UI (Optional)

The web UI is included in Docker Compose under the `web` profile. It is not started by default.

```bash
# Start with web UI
docker compose --profile web up -d

# Start without web UI (default)
docker compose up -d
```

The web service builds the Next.js application from the project `Dockerfile` and connects to other services using Docker internal DNS (e.g., `http://searxng:8080` instead of `http://localhost:8080`).

See [web-ui-guide.md](./web-ui-guide.md) for detailed web UI documentation.

## Troubleshooting

### Piston: "permission denied" or container won't start

Piston requires `privileged: true` in the Docker Compose configuration. This is already set in the provided `docker-compose.yml`. If you see permission errors, verify:

```yaml
piston:
  privileged: true
```

On some systems (e.g., rootless Docker), privileged mode may not be available. In that case, Piston cannot run.

### Piston: "runtime not found" or empty output

Piston ships without any language runtimes installed. You must install them after starting the container. See the "Installing language runtimes" section above.

Note: The JavaScript runtime in Piston is named `node`, not `javascript`. Meta Surfer maps `javascript` and `js` to `node` automatically.

### Piston: "execution timed out"

The maximum execution timeout is 3000 ms (3 seconds) for both compilation and execution. If your code takes longer, it will be killed. This is a hard limit enforced by Piston.

### SearXNG: no results or empty responses

- Check that SearXNG is running: `curl http://localhost:8080/`
- Upstream search engines are likely rate-limiting your requests. Ensure `SEARXNG_PROXY_URL` is set in `.env.local`:
  ```bash
  SEARXNG_PROXY_URL=socks5h://user:pass@proxy:port
  ```
  A proxy is required for stable search performance. Without it, most queries will timeout.
- Check `docker/searxng/settings.yml` to ensure at least some search engines are enabled.

### SearXNG: rate limit errors

The rate limiter is disabled for local development. If you see 429 errors, it may be from upstream search engines, not SearXNG itself. Ensure `SEARXNG_PROXY_URL` is properly configured in `.env.local`.

### Crawl4AI: scraping failures

- Some websites block automated requests. The built-in fallback scraper (`enhancedFetch`) will attempt to fetch the page directly if Crawl4AI fails.
- Check Crawl4AI logs: `docker compose logs crawl4ai`
- The `/crawl` endpoint expects `urls` as an **array**: `{"urls": ["https://..."]}`, not a string.

### General: services not reachable

```bash
# Check which containers are running
docker compose ps

# View logs for a specific service
docker compose logs searxng
docker compose logs crawl4ai
docker compose logs piston

# Restart a specific service
docker compose restart searxng
```

### General: port conflicts

If a port is already in use on your host, change the host port mapping in `docker-compose.yml`:

```yaml
searxng:
  ports:
    - "9090:8080"   # map host port 9090 to container port 8080
```

Then update `.env.local`:

```bash
SEARXNG_URL=http://localhost:9090
```

## Resource Requirements

Approximate resource usage for the Docker services:

| Service  | Memory (idle) | Memory (active) | Disk         |
|----------|--------------|-----------------|--------------|
| SearXNG  | ~100 MB      | ~200 MB         | ~200 MB      |
| Crawl4AI | ~200 MB      | ~500 MB         | ~1 GB (with browser) |
| Piston   | ~50 MB       | ~200 MB         | Varies by runtimes |

Total: approximately 1-2 GB RAM with all services running.
