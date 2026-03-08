import type { ExecuteResult } from "../core/types";
import { getConfig } from "../core/provider";

const LANGUAGE_MAP: Record<string, { piston: string; version: string }> = {
  python: { piston: "python", version: "3.10.0" },
  javascript: { piston: "javascript", version: "18.15.0" },
  js: { piston: "javascript", version: "18.15.0" },
  node: { piston: "javascript", version: "18.15.0" },
  typescript: { piston: "typescript", version: "5.0.3" },
  ts: { piston: "typescript", version: "5.0.3" },
  bash: { piston: "bash", version: "5.2.0" },
  ruby: { piston: "ruby", version: "3.0.1" },
  go: { piston: "go", version: "1.16.2" },
  java: { piston: "java", version: "15.0.2" },
  c: { piston: "c", version: "10.2.0" },
  cpp: { piston: "cpp", version: "10.2.0" },
  rust: { piston: "rust", version: "1.68.2" },
};

export async function executeCode(
  language: string,
  code: string
): Promise<ExecuteResult> {
  const config = getConfig();
  const baseUrl = config.pistonURL || process.env.PISTON_URL || "http://localhost:2000";
  const lang = language.toLowerCase();
  const mapped = LANGUAGE_MAP[lang] || { piston: lang, version: "*" };

  try {
    const response = await fetch(`${baseUrl}/api/v2/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language: mapped.piston,
        version: mapped.version,
        files: [{ name: `main.${getExtension(lang)}`, content: code }],
        run_timeout: 3000,
        compile_timeout: 3000,
      }),
    });

    if (!response.ok) {
      throw new Error(`Piston responded with ${response.status}`);
    }

    const data = await response.json() as { run?: { stdout?: string; stderr?: string; code?: number }; compile?: { stderr?: string } };

    return {
      stdout: data.run?.stdout || "",
      stderr: data.run?.stderr || data.compile?.stderr || "",
      exitCode: data.run?.code ?? -1,
      language: lang,
    };
  } catch (error) {
    console.error("Piston execution failed:", error);
    return {
      stdout: "",
      stderr: `Code execution service unavailable: ${error instanceof Error ? error.message : "unknown error"}`,
      exitCode: -1,
      language: lang,
    };
  }
}

function getExtension(language: string): string {
  const extensions: Record<string, string> = {
    python: "py",
    javascript: "js",
    typescript: "ts",
    bash: "sh",
    ruby: "rb",
    go: "go",
    java: "java",
    c: "c",
    cpp: "cpp",
    rust: "rs",
  };
  return extensions[language] || "txt";
}
