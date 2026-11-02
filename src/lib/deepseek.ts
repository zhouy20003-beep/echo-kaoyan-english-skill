import { z } from "zod";
import type { ChatMessage } from "@/lib/prompts";

const API_URL = process.env.DEEPSEEK_API_URL || "https://api.deepseek.com/chat/completions";
const MODEL = process.env.DEEPSEEK_MODEL || "deepseek-chat";

export class AiNotConfiguredError extends Error {
  constructor() {
    super("AI_NOT_CONFIGURED");
  }
}

export class AiError extends Error {
  status = 502;
  constructor(message: string, status = 502) {
    super(message);
    this.status = status;
  }
}

function apiKey(): string {
  const key = process.env.DEEPSEEK_API_KEY?.trim();
  if (!key) throw new AiNotConfiguredError();
  return key;
}

async function call(messages: ChatMessage[], options: {
  json?: boolean;
  temperature?: number;
  maxTokens?: number;
} = {}): Promise<string> {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey()}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: options.temperature ?? 0.3,
      max_tokens: options.maxTokens ?? 4096,
      stream: false,
      ...(options.json ? { response_format: { type: "json_object" } } : {}),
    }),
    signal: AbortSignal.timeout(90_000),
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text();
    if (res.status === 401 || res.status === 403) {
      throw new AiError("DeepSeek API Key 无效或没有权限，请检查服务器环境变量。", 502);
    }
    if (res.status === 429) {
      throw new AiError("AI 调用过于频繁，请稍后再试。", 429);
    }
    throw new AiError(`AI 服务暂时不可用（${res.status}）：${body.slice(0, 120)}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new AiError("AI 未返回内容，请重试。");
  return content;
}

export function extractJson(text: string): unknown {
  const trimmed = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new AiError("AI 返回格式异常，请重试。");
  }
  try {
    return JSON.parse(trimmed.slice(start, end + 1));
  } catch {
    throw new AiError("AI 返回的 JSON 无法解析，请重试。");
  }
}

export async function aiJson<S extends z.ZodTypeAny>(
  messages: ChatMessage[],
  schema: S,
): Promise<z.infer<S>> {
  let lastError: unknown = null;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const raw = await call(
        attempt === 0
          ? messages
          : [
              ...messages,
              {
                role: "user",
                content: "上一次输出不是合法 JSON。请只输出一个完整、合法的 JSON 对象，不要代码块。",
              },
            ],
        { json: true, temperature: attempt === 0 ? 0.3 : 0.1 },
      );
      const parsed = schema.parse(extractJson(raw)) as z.infer<S>;
      return parsed;
    } catch (err) {
      if (err instanceof AiNotConfiguredError) throw err;
      if (err instanceof AiError && !/JSON|格式/.test(err.message)) throw err;
      lastError = err;
    }
  }
  if (lastError instanceof AiError) throw lastError;
  throw new AiError("AI 返回内容未通过校验，请重试。");
}

/** Streams AI output as Server-Sent Events: data: {"text": "..."} */
export async function streamChat(messages: ChatMessage[]): Promise<ReadableStream<Uint8Array>> {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey()}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 2048,
      stream: true,
    }),
    signal: AbortSignal.timeout(120_000),
    cache: "no-store",
  });

  if (!res.ok || !res.body) {
    throw new AiError(res.status === 401 ? "DeepSeek API Key 无效，请检查服务器配置。" : "AI 答疑服务暂时不可用。", 502);
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const upstream = res.body.getReader();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      let buffer = "";
      try {
        while (true) {
          const { done, value } = await upstream.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");
          buffer = parts.pop() || "";
          for (const part of parts) {
            for (const line of part.split("\n")) {
              if (!line.startsWith("data:")) continue;
              const payload = line.slice(5).trim();
              if (payload === "[DONE]") {
                controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
                controller.close();
                return;
              }
              try {
                const json = JSON.parse(payload) as {
                  choices?: { delta?: { content?: string } }[];
                };
                const text = json.choices?.[0]?.delta?.content;
                if (text) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
                }
              } catch {
                // ignore malformed upstream chunk
              }
            }
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "连接中断，请重试。" })}\n\n`));
        } catch {
          // ignore
        }
        controller.close();
      }
    },
    cancel() {
      upstream.cancel().catch(() => undefined);
    },
  });
}

export function aiConfigured(): boolean {
  return Boolean(process.env.DEEPSEEK_API_KEY?.trim());
}
