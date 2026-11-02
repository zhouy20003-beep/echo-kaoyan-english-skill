import { describe, expect, it } from "vitest";
import { corpusMeta, getPaper, getYears, rubrics, isValidYear } from "@/lib/corpus";
import type { Choice } from "@/lib/types";

const LAST_CLOZE_NO = 20;
const LAST_READING_NO = 45;
const LETTERS: Choice[] = ["A", "B", "C", "D"];

describe("英语二语料完整性", () => {
  it("只包含英语二，年份为 2010–2026 共 17 年", () => {
    expect(corpusMeta.exam).toBe("english-ii");
    expect(getYears()).toEqual(Array.from({ length: 17 }, (_, i) => 2010 + i));
    expect(corpusMeta.totals.years).toBe(17);
  });

  it.each(getYears())("%i 年数据可读取", (year) => {
    expect(isValidYear(year)).toBe(true);
    expect(getPaper(year)?.year).toBe(year);
  });

  it.each(getYears())("%i 年完形为 1–20 题且答案合法", (year) => {
    const paper = getPaper(year)!;
    expect(paper.cloze.questions).toHaveLength(20);
    paper.cloze.questions.forEach((q, i) => {
      expect(q.no).toBe(i + 1);
      expect(LETTERS).toContain(q.answer as Choice);
      expect(q.answer && q.options[q.answer]).toBeTruthy();
      expect(Object.keys(q.options).sort()).toEqual(["A", "B", "C", "D"]);
    });
    // 正文必须包含全部 20 个占位符
    for (let i = 1; i <= LAST_CLOZE_NO; i += 1) {
      expect(paper.cloze.passage).toContain(`{{${i}}}`);
    }
  });

  it.each(getYears())("%i 年阅读为 4 篇、20 题、题号 21–45 连续", (year) => {
    const paper = getPaper(year)!;
    expect(paper.readings).toHaveLength(4);
    const numbers = paper.readings.flatMap((r) => r.questions.map((q) => q.no));
    expect(numbers).toHaveLength(20);
    expect(numbers).toEqual(Array.from({ length: 20 }, (_, i) => 21 + i));
    expect(numbers[numbers.length - 1]).toBeLessThanOrEqual(LAST_READING_NO);
    for (const reading of paper.readings) {
      expect(reading.paragraphs.join(" ").trim().length).toBeGreaterThan(200);
      for (const q of reading.questions) {
        expect(LETTERS).toContain(q.answer as Choice);
        expect(q.answer && q.options[q.answer]).toBeTruthy();
        expect(q.stem.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it.each(getYears())("%i 年翻译与大小作文非空", (year) => {
    const paper = getPaper(year)!;
    expect(paper.translation.source.trim().length).toBeGreaterThan(60);
    expect(paper.writing.partA.text.trim().length).toBeGreaterThan(10);
    expect(paper.writing.partB.text.trim().length).toBeGreaterThan(10);
  });

  it("评分规则包含英语二四类任务说明", () => {
    for (const key of ["reading", "cloze", "translation", "writing"] as const) {
      expect(rubrics[key].trim().length).toBeGreaterThan(200);
    }
    expect(rubrics.writing).toMatch(/English II/);
    expect(rubrics.writing).toMatch(/Part B large writing: 15 points/);
  });
});
