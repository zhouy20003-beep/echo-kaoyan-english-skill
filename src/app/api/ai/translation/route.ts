import type { NextRequest } from "next/server";
import { getPaper } from "@/lib/corpus";
import { translationMessages } from "@/lib/prompts";
import { aiJson } from "@/lib/deepseek";
import { translationResultSchema } from "@/lib/ai-schemas";
import { translationAiSchema } from "@/lib/validation";
import { error, json, withUser } from "@/lib/api";

export async function POST(req: NextRequest) {
  return withUser(async () => {
    const input = translationAiSchema.parse(await req.json());
    const paper = getPaper(input.year);
    if (!paper) return error("年份不存在", 404);

    const result = await aiJson(
      translationMessages(paper, input.userTranslation),
      translationResultSchema,
    );
    const score = Math.max(0, Math.min(15, Math.round(result.score * 2) / 2));
    return json({ result: { ...result, score, maxScore: 15 } });
  });
}
