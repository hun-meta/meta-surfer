# Providers

Web Surfer supports multiple LLM providers through the Vercel AI SDK. This guide covers provider configuration, auto-detection, and customization.

## Supported Providers

| Provider   | Default Model            | SDK Package        | Environment Variable   | Protocol          |
|------------|-------------------------|--------------------|------------------------|-------------------|
| OpenAI     | `gpt-5.1-chat-latest`  | `@ai-sdk/openai`  | `OPENAI_API_KEY`       | OpenAI            |
| Google     | `gemini-3.1-flash`     | `@ai-sdk/google`  | `GOOGLE_API_KEY`       | Google AI          |
| Anthropic  | `claude-opus-4.6`      | `@ai-sdk/anthropic` | `ANTHROPIC_API_KEY`  | Anthropic          |
| xAI        | `grok-4.1`             | `@ai-sdk/xai`     | `XAI_API_KEY`          | xAI (OpenAI-compat) |
| Z.AI       | `glm-5`                | `@ai-sdk/openai`  | `ZAI_API_KEY`          | OpenAI-compatible  |

## Auto-Detection Logic

When no provider is explicitly specified, Web Surfer auto-detects the provider in this order:

1. **Explicit config**: `configure({ provider: "openai" })` or `--provider openai`
2. **`LLM_PROVIDER` env var**: If set, uses that provider directly
3. **API key detection**: Checks for API key environment variables in this order:
   - `OPENAI_API_KEY` -> uses `openai`
   - `GOOGLE_API_KEY` -> uses `google`
   - `ANTHROPIC_API_KEY` -> uses `anthropic`
   - `XAI_API_KEY` -> uses `xai`
   - `ZAI_API_KEY` -> uses `zai`
4. **Fallback**: Defaults to `zai` if nothing is detected

This means if you have both `OPENAI_API_KEY` and `ANTHROPIC_API_KEY` set, OpenAI will be selected unless you explicitly choose Anthropic.

## Configuration Methods

There are three ways to configure the provider, listed in priority order (highest first):

### 1. Programmatic (`configure()`)

```typescript
import { configure } from "web-surfer";

configure({
  provider: "anthropic",
  apiKey: "sk-ant-your-key",
  model: "claude-sonnet-4-20250514",
});
```

### 2. CLI Flags

```bash
web-surfer --provider google --api-key "your-key" --model gemini-2.0-flash ask "Hello"
```

### 3. Environment Variables

```bash
# In .env.local or exported in shell
LLM_PROVIDER=openai
LLM_MODEL=gpt-4o
OPENAI_API_KEY=sk-your-key
```

The resolution order for each setting is:

| Setting   | 1st (highest)                | 2nd                      | 3rd (lowest)          |
|-----------|------------------------------|--------------------------|----------------------|
| Provider  | `configure({ provider })`    | `LLM_PROVIDER` env      | Auto-detect from keys |
| API Key   | `configure({ apiKey })`      | Provider-specific env var |                      |
| Model     | `configure({ model })`       | `LLM_MODEL` env          | Provider default     |
| Base URL  | `configure({ baseURL })`     | `ZAI_BASE_URL` (ZAI only) | Provider default    |

## Provider-Specific Notes

### OpenAI

Standard OpenAI API. No special configuration needed beyond the API key.

```bash
OPENAI_API_KEY=sk-your-openai-key
```

```typescript
configure({
  provider: "openai",
  apiKey: "sk-your-openai-key",
  model: "gpt-4o",  // override default
});
```

### Google (Gemini)

Uses the Google Generative AI SDK.

```bash
GOOGLE_API_KEY=your-google-api-key
```

```typescript
configure({
  provider: "google",
  apiKey: "your-google-api-key",
  model: "gemini-2.0-flash",
});
```

### Anthropic (Claude)

Uses the Anthropic SDK.

```bash
ANTHROPIC_API_KEY=sk-ant-your-key
```

```typescript
configure({
  provider: "anthropic",
  apiKey: "sk-ant-your-key",
  model: "claude-sonnet-4-20250514",
});
```

### xAI (Grok)

Uses the xAI SDK. The protocol is OpenAI-compatible, so `parallelToolCalls` is automatically disabled for correct tool-calling behavior.

```bash
XAI_API_KEY=your-xai-key
```

```typescript
configure({
  provider: "xai",
  apiKey: "your-xai-key",
  model: "grok-3",
});
```

### Z.AI (GLM)

Z.AI uses the **OpenAI-compatible** protocol via `@ai-sdk/openai` with `compatibility: "compatible"`. It requires a custom base URL.

```bash
ZAI_API_KEY=your-zai-key
ZAI_BASE_URL=https://api.z.ai/api/coding/paas/v4  # default
```

```typescript
configure({
  provider: "zai",
  apiKey: "your-zai-key",
  // baseURL defaults to https://api.z.ai/api/coding/paas/v4
});
```

## Custom Base URL (Proxies / Self-Hosted)

You can point any provider at a custom endpoint using `baseURL`. This is useful for:

- **API proxies** (e.g., LiteLLM, OpenRouter)
- **Self-hosted models** (e.g., vLLM, Ollama with OpenAI-compatible API)
- **Corporate proxies** with custom authentication

### Example: OpenAI-compatible proxy

```typescript
configure({
  provider: "openai",  // use OpenAI SDK
  baseURL: "https://your-proxy.example.com/v1",
  apiKey: "your-proxy-key",
  model: "your-model-id",
});
```

### Example: Ollama (local)

```typescript
configure({
  provider: "openai",
  baseURL: "http://localhost:11434/v1",
  apiKey: "ollama",  // Ollama accepts any string
  model: "llama3",
});
```

### Example: OpenRouter

```bash
web-surfer --provider openai \
  --base-url "https://openrouter.ai/api/v1" \
  --api-key "sk-or-your-key" \
  --model "anthropic/claude-sonnet-4-20250514" \
  ask "Hello"
```

## OpenAI Compatibility

Some internal behavior depends on whether the provider uses the OpenAI-compatible protocol. The `isOpenAICompatible()` function returns `true` for:

- `openai`
- `zai`
- `xai`

For these providers, `parallelToolCalls` is set to `false` in provider options to prevent issues with sequential tool calling.

## Complete `.env.local` Example

```bash
# Select provider explicitly (optional -- auto-detects from keys)
# LLM_PROVIDER=openai

# Override default model (optional)
# LLM_MODEL=gpt-4o

# Provider API keys (set one or more)
OPENAI_API_KEY=sk-your-openai-key
# GOOGLE_API_KEY=your-google-key
# ANTHROPIC_API_KEY=your-anthropic-key
# XAI_API_KEY=your-xai-key
# ZAI_API_KEY=your-zai-key
# ZAI_BASE_URL=https://api.z.ai/api/coding/paas/v4

# External services
SEARXNG_URL=http://localhost:8080
CRAWL4AI_URL=http://localhost:11235
PISTON_URL=http://localhost:2000
```
