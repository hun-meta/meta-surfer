import {
  streamText,
  tool,
  generateObject,
  generateText,
  NoSuchToolError,
  type CoreMessage,
} from "ai";
import { z } from "zod";
import { getModel, isOpenAICompatible } from "./core/provider";
import { markdownJoinerTransform } from "./core/parser";
import { searchMultiQuery, deduplicateAcrossQueries } from "./tools/web-search";
import { scrapeUrls } from "./tools/web-scrape";
import { executeCode } from "./tools/code-execute";
import { extremeSearch } from "./tools/extreme-search";
import type { SearchMode } from "./core/types";

function getSystemPrompt(mode: SearchMode): string {
  const dateStr = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });

  const base = `You are Meta Surfer, an AI search assistant that provides accurate, well-sourced answers.

Today's date is ${dateStr}.

When answering questions:
1. Use the webSearch tool to find relevant information — provide 3-5 diverse search queries for best coverage
2. After searching, ALWAYS use the readWebPages tool to read the full content of the 2-3 most relevant URLs. Search snippets alone are rarely sufficient for a comprehensive answer
3. Use the executeCode tool when calculations, data analysis, or code execution is needed
4. Always cite your sources using inline markdown links like [Source Title](url) within the text
5. Provide comprehensive but concise answers
6. Format your response with clear markdown: headings, lists, code blocks as appropriate

Important rules:
- Search before answering factual questions that need up-to-date information
- You MUST base your answer on search results when they are available. Focus on the relevant results and ignore any irrelevant ones
- Only if the search tool fails with an error or returns zero results should you answer from your own knowledge, and clearly state that search was unavailable
- NEVER discard valid search results to answer from your own knowledge — always use the search data you received
- After webSearch, you MUST call readWebPages on the top 2-3 most relevant URLs to get detailed content before writing your answer
- Use inline markdown link citations like [Source Title](url) directly in your text, NOT numbered references
- Answer in the same language as the user's question
- For simple questions (math, greetings, definitions), answer directly without searching`;

  if (mode === "extreme") {
    return (
      base +
      `\n\nYou are in DEEP RESEARCH mode. You MUST use the extremeSearch tool as your PRIMARY research method.

CRITICAL WORKFLOW:
1. Call extremeSearch ONCE with the user's question — it automatically plans research, runs multiple searches, reads pages, and runs code
2. After extremeSearch returns, IMMEDIATELY write your comprehensive answer using the sources it gathered
3. Do NOT call webSearch or readWebPages after extremeSearch — it already gathered all the information you need
4. Only use webSearch for simple follow-up questions in the same conversation

The extremeSearch tool does all the heavy lifting. Your job is to synthesize its results into a well-structured, cited answer.`
    );
  }

  return base;
}

