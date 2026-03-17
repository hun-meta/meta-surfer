import { type UIMessage, convertToModelMessages } from "ai";
import { chat } from "@/src/engine";
import type { SearchMode } from "@/src/core/types";

export const maxDuration = 300;

export async function POST(req: Request) {
  const body = await req.json();
  const messages = body.messages as UIMessage[];
  const mode: SearchMode = body.mode || "web";

  const modelMessages = await convertToModelMessages(messages);
  const result = chat({ messages: modelMessages, mode });

  return result.toUIMessageStreamResponse();
}
