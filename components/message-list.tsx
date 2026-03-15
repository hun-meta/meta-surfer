"use client";

import { useState } from "react";
import type { UIMessage } from "ai";
import { MarkdownRenderer } from "./markdown-renderer";
import { SourcesList } from "./source-card";
import {
  User,
  Bot,
  Search,
  Code,
  Globe,
  Loader2,
  Zap,
  BookOpen,
  Copy,
  Check,
} from "lucide-react";

interface MessageListProps {
  messages: UIMessage[];
  isLoading: boolean;
}

interface ToolInvocationPart {
  type: "tool-invocation";
  toolInvocation: {
    toolName: string;
    state: "call" | "partial-call" | "result";
    args?: Record<string, unknown>;
    result?: unknown;
  };
}

interface TextPart {
  type: "text";
  text: string;
}

type MessagePart = ToolInvocationPart | TextPart | { type: string };

export function MessageList({ messages, isLoading }: MessageListProps) {
  return (
    <div className="space-y-6">
      {messages.map((message) => (
        <MessageItem key={message.id} message={message} />
      ))}
      {isLoading && messages[messages.length - 1]?.role === "user" && (
        <ThinkingIndicator />
      )}
    </div>
  );
}

function MessageItem({ message }: { message: UIMessage }) {
  if (message.role === "user") {
    return <UserMessage content={message.content} />;
  }

  if (message.role === "assistant") {
    return <AssistantMessage message={message} />;
  }

  return null;
}

function UserMessage({ content }: { content: string }) {
  return (
    <div className="flex gap-3 animate-fade-in">
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-accent/10 text-accent shrink-0 mt-0.5">
        <User className="w-4 h-4" />
      </div>
      <div className="flex-1 pt-1">
        <p className="text-foreground text-[15px] font-medium">{content}</p>
      </div>
    </div>
  );
}

function AssistantMessage({ message }: { message: UIMessage }) {
  const parts = (message as UIMessage & { parts?: MessagePart[] }).parts;
  const searchSources = extractSearchSources(parts);
  const hasText =
    message.content &&
    typeof message.content === "string" &&
    message.content.length > 0;

  return (
    <div className="flex gap-3 animate-fade-in">
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-accent/10 text-accent shrink-0 mt-0.5">
        <Bot className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0 space-y-4">
        {/* Tool invocations */}
        {parts?.map((part, i) => {
          if (part.type === "tool-invocation") {
            const toolPart = part as ToolInvocationPart;
            return (
              <ToolInvocation key={i} invocation={toolPart.toolInvocation} />
            );
          }
          return null;
        })}

        {/* Search sources */}
        {searchSources.length > 0 && <SourcesList sources={searchSources} />}

        {/* Text answer */}
        {hasText && (
          <div className="animate-slide-up relative group/answer">
            <CopyResponseButton content={message.content as string} />
            <MarkdownRenderer content={message.content as string} />
          </div>
        )}
      </div>
    </div>
  );
}

function ToolInvocation({
  invocation,
}: {
  invocation: ToolInvocationPart["toolInvocation"];
}) {
  const isLoading = invocation.state !== "result";

  if (invocation.toolName === "webSearch") {
    return <WebSearchStatus invocation={invocation} isLoading={isLoading} />;
  }

  if (invocation.toolName === "readWebPages") {
    const urls = (invocation.args as { urls?: string[] })?.urls || [];
    return (
      <ToolStatus
        icon={<Globe className="w-3.5 h-3.5" />}
        label={`Reading ${urls.length} page${urls.length !== 1 ? "s" : ""}...`}
        isLoading={isLoading}
      />
    );
  }

  if (invocation.toolName === "executeCode") {
    const lang =
      (invocation.args as { language?: string })?.language || "code";
    const result = invocation.result as
      | {
          stdout?: string;
          stderr?: string;
          success?: boolean;
        }
      | undefined;

    return (
      <div className="space-y-2">
        <ToolStatus
          icon={<Code className="w-3.5 h-3.5" />}
          label={`Running ${lang} code...`}
          isLoading={isLoading}
        />
        {result && (
          <div className="bg-muted border border-border rounded-lg p-3 text-sm font-mono">
            {result.stdout && (
              <pre className="text-green-400 whitespace-pre-wrap">
                {result.stdout}
              </pre>
            )}
            {result.stderr && (
              <pre className="text-red-400 whitespace-pre-wrap">
                {result.stderr}
              </pre>
            )}
          </div>
        )}
      </div>
    );
  }

  if (invocation.toolName === "extremeSearch") {
    return (
      <ExtremeSearchStatus invocation={invocation} isLoading={isLoading} />
    );
  }

  return null;
}

function WebSearchStatus({
  invocation,
  isLoading,
}: {
  invocation: ToolInvocationPart["toolInvocation"];
  isLoading: boolean;
}) {
  const queries = (invocation.args as { queries?: string[] })?.queries || [];
  const result = invocation.result as
    | {
        totalResults?: number;
        searches?: Array<{ query: string; resultCount: number }>;
      }
    | undefined;

  if (isLoading) {
    return (
      <div className="space-y-1">
        {queries.map((q, i) => (
          <ToolStatus
            key={i}
            icon={<Search className="w-3.5 h-3.5" />}
            label={`Searching: "${q}"`}
            isLoading
          />
        ))}
      </div>
    );
  }

  if (result?.searches) {
    return (
      <div className="space-y-1">
        {result.searches.map((s, i) => (
          <ToolStatus
            key={i}
            icon={<Search className="w-3.5 h-3.5" />}
            label={`"${s.query}" - ${s.resultCount} results`}
            isLoading={false}
          />
        ))}
      </div>
    );
  }

  return (
    <ToolStatus
      icon={<Search className="w-3.5 h-3.5" />}
      label={`Searched ${queries.length} queries`}
      isLoading={false}
    />
  );
}

