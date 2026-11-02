import { z } from "zod";

const text = z.string().catch("");

export const readingResultSchema = z.object({
  answer: z.string().catch(""),
  answerMeaning: text,
  location: text,
  locationTranslation: text,
  questionTranslation: text,
  optionAnalysis: z
    .array(z.object({ option: z.string().catch(""), verdict: text, reason: text }))
    .catch([]),
  method: text,
  trap: text,
});

export const clozeResultSchema = z.object({
  answer: z.string().catch(""),
  answerWord: text,
  sentence: text,
  sentenceTranslation: text,
  contextLogic: text,
  optionAnalysis: z
    .array(z.object({ option: z.string().catch(""), verdict: text, reason: text }))
    .catch([]),
  collocation: text,
  method: text,
});

export const translationResultSchema = z.object({
  score: z.coerce.number().catch(0),
  maxScore: z.coerce.number().catch(15),
  band: text,
  bandLabel: text,
  unitScores: z
    .array(
      z.object({
        unit: text,
        max: z.coerce.number().catch(0),
        score: z.coerce.number().catch(0),
        comment: text,
      }),
    )
    .catch([]),
  sentenceAnalysis: z
    .array(
      z.object({
        source: text,
        userTranslation: text,
        reference: text,
        comment: text,
      }),
    )
    .catch([]),
  errors: z
    .array(z.object({ type: text, example: text, fix: text }))
    .catch([]),
  revisedTranslation: text,
  advice: z.array(z.string()).catch([]),
});

export const writingResultSchema = z.object({
  score: z.coerce.number().catch(0),
  maxScore: z.coerce.number().catch(15),
  band: text,
  bandLabel: text,
  wordCount: z.coerce.number().catch(0),
  taskAnalysis: z.array(z.string()).catch([]),
  dimensions: z
    .array(
      z.object({
        name: text,
        max: z.coerce.number().catch(0),
        score: z.coerce.number().catch(0),
        comment: text,
      }),
    )
    .catch([]),
  errors: z
    .array(z.object({ original: text, issue: text, fix: text }))
    .catch([]),
  strengths: z.array(z.string()).catch([]),
  revisedEssay: text,
  advice: z.array(z.string()).catch([]),
  modelEssay: z
    .object({ label: text, text: text, wordCount: z.coerce.number().catch(0) })
    .catch({ label: "", text: "", wordCount: 0 }),
  reusable: z.array(z.string()).catch([]),
});

export const modelEssayResultSchema = z.object({
  part: z.string().catch("A"),
  maxScore: z.coerce.number().catch(10),
  taskBreakdown: z.array(z.string()).catch([]),
  modelEssays: z
    .array(
      z.object({
        label: text,
        text: text,
        wordCount: z.coerce.number().catch(0),
      }),
    )
    .catch([]),
  structure: z.array(z.string()).catch([]),
  reusable: z.array(z.string()).catch([]),
  reminders: z.array(z.string()).catch([]),
});

export type ReadingResult = z.infer<typeof readingResultSchema>;
export type ClozeResult = z.infer<typeof clozeResultSchema>;
export type TranslationResult = z.infer<typeof translationResultSchema>;
export type WritingResult = z.infer<typeof writingResultSchema>;
export type ModelEssayResult = z.infer<typeof modelEssayResultSchema>;
