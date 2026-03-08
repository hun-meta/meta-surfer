"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Copy, Check, ExternalLink } from "lucide-react";
import { useState } from "react";

interface MarkdownRendererProps {
  content: string;
}

function CodeBlock({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const [copied, setCopied] = useState(false);
  const language = className?.replace("language-", "") || "";
  const code = String(children).replace(/\n$/, "");

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-3">
      <div className="flex items-center justify-between px-4 py-2 bg-[#1e1e2e] rounded-t-lg border border-border border-b-0">
        <span className="text-xs text-muted-foreground font-mono">
          {language || "code"}
        </span>
        <button
          onClick={handleCopy}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-green-400" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
      <pre className="!mt-0 !rounded-t-none bg-[#1e1e2e] border border-border border-t-0">
        <code className={className}>{children}</code>
      </pre>
    </div>
  );
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="prose max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children, ...props }) {
            const isInline = !className;
            if (isInline) {
              return (
                <code
                  className="bg-muted px-1.5 py-0.5 rounded text-sm"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return <CodeBlock className={className}>{children}</CodeBlock>;
          },
          a({ href, children }) {
            const text = String(children);

            // Detect numbered citation links like [1], [2]
            if (/^\[\d+\]$/.test(text)) {
              return (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="citation"
                >
                  {text.replace(/[\[\]]/g, "")}
                </a>
              );
            }

            // Inline source citation links — styled distinctly
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-0.5 text-accent hover:underline"
              >
                {children}
                <ExternalLink className="w-3 h-3 inline-block shrink-0 opacity-50" />
              </a>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
