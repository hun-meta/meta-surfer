import { createOpenAI } from "@ai-sdk/openai";

export const zai = createOpenAI({
  baseURL: process.env.ZAI_BASE_URL || "https://api.z.ai/api/coding/paas/v4",
  apiKey: process.env.ZAI_API_KEY || "",
  compatibility: "compatible",
});

export function getModel() {
  const modelId = process.env.ZAI_MODEL || "glm-4-plus";
  return zai(modelId);
}
