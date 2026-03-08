import { config as loadEnv } from "dotenv";
import { Command } from "commander";
import { configure } from "./core/provider";
import { searchMultiQuery } from "./tools/web-search";
import { scrapeUrls } from "./tools/web-scrape";
import { executeCode } from "./tools/code-execute";
import { extremeSearch } from "./tools/extreme-search";
import { ask } from "./engine";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import type { SearchMode, LLMProvider } from "./core/types";

// Auto-load .env.local (Next.js convention) and .env from the user's working directory
const projectRoot = process.cwd();
for (const envFile of [".env.local", ".env"]) {
  const envPath = resolve(projectRoot, envFile);
  if (existsSync(envPath)) {
    loadEnv({ path: envPath });
  }
}

function loadConfig(opts: { provider?: string; baseUrl?: string; apiKey?: string; model?: string; searxng?: string; crawl4ai?: string; piston?: string }) {
  configure({
    provider: opts.provider as LLMProvider | undefined,
    baseURL: opts.baseUrl,
    apiKey: opts.apiKey,
    model: opts.model,
    searxngURL: opts.searxng,
    crawl4aiURL: opts.crawl4ai,
    pistonURL: opts.piston,
  });
}

const program = new Command();

const pkg = JSON.parse(readFileSync(resolve(import.meta.dirname, "../package.json"), "utf-8"));

program
  .name("meta-surfer")
  .description("AI-powered web search engine — CLI & library")
  .version(pkg.version)
  .option("--provider <name>", "LLM provider: openai, google, anthropic, xai, zai (default: auto-detect)")
  .option("--base-url <url>", "LLM API base URL")
  .option("--api-key <key>", "LLM API key")
  .option("--model <id>", "Model ID")
  .option("--searxng <url>", "SearXNG service URL")
  .option("--crawl4ai <url>", "Crawl4AI service URL")
  .option("--piston <url>", "Piston service URL");

// --- ask: Main AI search command ---
program
  .command("ask")
  .description("Ask a question with AI-powered web search")
  .argument("<query...>", "Your question")
  .option("-m, --mode <mode>", "Search mode: web or extreme", "web")
  .option("--stream", "Stream the response", false)
  .action(async (queryParts: string[], opts: { mode: string; stream: boolean }) => {
    loadConfig(program.opts());
    const query = queryParts.join(" ");
    const mode = opts.mode as SearchMode;

    if (opts.stream) {
      const { chat } = await import("./engine");
      const result = chat({
        messages: [{ role: "user", content: query }],
        mode,
      });

      for await (const chunk of result.textStream) {
        process.stdout.write(chunk);
      }
      process.stdout.write("\n");
    } else {
      const answer = await ask({ query, mode });
      console.log(answer);
    }
  });

// --- search: Raw web search ---
program
  .command("search")
  .description("Search the web via SearXNG (raw results, no AI)")
  .argument("<query...>", "Search query")
  .option("-n, --num <count>", "Max results per query", "10")
  .option("--json", "Output as JSON", false)
  .action(async (queryParts: string[], opts: { num: string; json: boolean }) => {
    loadConfig(program.opts());
    const query = queryParts.join(" ");
    const response = await searchMultiQuery([query]);

    if (opts.json) {
      console.log(JSON.stringify(response, null, 2));
      return;
    }

    const results = response.searches[0]?.results || [];
    const limit = parseInt(opts.num, 10);
    for (const r of results.slice(0, limit)) {
      console.log(`\n${r.title}`);
      console.log(`  ${r.url}`);
      if (r.content) console.log(`  ${r.content.slice(0, 200)}`);
    }
    console.log(`\n${results.length} results found.`);
  });

