import type { NextRequest } from "next/server";
import { chatMessages } from "@/lib/prompts";
import { streamChat } from "@/lib/deepseek";
import { chatSchema } from "@/lib/validation";
import { withUser } from "@/lib/api";

export async function POST(req: NextRequest) {
  return withUser(async () => {
    const input = chatSchema.parse(await req.json());
    const stream = await streamChat(chatMessages(input.messages));
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  });
}
