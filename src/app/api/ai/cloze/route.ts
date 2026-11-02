import type { NextRequest } from "next/server";
import { getPaper } from "@/lib/corpus";
import { clozeMessages } from "@/lib/prompts";
import { aiJson } from "@/lib/deepseek";
import { clozeResultSchema } from "@/lib/ai-schemas";
import { clozeAiSchema } from "@/lib/validation";
import { error, handleError, json } from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const input = clozeAiSchema.parse(await req.json());
    const paper = getPaper(input.year);
    if (!paper) return error("年份不存在", 404);
    const question = paper.cloze.questions.find((q) => q.no === input.questionNo);
    if (!question) return error("题目不存在", 404);

    const result = await aiJson(
      clozeMessages(paper, input.questionNo, input.userAnswer),
      clozeResultSchema,
    );
    return json({
      result: {
        ...result,
        answer: question.answer ?? result.answer,
        officialAnswer: question.answer,
      },
    });
  } catch (err) {
    return handleError(err);
  }
}
