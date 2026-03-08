import { defineConfig } from "tsup";

export default defineConfig([
  // Library build
  {
    entry: { index: "src/index.ts" },
    format: ["esm"],
    dts: { tsconfig: "tsconfig.build.json" },
    tsconfig: "tsconfig.build.json",
    outDir: "dist",
    clean: true,
    sourcemap: true,
    target: "node20",
    external: ["ai", "@ai-sdk/openai", "zod"],
  },
  // CLI build
  {
    entry: { cli: "src/cli.ts" },
    format: ["esm"],
    tsconfig: "tsconfig.build.json",
    outDir: "dist",
    sourcemap: true,
    target: "node20",
    external: ["ai", "@ai-sdk/openai", "zod", "commander", "dotenv"],
  },
]);
