import type { NextRequest } from "next/server";
import { getPaper } from "@/lib/corpus";
import { readingMessages } from "@/lib/prompts";
import { aiJson } from "@/lib/deepseek";
import { readingResultSchema } from "@/lib/ai-schemas";
import { readingAiSchema } from "@/lib/validation";
import { error, json, withUser } from "@/lib/api";

export async function POST(req: NextRequest) {
  return withUser(async () => {
    const input = readingAiSchema.parse(await req.json());
    const paper = getPaper(input.year);
    if (!paper) return error("年份不存在", 404);
    const text = paper.readings.find((r) => r.textNo === input.textNo);
    const question = text?.questions.find((q) => q.no === input.questionNo);
    if (!text || !question) return error("题目不存在", 404);

    const result = await aiJson(
      readingMessages(paper, input.textNo, input.questionNo, input.userAnswer),
      readingResultSchema,
    );
    return json({
      result: {
        ...result,
        answer: question.answer ?? result.answer,
        officialAnswer: question.answer,
      },
    });
  });
}
