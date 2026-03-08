export { createProvider as zai, getModel, configure, getConfig } from "../../src/core/provider";

// Re-export for backwards compatibility with existing Next.js code
import { createProvider } from "../../src/core/provider";
export const zai_default = createProvider();