function createTools() {
  return {
    webSearch: tool({
      description:
        "Search the web with multiple queries in parallel for comprehensive results. Provide 3-5 diverse queries to maximize coverage.",
      parameters: z.object({
        queries: z
          .array(z.string())
          .min(1)
          .max(5)
          .describe("Search queries to execute in parallel (3-5 diverse queries recommended)"),
      }),
      execute: async ({ queries }) => {
        const response = await searchMultiQuery(queries);
        const deduplicated = deduplicateAcrossQueries(response.searches);
        const topResults = deduplicated.slice(0, 20);

        const urlsToScrape = topResults
          .filter((r) => r.url && r.content.length < 500)
          .slice(0, 8)
          .map((r) => r.url);

        if (urlsToScrape.length > 0) {
          console.log(`[WebSearch] Auto-scraping ${urlsToScrape.length} top results`);
          const scraped = await scrapeUrls(urlsToScrape);
          for (const page of scraped) {
            if (page.success) {
              const existing = topResults.find((r) => r.url === page.url);
              if (existing) {
                existing.content = page.markdown.slice(0, 1500);
              }
            }
          }
        }

        return {
          queries,
          totalResults: response.totalResults,
          searches: response.searches.map((s) => ({
            query: s.query,
            resultCount: s.results.length,
          })),
          results: topResults.map((r) => ({
            title: r.title,
            url: r.url,
            content: r.content,
            favicon: r.favicon,
          })),
        };
      },
    }),

    readWebPages: tool({
      description:
        "Read the full content of web pages. Use this after webSearch to get detailed information from the most relevant URLs. Pass up to 3 URLs at once.",
      parameters: z.object({
        urls: z
          .array(z.string().url())
          .min(1)
          .max(3)
          .describe("URLs to read (max 3)"),
      }),
      execute: async ({ urls }) => {
        console.log(`[ReadWebPages] Reading ${urls.length} pages:`, urls.map(u => new URL(u).hostname).join(", "));
        const results = await scrapeUrls(urls);
        return {
          pages: results.map((r) => ({
            url: r.url,
            title: r.title,
            content: r.markdown,
            success: r.success,
          })),
        };
      },
    }),

    executeCode: tool({
      description:
        "Execute code in a sandboxed environment. Supports Python, JavaScript, TypeScript, and other languages. Use for calculations, data analysis, or demonstrating code.",
      parameters: z.object({
        language: z
          .string()
          .describe(
            "Programming language (python, javascript, typescript, etc.)"
          ),
        code: z.string().describe("The code to execute"),
      }),
      execute: async ({ language, code }) => {
        const result = await executeCode(language, code);
        return {
          language: result.language,
          stdout: result.stdout,
          stderr: result.stderr,
          exitCode: result.exitCode,
          success: result.exitCode === 0,
        };
      },
    }),

    extremeSearch: tool({
      description:
        "Perform deep, multi-step autonomous research on a complex topic. Creates a research plan, executes multiple searches, reads key pages, and optionally runs code for analysis. Use for comprehensive research questions.",
      parameters: z.object({
        prompt: z
          .string()
          .describe("The research question or topic to investigate deeply"),
      }),
      execute: async ({ prompt }) => {
        const result = await extremeSearch(prompt);
        return {
          instruction: "Research is complete. DO NOT call any more tools. Write your comprehensive answer NOW using the sources below.",
          plan: result.plan,
          sourcesCount: result.sources.length,
          sources: result.sources.slice(0, 20).map((s) => ({
            title: s.title,
            url: s.url,
            content: s.content.slice(0, 1500),
            favicon: s.favicon,
          })),
          codeResults: result.codeResults,
        };
      },
    }),
  };
}

function getActiveTools(mode: SearchMode) {
  if (mode === "extreme") {
    return ["extremeSearch"] as const;
  }
  return ["webSearch", "readWebPages", "executeCode"] as const;
}

function getEngineConfig(mode: SearchMode) {
  return {
    model: getModel(),
    system: getSystemPrompt(mode),
    tools: createTools(),
    experimental_activeTools: [...getActiveTools(mode)],
    maxSteps: mode === "extreme" ? 3 : 5,
    ...(isOpenAICompatible()
      ? { providerOptions: { openaiCompatible: { parallelToolCalls: false } } }
      : {}),
  };
}

async function repairToolCall({
  toolCall,
  tools,
  parameterSchema,
  error,
}: {
  toolCall: { toolCallType: "function"; toolCallId: string; toolName: string; args: string };
  tools: Record<string, unknown>;
  parameterSchema: (opts: { toolName: string }) => unknown;
  error: unknown;
}) {
  if (NoSuchToolError.isInstance(error) || !tools[toolCall.toolName]) {
    return null;
  }

  try {
    const schema = parameterSchema({ toolName: toolCall.toolName });
    const { object: repairedArgs } = await generateObject({
      model: getModel(),
      schema: z.any(),
      prompt: [
        `The model tried to call the tool "${toolCall.toolName}" with the following arguments:`,
        toolCall.args,
        `The tool accepts the following JSON schema:`,
        JSON.stringify(schema),
        "Please fix the arguments to match the schema.",
        `Today's date is ${new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}`,
      ].join("\n"),
    });

    return { ...toolCall, args: JSON.stringify(repairedArgs) };
  } catch {
    return null;
  }
}

/**
 * Stream a chat response with tool calling.
 * Framework-independent — returns an AI SDK streamText result.
 */
export function chat(options: {
  messages: CoreMessage[];
  mode?: SearchMode;
}) {
  const mode = options.mode || "web";

  return streamText({
    ...getEngineConfig(mode),
    messages: options.messages,
    experimental_transform: markdownJoinerTransform(),
    experimental_repairToolCall: repairToolCall,
    onChunk(event) {
      if (event.chunk.type === "tool-call") {
        console.log("[MetaSurfer] Tool called:", event.chunk.toolName);
      }
    },
  });
}

/**
 * Non-streaming chat — returns the full text response.
 * Useful for CLI and programmatic usage.
 */
export async function ask(options: {
  query: string;
  mode?: SearchMode;
}): Promise<string> {
  const mode = options.mode || "web";

  const result = await generateText({
    ...getEngineConfig(mode),
    messages: [{ role: "user", content: options.query }],
    experimental_repairToolCall: repairToolCall,
  });

  return result.text;
}
