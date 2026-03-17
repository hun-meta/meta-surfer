import type { SearchResult, SearchQueryResult, MultiSearchResponse } from "../core/types.js";
import { getConfig } from "../core/provider.js";

function detectLanguage(query: string): string {
  if (/[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/.test(query)) return "ko";
  if (/[\u3040-\u309F\u30A0-\u30FF]/.test(query)) return "ja";
  if (/[\u4E00-\u9FFF]/.test(query)) return "zh";
  return "en";
}

/**
 * Filter results whose title language doesn't match the query language.
 * English titles are always accepted (universal tech language).
 */
function hasLanguageMismatch(queryLang: string, title: string): boolean {
  const titleLang = detectLanguage(title);
  // English results are universally acceptable
  if (titleLang === "en") return false;
  // Same language — keep
  if (titleLang === queryLang) return false;
  // Different CJK language — mismatch (e.g., Chinese result for Korean query)
  return true;
}

/**
 * Lightweight content relevance check.
 * Tokenises the query, ignores pure numbers (year-only matches),
 * and requires at least one meaningful keyword hit in the title+content.
 *
 * Only applied when the query language differs from the result language
 * (e.g., English result for Korean query) to avoid false-filtering
 * same-language results with poor snippets.
 */
function hasMinimalRelevance(
  query: string,
  queryLang: string,
  result: SearchResult
): boolean {
  const resultLang = detectLanguage(result.title);

  // Same language → trust SearXNG ranking, don't second-guess
  if (resultLang === queryLang) return true;

  // Tokenise query: keep words ≥ 2 chars, drop pure digits (years etc.)
  const queryWords = query
    .toLowerCase()
    .split(/[\s,;:!?·()\[\]"'""'']/u)
    .map((w) => w.replace(/[년월일]$/u, "")) // strip Korean date suffixes
    .filter((w) => w.length >= 2 && !/^\d+$/.test(w));

  if (queryWords.length === 0) return true;

  const text = `${result.title} ${result.content}`.toLowerCase();
  return queryWords.some((w) => text.includes(w));
}

const extractDomain = (url: string): string => {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
};

function deduplicateResults(items: SearchResult[]): SearchResult[] {
  const seenDomains = new Set<string>();
  const seenUrls = new Set<string>();

  return items.filter((item) => {
    const domain = extractDomain(item.url);
    const isNewUrl = !seenUrls.has(item.url);
    const isNewDomain = !seenDomains.has(domain);

    if (isNewUrl && isNewDomain) {
      seenUrls.add(item.url);
      seenDomains.add(domain);
      return true;
    }
    return false;
  });
}

async function searchSearXNG(query: string): Promise<SearchResult[]> {
  const config = getConfig();
  const baseUrl = config.searxngURL || process.env.SEARXNG_URL || "http://localhost:8080";
  const url = new URL(`${baseUrl}/search`);
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("categories", "general");
  const queryLang = detectLanguage(query);
  url.searchParams.set("language", queryLang);

  const data = await fetchSearXNGWithRetry(url.toString());

  return (data.results || [])
    .slice(0, 15)
    .map(
      (r: { title: string; url: string; content: string }) =>
        ({
          title: (r.title || "").replace(/\[.*?\]/g, "").replace(/\(.*?\)/g, "").trim(),
          url: r.url || "",
          content: r.content || "",
          favicon: `https://www.google.com/s2/favicons?domain=${extractDomain(r.url)}&sz=32`,
        }) satisfies SearchResult
    )
    .filter((r: SearchResult) => {
      if (!r.url) return false;
      if (isIrrelevantUrl(r.url)) return false;
      if (hasLanguageMismatch(queryLang, r.title)) return false;
      // Filter results with no title and no content
      if (!r.title.trim() && !r.content.trim()) return false;
      // Cross-language relevance: filter English results with zero query keyword overlap
      if (!hasMinimalRelevance(query, queryLang, r)) return false;
      return true;
    });
}

/**
 * Fetch SearXNG with 1 automatic retry on failure (timeout, network error).
 */
async function fetchSearXNGWithRetry(
  url: string,
  retries = 1
): Promise<{ results?: { title: string; url: string; content: string }[] }> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) {
        throw new Error(`SearXNG responded with ${response.status}`);
      }
      return await response.json() as { results?: { title: string; url: string; content: string }[] };
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 1500 * (attempt + 1)));
      }
    }
  }
  throw lastError;
}

