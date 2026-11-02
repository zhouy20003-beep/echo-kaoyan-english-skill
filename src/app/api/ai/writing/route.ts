import type { NextRequest } from "next/server";
import { getPaper } from "@/lib/corpus";
import { writingMessages } from "@/lib/prompts";
import { aiJson } from "@/lib/deepseek";
import { modelEssayResultSchema, writingResultSchema } from "@/lib/ai-schemas";
import { writingAiSchema } from "@/lib/validation";
import { error, handleError, json } from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const input = writingAiSchema.parse(await req.json());
    const paper = getPaper(input.year);
    if (!paper) return error("年份不存在", 404);

    const maxScore = input.part === "A" ? 10 : 15;

    if (input.mode === "model") {
      const result = await aiJson(
        writingMessages(paper, input.part, "model"),
        modelEssayResultSchema,
      );
      return json({ mode: "model", result: { ...result, maxScore } });
    }

    const essay = (input.essay || "").trim();
    if (essay.length < 30) {
      return error("作文太短，先认真写完再提交批改", 400, "ESSAY_TOO_SHORT");
    }

    const result = await aiJson(
      writingMessages(paper, input.part, "grade", essay),
      writingResultSchema,
    );
    const score = Math.max(0, Math.min(maxScore, Math.round(result.score * 2) / 2));
    return json({ mode: "grade", result: { ...result, score, maxScore } });
  } catch (err) {
    return handleError(err);
  }
}
