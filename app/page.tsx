"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { SearchInput } from "@/components/search-input";
import { MessageList } from "@/components/message-list";
import { Globe, Zap } from "lucide-react";

type SearchMode = "web" | "extreme";

export default function Home() {
  const [mode, setMode] = useState<SearchMode>("web");

  const { messages, input, handleInputChange, handleSubmit, isLoading, stop } =
    useChat({
      api: "/api/chat",
      body: { mode },
    });

  const hasMessages = messages.length > 0;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      {hasMessages && (
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3">
          <div className="max-w-3xl mx-auto flex items-center gap-2">
            <Globe className="w-5 h-5 text-accent" />
            <span className="font-semibold text-sm">Web Surfer</span>
            <ModeToggle mode={mode} onModeChange={setMode} compact />
          </div>
        </header>
      )}

      {/* Main content */}
      <main
        className={`flex-1 ${hasMessages ? "pb-32" : "flex items-center justify-center"}`}
      >
        {!hasMessages ? (
          /* Landing state */
          <div className="w-full max-w-2xl mx-auto px-4">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Globe className="w-10 h-10 text-accent" />
                <h1 className="text-4xl font-bold tracking-tight">
                  Web Surfer
                </h1>
              </div>
              <p className="text-muted-foreground text-lg">
                AI-powered search. Ask anything.
              </p>
            </div>
            <SearchInput
              input={input}
              isLoading={isLoading}
              onInputChange={handleInputChange}
              onSubmit={handleSubmit}
              onStop={stop}
              autoFocus
            />
            <div className="flex items-center justify-center gap-3 mt-4">
              <ModeToggle mode={mode} onModeChange={setMode} />
            </div>
            <div className="flex flex-wrap justify-center gap-2 mt-6">
              {[
                "What is quantum computing?",
                "Compare React vs Vue in 2025",
                "Write a Python fibonacci function",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    handleInputChange({
                      target: { value: suggestion },
                    } as React.ChangeEvent<HTMLTextAreaElement>);
                  }}
                  className="px-3 py-1.5 text-sm text-muted-foreground border border-border rounded-full hover:bg-muted hover:text-foreground transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Chat state */
          <div className="max-w-3xl mx-auto px-4 py-6">
            <MessageList messages={messages} isLoading={isLoading} />
          </div>
        )}
      </main>

      {/* Bottom input (visible when chat is active) */}
      {hasMessages && (
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background to-transparent pt-6 pb-4 px-4">
          <div className="max-w-3xl mx-auto">
            <SearchInput
              input={input}
              isLoading={isLoading}
              onInputChange={handleInputChange}
              onSubmit={handleSubmit}
              onStop={stop}
              placeholder="Ask a follow-up..."
            />
          </div>
        </div>
      )}
    </div>
  );
}

function ModeToggle({
  mode,
  onModeChange,
  compact,
}: {
  mode: SearchMode;
  onModeChange: (mode: SearchMode) => void;
  compact?: boolean;
}) {
  return (
    <div
      className={`flex items-center bg-muted rounded-full p-0.5 ${compact ? "ml-auto" : ""}`}
    >
      <button
        onClick={() => onModeChange("web")}
        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
          mode === "web"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <Globe className="w-3 h-3" />
        {!compact && "Web"}
      </button>
      <button
        onClick={() => onModeChange("extreme")}
        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
          mode === "extreme"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <Zap className="w-3 h-3" />
        {!compact && "Deep Research"}
      </button>
    </div>
  );
}
