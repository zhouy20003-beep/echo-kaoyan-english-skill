import type { NextRequest } from "next/server";
import { addAttempt, listAttempts } from "@/lib/db";
import { attemptSchema } from "@/lib/validation";
import { json, withUser } from "@/lib/api";
import { summarizeAttempts } from "@/lib/stats";

export async function GET() {
  return withUser(async (user) => {
    const attempts = await listAttempts(user.id, 300);
    return json({ attempts: attempts.slice(0, 50), summary: summarizeAttempts(attempts) });
  });
}

export async function POST(req: NextRequest) {
  return withUser(async (user) => {
    const input = attemptSchema.parse(await req.json());
    const attempt = await addAttempt({
      userId: user.id,
      kind: input.kind,
      paperYear: input.paperYear ?? null,
      itemKey: input.itemKey,
      score: input.score ?? null,
      maxScore: input.maxScore ?? null,
      correct: input.correct ?? null,
      total: input.total ?? null,
      payload: input.payload,
    });
    return json({ attempt }, 201);
  });
}
