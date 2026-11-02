import { z } from "zod";

export const readingAiSchema = z.object({
  year: z.number().int().min(2010).max(2026),
  textNo: z.number().int().min(1).max(4),
  questionNo: z.number().int().min(21).max(45),
  userAnswer: z.string().max(1).optional(),
});

export const clozeAiSchema = z.object({
  year: z.number().int().min(2010).max(2026),
  questionNo: z.number().int().min(1).max(20),
  userAnswer: z.string().max(1).optional(),
});

export const translationAiSchema = z.object({
  year: z.number().int().min(2010).max(2026),
  userTranslation: z.string().trim().min(10, "译文太短，先写一点再批改").max(4000),
});

export const writingAiSchema = z.object({
  year: z.number().int().min(2010).max(2026),
  part: z.enum(["A", "B"]),
  mode: z.enum(["grade", "model"]).default("grade"),
  essay: z.string().max(6000).optional(),
});

export const chatSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(4000),
      }),
    )
    .min(1)
    .max(20),
});
