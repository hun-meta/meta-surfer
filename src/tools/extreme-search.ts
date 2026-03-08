import { generateObject } from "ai";
import { z } from "zod";
import { getModel } from "../core/provider";
import { searchMultiQuery } from "./web-search";
import { scrapeUrls } from "./web-scrape";
import { executeCode } from "./code-execute";
import type { SearchResult, ResearchResult, CodeResult } from "../core/types";

export async function extremeSearch(prompt: string): Promise<ResearchResult> {
  const codeResults: CodeResult[] = [];

  const { object: planResult } = await generateObject({
    model: getModel(),
    schema: z.object({
      plan: z
        .array(
          z.object({
            title: z.string().describe("Research aspect title"),
            queries: z
              .array(z.string())
              .min(2)
              .max(3)
              .describe("Specific search queries for this aspect"),
          })
        )
        .min(2)
        .max(3),
      urlsToRead: z
        .array(z.string().url())
        .max(3)
        .optional()
        .describe("Specific URLs to read if the user mentioned any"),
      codeTask: z
        .string()
        .optional()
        .describe(
          "Python code to run for data analysis, only if calculations are needed"
        ),
    }),
    prompt: `Plan focused research for: ${prompt}

Today's Date: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "2-digit" })}

Guidelines:
- Break into 2-3 key research aspects
- Generate 2-3 specific search queries per aspect (5-15 words each)
- Include temporal context when relevant ("2025", "latest", "current")
- Total queries should be 4-9
- Only include codeTask if data analysis or calculations are truly needed
- Only include urlsToRead if the user specified specific URLs`,
  });

  const plan = planResult.plan;
  console.log("[ExtremeSearch] Plan:", JSON.stringify(plan, null, 2));

  const allQueries = plan.flatMap((p) => p.queries);
  const searchPromise = searchMultiQuery(allQueries);

  const scrapePromise =
    planResult.urlsToRead && planResult.urlsToRead.length > 0
      ? scrapeUrls(planResult.urlsToRead)
      : Promise.resolve([]);

  const codePromise = planResult.codeTask
    ? executeCode("python", planResult.codeTask).then((result) => {
        codeResults.push({
          title: "Data Analysis",
          code: planResult.codeTask!,
          stdout: result.stdout,
          stderr: result.stderr,
          success: result.exitCode === 0,
        });
      })
    : Promise.resolve();

  const [searchResponse, userScrapeResults] = await Promise.all([
    searchPromise,
    scrapePromise,
    codePromise,
  ]);

  const allSources: SearchResult[] = [];
  for (const search of searchResponse.searches) {
    allSources.push(...search.results);
  }

  for (const result of userScrapeResults) {
    if (result.success) {
      allSources.push({
        title: result.title,
        url: result.url,
        content: result.markdown.slice(0, 1500),
      });
    }
  }

  const seenUrlsForScrape = new Set(
    (planResult.urlsToRead || []).map((u) => u)
  );
  const urlsToAutoScrape = allSources
    .filter((s) => s.url && !seenUrlsForScrape.has(s.url) && s.content.length < 500)
    .slice(0, 10)
    .map((s) => s.url);

  if (urlsToAutoScrape.length > 0) {
    console.log(`[ExtremeSearch] Auto-scraping ${urlsToAutoScrape.length} top results`);
    const autoScrapeResults = await scrapeUrls(urlsToAutoScrape);
    for (const result of autoScrapeResults) {
      if (result.success) {
        const existing = allSources.find((s) => s.url === result.url);
        if (existing) {
          existing.content = result.markdown.slice(0, 2000);
        }
      }
    }
  }

  const seenUrls = new Set<string>();
  const uniqueSources = allSources.filter((s) => {
    if (seenUrls.has(s.url)) return false;
    seenUrls.add(s.url);
    return true;
  });

  console.log(
    `[ExtremeSearch] Complete: ${uniqueSources.length} sources, ${codeResults.length} code results`
  );

  return {
    plan,
    sources: uniqueSources.map((s) => ({
      ...s,
      content: s.content.slice(0, 3000),
    })),
    codeResults,
  };
}