// --- scrape: Web page scraping ---
program
  .command("scrape")
  .description("Scrape web page content via Crawl4AI")
  .argument("<urls...>", "URLs to scrape")
  .option("--json", "Output as JSON", false)
  .action(async (urls: string[], opts: { json: boolean }) => {
    loadConfig(program.opts());
    const results = await scrapeUrls(urls);

    if (opts.json) {
      console.log(JSON.stringify(results, null, 2));
      return;
    }

    for (const r of results) {
      console.log(`\n--- ${r.title || r.url} ---`);
      console.log(`URL: ${r.url}`);
      console.log(`Success: ${r.success}`);
      if (r.markdown) {
        console.log(r.markdown.slice(0, 2000));
        if (r.markdown.length > 2000) console.log("\n[...truncated]");
      }
    }
  });

// --- execute: Code execution ---
program
  .command("execute")
  .description("Execute code in a sandboxed environment via Piston")
  .argument("<language>", "Programming language")
  .option("-c, --code <code>", "Code to execute (inline)")
  .option("-f, --file <path>", "File to execute")
  .option("--json", "Output as JSON", false)
  .action(async (language: string, opts: { code?: string; file?: string; json: boolean }) => {
    loadConfig(program.opts());

    let code = opts.code;
    if (opts.file) {
      code = readFileSync(resolve(opts.file), "utf-8");
    }
    if (!code) {
      console.error("Error: provide code via --code or --file");
      process.exit(1);
    }

    const result = await executeCode(language, code);

    if (opts.json) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }

    if (result.stdout) console.log(result.stdout);
    if (result.stderr) console.error(result.stderr);
    process.exit(result.exitCode === 0 ? 0 : 1);
  });

// --- research: Deep autonomous research ---
program
  .command("research")
  .description("Deep autonomous research on a topic (multi-step search + scrape + analysis)")
  .argument("<query...>", "Research question")
  .option("--json", "Output as JSON", false)
  .option("--ai", "Synthesize results with AI into a final answer", false)
  .action(async (queryParts: string[], opts: { json: boolean; ai: boolean }) => {
    loadConfig(program.opts());
    const query = queryParts.join(" ");

    if (opts.ai) {
      const answer = await ask({ query, mode: "extreme" });
      console.log(answer);
      return;
    }

    const result = await extremeSearch(query);

    if (opts.json) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }

    console.log("\n=== Research Plan ===");
    for (const p of result.plan) {
      console.log(`\n## ${p.title}`);
      for (const q of p.queries) {
        console.log(`  - ${q}`);
      }
    }

    console.log(`\n=== Sources (${result.sources.length}) ===`);
    for (const s of result.sources.slice(0, 20)) {
      console.log(`\n${s.title}`);
      console.log(`  ${s.url}`);
      if (s.content) console.log(`  ${s.content.slice(0, 200)}`);
    }

    if (result.codeResults.length > 0) {
      console.log("\n=== Code Results ===");
      for (const c of result.codeResults) {
        console.log(`\n## ${c.title}`);
        if (c.stdout) console.log(c.stdout);
        if (c.stderr) console.error(c.stderr);
      }
    }
  });

// --- serve: Start web UI (optional) ---
program
  .command("serve")
  .description("Start the web UI (Next.js) — optional web interface")
  .option("-p, --port <port>", "Port number", "3000")
  .option("--dev", "Run in development mode", false)
  .action(async (opts: { port: string; dev: boolean }) => {
    loadConfig(program.opts());
    const { execSync } = await import("child_process");
    const projectRoot = resolve(import.meta.dirname, "..");

    process.env.PORT = opts.port;

    if (opts.dev) {
      console.log(`Starting Meta Surfer dev server on port ${opts.port}...`);
      execSync(`npx next dev -p ${opts.port}`, {
        cwd: projectRoot,
        stdio: "inherit",
        env: { ...process.env },
      });
    } else {
      console.log(`Starting Meta Surfer on port ${opts.port}...`);
      console.log("Building Next.js app...");
      execSync("npx next build", {
        cwd: projectRoot,
        stdio: "inherit",
        env: { ...process.env },
      });
      execSync(`npx next start -p ${opts.port}`, {
        cwd: projectRoot,
        stdio: "inherit",
        env: { ...process.env },
      });
    }
  });

program.parse();
