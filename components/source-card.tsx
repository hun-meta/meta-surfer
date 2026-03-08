"use client";

import { ExternalLink } from "lucide-react";
import { extractDomain, truncate } from "@/lib/utils";

interface Source {
  title: string;
  url: string;
  content: string;
  favicon?: string;
}

interface SourceCardProps {
  source: Source;
  index: number;
}

export function SourceCard({ source, index }: SourceCardProps) {
  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col gap-1.5 p-3 bg-muted border border-border rounded-xl hover:border-accent/30 transition-colors group min-w-[200px] max-w-[250px]"
    >
      <div className="flex items-center gap-2">
        {source.favicon ? (
          <img
            src={source.favicon}
            alt=""
            className="w-4 h-4 rounded-sm shrink-0"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <span className="flex items-center justify-center w-5 h-5 text-[10px] font-bold bg-accent text-white rounded-full shrink-0">
            {index + 1}
          </span>
        )}
        <span className="text-xs text-muted-foreground truncate">
          {extractDomain(source.url)}
        </span>
        <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-auto shrink-0" />
      </div>
      <p className="text-sm font-medium text-foreground line-clamp-2 leading-snug">
        {source.title}
      </p>
      <p className="text-xs text-muted-foreground line-clamp-2">
        {truncate(source.content, 120)}
      </p>
    </a>
  );
}

interface SourcesListProps {
  sources: Source[];
}

export function SourcesList({ sources }: SourcesListProps) {
  if (!sources.length) return null;

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1 h-4 bg-accent rounded-full" />
        <h3 className="text-sm font-semibold text-muted-foreground">
          Sources
        </h3>
        <span className="text-xs text-muted-foreground">
          ({sources.length})
        </span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
        {sources.map((source, i) => (
          <SourceCard key={source.url} source={source} index={i} />
        ))}
      </div>
    </div>
  );
}
