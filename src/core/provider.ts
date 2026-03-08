import { createOpenAI } from "@ai-sdk/openai";
import type { WebSurferConfig } from "./types";

let _config: WebSurferConfig = {};

export function configure(config: WebSurferConfig) {
  _config = { ..._config, ...config };
}

export function getConfig(): WebSurferConfig {
  return _config;
}

export function createProvider(config?: WebSurferConfig) {
  const cfg = config || _config;
  return createOpenAI({
    baseURL: cfg.baseURL || process.env.ZAI_BASE_URL || "https://api.z.ai/api/coding/paas/v4",
    apiKey: cfg.apiKey || process.env.ZAI_API_KEY || "",
    compatibility: "compatible",
  });
}

export function getModel(config?: WebSurferConfig) {
  const cfg = config || _config;
  const provider = createProvider(cfg);
  const modelId = cfg.model || process.env.ZAI_MODEL || "glm-4-plus";
  return provider(modelId);
}
