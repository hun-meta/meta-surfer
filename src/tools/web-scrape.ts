import type { ScrapeResult } from "../core/types";
import { getConfig } from "../core/provider";

export async function scrapeUrls(urls: string[]): Promise<ScrapeResult[]> {
  const results = await Promise.allSettled(urls.map((url) => scrapeSingle(url)));

  return results.map((result, i) =>
    result.status === "fulfilled"
      ? result.value
      : { url: urls[i], markdown: "", title: "", success: false }
  );
}

async function scrapeSingle(url: string): Promise<ScrapeResult> {
  try {
    const result = await crawl4AI(url);
    if (result.success && result.markdown.length > 200) return result;
  } catch (e) {
    console.error(`Crawl4AI failed for ${url}:`, e);
  }

  try {
    const result = await enhancedFetch(url);
    if (result.success) return result;
  } catch (e) {
    console.error(`Enhanced fetch failed for ${url}:`, e);
  }

  return { url, markdown: "", title: "", success: false };
}

async function crawl4AI(url: string): Promise<ScrapeResult> {
  const config = getConfig();
  const baseUrl = config.crawl4aiURL || process.env.CRAWL4AI_URL || "http://localhost:11235";

  const response = await fetch(`${baseUrl}/crawl`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      urls: [url],
      priority: 10,
      word_count_threshold: 50,
    }),
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw new Error(`Crawl4AI responded with ${response.status}`);
  }

  const data = await response.json() as { results?: { url?: string; markdown?: string; cleaned_html?: string; text?: string; metadata?: { title?: string } }[] };
  const result = data.results?.[0];
  if (!result) return { url, markdown: "", title: "", success: false };

  const markdown = result.markdown || result.cleaned_html || result.text || "";
  const truncated =
    markdown.length > 10000
      ? markdown.slice(0, 10000) + "\n\n[...truncated]"
      : markdown;

  return {
    url: result.url || url,
    markdown: truncated,
    title: result.metadata?.title || "",
    success: !!markdown,
  };
}

async function enhancedFetch(url: string): Promise<ScrapeResult> {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; WebSurfer/1.0; +http://localhost)",
      Accept: "text/html,application/xhtml+xml",
    },
    signal: AbortSignal.timeout(8000),
    redirect: "follow",
  });

  if (!response.ok) {
    return { url, markdown: "", title: "", success: false };
  }

  const html = await response.text();

  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : "";

  let contentHtml = html;
  const articleMatch = html.match(
    /<(?:article|main)[^>]*>([\s\S]*?)<\/(?:article|main)>/i
  );
  if (articleMatch) {
    contentHtml = articleMatch[1];
  }

  const text = contentHtml
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
    .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, "")
    .replace(/<form[^>]*>[\s\S]*?<\/form>/gi, "")
    .replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, "\n## $1\n")
    .replace(/<p[^>]*>(.*?)<\/p>/gi, "\n$1\n")
    .replace(/<li[^>]*>(.*?)<\/li>/gi, "- $1\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();

  const truncated =
    text.length > 10000
      ? text.slice(0, 10000) + "\n\n[...truncated]"
      : text;

  return { url, markdown: truncated, title, success: text.length > 200 };
}
