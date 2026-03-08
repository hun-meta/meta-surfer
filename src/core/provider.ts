import type { LanguageModelV1 } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createXai } from "@ai-sdk/xai";
import type { WebSurferConfig, LLMProvider } from "./types";

let _config: WebSurferConfig = {};

export function configure(config: WebSurferConfig) {
  _config = { ..._config, ...config };
}

export function getConfig(): WebSurferConfig {
  return _config;
}

const DEFAULT_MODELS: Record<LLMProvider, string> = {
  openai: "gpt-5.1-chat-latest",
  google: "gemini-3.1-flash",
  anthropic: "claude-opus-4.6",
  xai: "grok-4.1",
  zai: "glm-5",
};

const ENV_KEYS: Record<LLMProvider, string> = {
  openai: "OPENAI_API_KEY",
  google: "GOOGLE_API_KEY",
  anthropic: "ANTHROPIC_API_KEY",
  xai: "XAI_API_KEY",
  zai: "ZAI_API_KEY",
};

/**
 * Auto-detect provider from environment variables.
 * Checks in order: explicit config → env vars (openai → google → anthropic → xai → zai).
 */
export function detectProvider(config?: WebSurferConfig): LLMProvider {
  const cfg = config || _config;
  if (cfg.provider) return cfg.provider;

  if (process.env.LLM_PROVIDER) {
    return process.env.LLM_PROVIDER as LLMProvider;
  }

  // Auto-detect from available API keys
  const detectOrder: LLMProvider[] = ["openai", "google", "anthropic", "xai", "zai"];
  for (const p of detectOrder) {
    if (process.env[ENV_KEYS[p]]) return p;
  }

  // Fallback: zai (original default)
  return "zai";
}

function resolveApiKey(provider: LLMProvider, config?: WebSurferConfig): string {
  const cfg = config || _config;
  return cfg.apiKey || process.env[ENV_KEYS[provider]] || "";
}

export function getModel(config?: WebSurferConfig): LanguageModelV1 {
  const cfg = config || _config;
  const provider = detectProvider(cfg);
  const apiKey = resolveApiKey(provider, cfg);
  const modelId = cfg.model || process.env.LLM_MODEL || DEFAULT_MODELS[provider];

  switch (provider) {
    case "openai": {
      const openai = createOpenAI({
        apiKey,
        ...(cfg.baseURL ? { baseURL: cfg.baseURL } : {}),
      });
      return openai(modelId);
    }

    case "google": {
      const google = createGoogleGenerativeAI({
        apiKey,
        ...(cfg.baseURL ? { baseURL: cfg.baseURL } : {}),
      });
      return google(modelId);
    }

    case "anthropic": {
      const anthropic = createAnthropic({
        apiKey,
        ...(cfg.baseURL ? { baseURL: cfg.baseURL } : {}),
      });
      return anthropic(modelId);
    }

    case "xai": {
      const xai = createXai({
        apiKey,
        ...(cfg.baseURL ? { baseURL: cfg.baseURL } : {}),
      });
      return xai(modelId);
    }

    case "zai": {
      const zai = createOpenAI({
        baseURL: cfg.baseURL || process.env.ZAI_BASE_URL || "https://api.z.ai/api/coding/paas/v4",
        apiKey,
        compatibility: "compatible",
      });
      return zai(modelId);
    }

    default: {
      const _exhaustive: never = provider;
      throw new Error(`Unknown provider: ${_exhaustive}`);
    }
  }
}

/**
 * Returns true if the current provider uses OpenAI-compatible protocol.
 * Used to conditionally apply providerOptions like parallelToolCalls.
 */
export function isOpenAICompatible(config?: WebSurferConfig): boolean {
  const provider = detectProvider(config || _config);
  return provider === "openai" || provider === "zai" || provider === "xai";
}
