import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email("请输入有效的邮箱地址").max(120),
  name: z.string().trim().min(1, "请输入昵称").max(30),
  password: z.string().min(8, "密码至少 8 位").max(72),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("请输入有效的邮箱地址").max(120),
  password: z.string().min(1, "请输入密码").max(72),
});

export const attemptSchema = z.object({
  kind: z.enum(["reading", "cloze", "translation", "writing", "mock"]),
  paperYear: z.number().int().min(2010).max(2026).nullable().optional(),
  itemKey: z.string().min(1).max(160),
  score: z.number().min(0).max(200).nullable().optional(),
  maxScore: z.number().min(0).max(200).nullable().optional(),
  correct: z.number().int().min(0).max(200).nullable().optional(),
  total: z.number().int().min(0).max(200).nullable().optional(),
  payload: z.record(z.unknown()).default({}),
});

export const wrongSchema = z.object({
  items: z
    .array(
      z.object({
        kind: z.enum(["reading", "cloze", "translation", "writing", "mock"]),
        paperYear: z.number().int().min(2010).max(2026),
        itemKey: z.string().min(1).max(160),
        questionNo: z.number().int().min(1).max(200),
        payload: z.record(z.unknown()).default({}),
      }),
    )
    .min(1)
    .max(50),
});

export const favoriteSchema = z.object({
  kind: z.enum(["reading", "cloze", "translation", "writing", "mock"]),
  paperYear: z.number().int().min(2010).max(2026),
  itemKey: z.string().min(1).max(160),
  questionNo: z.number().int().min(1).max(200).nullable().optional(),
  payload: z.record(z.unknown()).default({}),
});

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

export function firstError(error: z.ZodError): string {
  return error.issues[0]?.message || "输入有误";
}