function ExtremeSearchStatus({
  invocation,
  isLoading,
}: {
  invocation: ToolInvocationPart["toolInvocation"];
  isLoading: boolean;
}) {
  const prompt =
    (invocation.args as { prompt?: string })?.prompt || "research";
  const result = invocation.result as
    | {
        plan?: Array<{ title: string; queries: string[] }>;
        sourcesCount?: number;
        sources?: Array<{
          title: string;
          url: string;
          content: string;
          favicon?: string;
        }>;
        codeResults?: Array<{
          title: string;
          success: boolean;
          stdout: string;
        }>;
      }
    | undefined;

  if (isLoading) {
    return (
      <div className="border border-border rounded-lg p-3 space-y-2">
        <ToolStatus
          icon={<Zap className="w-3.5 h-3.5" />}
          label={`Deep research: "${prompt.slice(0, 80)}${prompt.length > 80 ? "..." : ""}"`}
          isLoading
        />
        <p className="text-xs text-muted-foreground pl-6">
          Planning research strategy, searching multiple angles, reading key
          sources...
        </p>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-lg p-3 space-y-3">
      <ToolStatus
        icon={<Zap className="w-3.5 h-3.5" />}
        label="Deep research complete"
        isLoading={false}
      />

      {/* Research plan */}
      {result?.plan && (
        <div className="pl-6 space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Research Plan
          </p>
          {result.plan.map((step, i) => (
            <div key={i} className="text-sm">
              <span className="font-medium text-foreground">{step.title}</span>
              <ul className="mt-0.5 space-y-0.5">
                {step.queries.map((query, j) => (
                  <li
                    key={j}
                    className="text-xs text-muted-foreground pl-3 before:content-['•'] before:mr-1.5"
                  >
                    {query}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Sources count */}
      {result?.sourcesCount != null && (
        <div className="pl-6">
          <ToolStatus
            icon={<BookOpen className="w-3.5 h-3.5" />}
            label={`Found ${result.sourcesCount} sources`}
            isLoading={false}
          />
        </div>
      )}

      {/* Code results */}
      {result?.codeResults && result.codeResults.length > 0 && (
        <div className="pl-6 space-y-1">
          {result.codeResults.map((cr, i) => (
            <div key={i} className="text-sm">
              <ToolStatus
                icon={<Code className="w-3.5 h-3.5" />}
                label={`${cr.title} - ${cr.success ? "passed" : "failed"}`}
                isLoading={false}
              />
              {cr.stdout && (
                <pre className="bg-muted rounded p-2 mt-1 text-xs font-mono text-green-400 whitespace-pre-wrap">
                  {cr.stdout.slice(0, 500)}
                </pre>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CopyResponseButton({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      aria-label="Copy response"
      className="absolute top-0 right-0 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors opacity-0 group-hover/answer:opacity-100"
    >
      {copied ? (
        <Check className="w-4 h-4 text-green-400" />
      ) : (
        <Copy className="w-4 h-4" />
      )}
    </button>
  );
}

function ToolStatus({
  icon,
  label,
  isLoading,
}: {
  icon: React.ReactNode;
  label: string;
  isLoading: boolean;
}) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground py-1">
      {isLoading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />
      ) : (
        <span className="text-accent">{icon}</span>
      )}
      <span>{label}</span>
    </div>
  );
}

function ThinkingIndicator() {
  return (
    <div className="flex gap-3 animate-fade-in">
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-accent/10 text-accent shrink-0">
        <Bot className="w-4 h-4" />
      </div>
      <div className="flex items-center gap-1.5 pt-2.5">
        <div className="w-2 h-2 rounded-full bg-accent loading-dot" />
        <div className="w-2 h-2 rounded-full bg-accent loading-dot" />
        <div className="w-2 h-2 rounded-full bg-accent loading-dot" />
      </div>
    </div>
  );
}

function extractSearchSources(parts?: MessagePart[]) {
  if (!parts) return [];
  const results: Array<{
    title: string;
    url: string;
    content: string;
    favicon?: string;
  }> = [];

  for (const part of parts) {
    if (part.type !== "tool-invocation") continue;
    const inv = (part as ToolInvocationPart).toolInvocation;
    if (inv.state !== "result") continue;

    if (inv.toolName === "webSearch") {
      const toolResult = inv.result as {
        results?: Array<{
          title: string;
          url: string;
          content: string;
          favicon?: string;
        }>;
      };
      if (toolResult?.results) {
        results.push(...toolResult.results);
      }
    }

    if (inv.toolName === "extremeSearch") {
      const toolResult = inv.result as {
        sources?: Array<{
          title: string;
          url: string;
          content: string;
          favicon?: string;
        }>;
      };
      if (toolResult?.sources) {
        results.push(...toolResult.sources);
      }
    }
  }

  // Deduplicate by URL
  const seen = new Set<string>();
  return results.filter((r) => {
    if (!r.url || seen.has(r.url)) return false;
    seen.add(r.url);
    return true;
  });
}
