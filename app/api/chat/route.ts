import { type CoreMessage } from "ai";
import { chat } from "@/src/engine";
import type { SearchMode } from "@/src/core/types";

export const maxDuration = 300;

export async function POST(req: Request) {
  const body = await req.json();
  const messages = body.messages as CoreMessage[];
  const mode: SearchMode = body.mode || "web";

  const result = chat({ messages, mode });

  return result.toDataStreamResponse();
}
