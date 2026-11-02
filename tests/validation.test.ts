import { describe, expect, it } from "vitest";
import { readingAiSchema, translationAiSchema, writingAiSchema } from "@/lib/validation";
import { itemLabel, practiceHref } from "@/lib/labels";

describe("AI 输入校验", () => {
  it("阅读解析需要合法的年份、篇号与题号", () => {
    expect(readingAiSchema.safeParse({ year: 2024, textNo: 1, questionNo: 21 }).success).toBe(true);
    expect(readingAiSchema.safeParse({ year: 2009, textNo: 1, questionNo: 21 }).success).toBe(false);
    expect(readingAiSchema.safeParse({ year: 2024, textNo: 9, questionNo: 21 }).success).toBe(false);
    expect(readingAiSchema.safeParse({ year: 2024, textNo: 1, questionNo: 50 }).success).toBe(false);
  });

  it("翻译批改拒绝过短译文", () => {
    expect(translationAiSchema.safeParse({ year: 2024, userTranslation: "太短" }).success).toBe(false);
    expect(
      translationAiSchema.safeParse({ year: 2024, userTranslation: "这是一段足够长的中文译文内容。" }).success,
    ).toBe(true);
  });

  it("写作批改只支持 A/B 两部分", () => {
    expect(
      writingAiSchema.safeParse({ year: 2024, part: "A", mode: "grade", essay: "x".repeat(40) }).success,
    ).toBe(true);
    expect(writingAiSchema.safeParse({ year: 2024, part: "C" }).success).toBe(false);
  });
});

describe("题干与跳转标签", () => {
  it("生成人类可读的题目名称", () => {
    expect(itemLabel("reading", "reading-text-2")).toBe("阅读 Text 2");
    expect(itemLabel("cloze", "cloze")).toBe("完形填空");
    expect(itemLabel("writing", "writing-part-A")).toBe("小作文 Part A");
    expect(itemLabel("mock", "mock-objective")).toBe("模拟考试 · 客观题");
  });

  it("跳转到对应练习页", () => {
    expect(practiceHref("reading", 2024, "reading-text-3")).toBe("/practice/reading?year=2024&text=3");
    expect(practiceHref("cloze", 2021, "cloze")).toBe("/practice/cloze?year=2021");
    expect(practiceHref("translation", 2020, "translation")).toBe("/practice/translation?year=2020");
    expect(practiceHref("writing", 2020, "writing-part-B")).toBe("/practice/writing?year=2020&part=B");
    expect(practiceHref("mock", 2020, "mock-objective")).toBe("/mock?year=2020");
    expect(practiceHref("ask", null, "ask")).toBe("/ask");
  });
});