function isIrrelevantUrl(url: string): boolean {
  try {
    const u = new URL(url);
    const hostname = u.hostname.replace("www.", "");
    const path = u.pathname.replace(/\/$/, "");

    const alwaysSkip = [
      "google.com", "google.co.jp", "google.co.in", "google.co.uk",
      "google.co.kr", "google.de", "google.fr",
      "gmail.com", "mail.google.com",
      "maps.google.com", "accounts.google.com", "search.google",
      "facebook.com", "twitter.com", "x.com", "instagram.com",
      "login.", "signin.", "signup.",
      "merriam-webster.com", "dictionary.com", "dictionary.cambridge.org",
      "thefreedictionary.com", "wordreference.com", "wiktionary.org",
      "collinsdictionary.com", "oed.com", "definitions.net",
      "yourdictionary.com", "wordnik.com", "thesaurus.com",
      "oxfordlearnersdictionaries.com", "urbandictionary.com",
      "vark-learn.com", "helpfulprofessor.com", "prodigygame.com",
      "whatweekisit.org", "calendar-12.com", "timeanddate.com",
      "ell.stackexchange.com", "english.stackexchange.com",
      "forum.manjaro.org",
    ];
    if (alwaysSkip.some((d) => hostname === d || hostname.endsWith("." + d) || hostname.startsWith(d))) {
      return true;
    }

    const homepageSkip = [
      "cnn.com", "foxnews.com", "nbcnews.com", "abcnews.com",
      "cbsnews.com", "nytimes.com", "apnews.com", "bbc.com",
      "news.yahoo.com", "news.google.com", "chatgpt.com",
      "claude.ai", "gemini.com", "deepseek.com",
      "investing.com", "marketwatch.com",
      "about.google", "blog.google", "naver.com",
      "google.co.in", "google.co.kr",
    ];
    if (path === "" || path === "/index.html" || path === "/news") {
      if (homepageSkip.some((d) => hostname === d || hostname.endsWith("." + d))) {
        return true;
      }
    }

    if (hostname === "apps.apple.com" || hostname === "play.google.com" || hostname === "apps.microsoft.com") {
      return true;
    }

    if (path.startsWith("/download")) {
      return true;
    }

    if (u.protocol === "http:") {
      return true;
    }

    // Generic profile/listing/directory pages (e.g., profile.php?id=1)
    if (/\/profile\.php/i.test(path) && u.search.includes("id=")) {
      return true;
    }
    if (/\/detail\.php/i.test(path) && u.search.includes("id=")) {
      return true;
    }

    const calendarSpam = [
      "calendar-365.com", "calendar-yearly.com", "calculatorian.com",
      "time.is", "superkts.com", "kalender-365.de",
      "epochconverter.com", "datecalculator.net",
    ];
    if (calendarSpam.some((d) => hostname === d || hostname.endsWith("." + d))) {
      return true;
    }

    const spamTlds = [".gp", ".jm", ".ye", ".tk", ".ml", ".ga", ".cf"];
    if (spamTlds.some((tld) => hostname.endsWith(tld))) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

export async function searchMultiQuery(
  queries: string[]
): Promise<MultiSearchResponse> {
  const searchPromises = queries.map(async (query): Promise<SearchQueryResult> => {
    try {
      const results = await searchSearXNG(query);
      return { query, results: deduplicateResults(results) };
    } catch (error) {
      console.error(`Search error for "${query}":`, error);
      return { query, results: [] };
    }
  });

  const searches = await Promise.all(searchPromises);
  const totalResults = searches.reduce((sum, s) => sum + s.results.length, 0);

  return { searches, totalResults };
}

export function deduplicateAcrossQueries(
  searches: SearchQueryResult[]
): SearchResult[] {
  const allResults = searches.flatMap((s) => s.results);
  return deduplicateResults(allResults);
}
