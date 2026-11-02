import { NextResponse } from "next/server";
import { z } from "zod";
import { AiNotConfiguredError, AiError } from "@/lib/deepseek";

export function json(data: unknown, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

export function error(message: string, status = 400, code?: string): NextResponse {
  return NextResponse.json({ error: message, code }, { status });
}

export function handleError(err: unknown): NextResponse {
  if (err instanceof AiNotConfiguredError) {
    return error(
      "AI 功能尚未配置 DeepSeek API Key。请在服务器环境变量中设置 DEEPSEEK_API_KEY。",
      503,
      "AI_NOT_CONFIGURED",
    );
  }
  if (err instanceof AiError) {
    return error(err.message, err.status, "AI_ERROR");
  }
  if (err instanceof z.ZodError) {
    return error(err.issues[0]?.message || "输入有误", 400, "INVALID_INPUT");
  }
  console.error("[api]", err);
  return error("服务器开小差了，请稍后再试", 500, "SERVER_ERROR");
}
