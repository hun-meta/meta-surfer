"use client";

import { ArrowUp, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRef, useEffect } from "react";

interface SearchInputProps {
  input: string;
  isLoading: boolean;
  onInputChange: (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => void;
  onSubmit: (e: React.FormEvent) => void;
  onStop: () => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function SearchInput({
  input,
  isLoading,
  onInputChange,
  onSubmit,
  onStop,
  placeholder = "Ask anything...",
  autoFocus = false,
}: SearchInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + "px";
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading) {
        onSubmit(e as unknown as React.FormEvent);
      }
    }
  };

  return (
    <form onSubmit={onSubmit} className="relative">
      <div className="relative flex items-end bg-muted border border-border rounded-2xl overflow-hidden focus-within:border-accent/50 transition-colors">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={onInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          className={cn(
            "flex-1 bg-transparent text-foreground placeholder-muted-foreground",
            "px-4 py-3.5 pr-12 resize-none outline-none",
            "text-[15px] leading-relaxed",
            "max-h-[200px]"
          )}
        />
        <button
          type={isLoading ? "button" : "submit"}
          onClick={isLoading ? onStop : undefined}
          disabled={!isLoading && !input.trim()}
          className={cn(
            "absolute right-2.5 bottom-2.5 p-1.5 rounded-lg transition-all",
            isLoading
              ? "bg-red-500/80 hover:bg-red-500 text-white"
              : input.trim()
                ? "bg-accent hover:bg-accent/90 text-accent-foreground"
                : "bg-border text-muted-foreground cursor-not-allowed"
          )}
        >
          {isLoading ? (
            <Square className="w-4 h-4" />
          ) : (
            <ArrowUp className="w-4 h-4" />
          )}
        </button>
      </div>
    </form>
  );
}
