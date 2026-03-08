import type { SearchResult, SearchQueryResult, MultiSearchResponse } from "@/lib/types";

function detectLanguage(query: string): string {
  // Korean characters (Hangul)
  if (/[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/.test(query)) return "ko";
  // Japanese (Hiragana, Katakana, CJK)
  if (/[\u3040-\u309F\u30A0-\u30FF]/.test(query)) return "ja";
  // Chinese (CJK Unified Ideographs without Japanese kana)
  if (/[\u4E00-\u9FFF]/.test(query)) return "zh";
  return "en";
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
  const baseUrl = process.env.SEARXNG_URL || "http://localhost:8080";
  const url = new URL(`${baseUrl}/search`);
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("categories", "general");
  // Auto-detect language from query content for better results
  url.searchParams.set("language", detectLanguage(query));

  const response = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw new Error(`SearXNG responded with ${response.status}`);
  }

  const data = await response.json();
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
    .filter((r: SearchResult) => r.url && !isIrrelevantUrl(r.url));
}

// Filter out generic homepages and irrelevant results that SearXNG returns
function isIrrelevantUrl(url: string): boolean {
  try {
    const u = new URL(url);
    const hostname = u.hostname.replace("www.", "");
    const path = u.pathname.replace(/\/$/, "");

    // Always skip these domains entirely (never relevant for search)
    const alwaysSkip = [
      "google.com", "google.co.jp", "google.co.in", "google.co.uk",
      "google.co.kr", "google.de", "google.fr",
      "gmail.com", "mail.google.com",
      "maps.google.com", "accounts.google.com", "search.google",
      "facebook.com", "twitter.com", "x.com", "instagram.com",
      "login.", "signin.", "signup.",
      // Dictionary / definition sites (SearXNG returns these for individual words)
      "merriam-webster.com", "dictionary.com", "dictionary.cambridge.org",
      "thefreedictionary.com", "wordreference.com", "wiktionary.org",
      "collinsdictionary.com", "oed.com", "definitions.net",
      "yourdictionary.com", "wordnik.com", "thesaurus.com",
      "oxfordlearnersdictionaries.com", "urbandictionary.com",
      "vark-learn.com", "helpfulprofessor.com", "prodigygame.com",
      // Calendar / time sites
      "whatweekisit.org", "calendar-12.com", "timeanddate.com",
      // Language / grammar Q&A (SearXNG returns these for common words)
      "ell.stackexchange.com", "english.stackexchange.com",
      "forum.manjaro.org",
    ];
    if (alwaysSkip.some((d) => hostname === d || hostname.endsWith("." + d) || hostname.startsWith(d))) {
      return true;
    }

    // Skip bare homepages of news/generic sites (no specific article path)
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

    // Skip app store / download pages
    if (hostname === "apps.apple.com" || hostname === "play.google.com" || hostname === "apps.microsoft.com") {
      return true;
    }

    // Skip download pages from tech sites
    if (path.startsWith("/download")) {
      return true;
    }

    // Skip HTTP-only URLs (legitimate sites use HTTPS; HTTP-only are often SEO spam)
    if (u.protocol === "http:") {
      return true;
    }

    // Skip calendar / holiday / time calculation sites
    const calendarSpam = [
      "calendar-365.com", "calendar-yearly.com", "calculatorian.com",
      "time.is", "superkts.com", "kalender-365.de",
      "epochconverter.com", "datecalculator.net",
    ];
    if (calendarSpam.some((d) => hostname === d || hostname.endsWith("." + d))) {
      return true;
    }

    // Skip known TLDs used by SEO spam farms (gibberish domains)
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

// Cross-query deduplication for combined results
export function deduplicateAcrossQueries(
  searches: SearchQueryResult[]
): SearchResult[] {
  const allResults = searches.flatMap((s) => s.results);
  return deduplicateResults(allResults);
}
