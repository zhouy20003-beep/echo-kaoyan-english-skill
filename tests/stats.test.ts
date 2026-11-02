import { describe, expect, it } from "vitest";
import { summarizeAttempts } from "@/lib/stats";
import type { Attempt } from "@/lib/types";

function makeAttempt(overrides: Partial<Attempt>): Attempt {
  return {
    id: crypto.randomUUID(),
    kind: "reading",
    paperYear: 2024,
    itemKey: "reading-text-1",
    score: null,
    maxScore: null,
    correct: null,
    total: null,
    payload: {},
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("学习统计", () => {
  it("计算客观题正确率与题型分布", () => {
    const attempts = [
      makeAttempt({ kind: "reading", correct: 4, total: 5 }),
      makeAttempt({ kind: "reading", correct: 3, total: 5 }),
      makeAttempt({ kind: "cloze", correct: 16, total: 20 }),
    ];
    const s = summarizeAttempts(attempts);
    expect(s.attempts).toBe(3);
    expect(s.totalQuestions).toBe(30);
    expect(s.totalCorrect).toBe(23);
    expect(s.correctRate).toBe(77);
    expect(s.byKind.reading).toEqual({ count: 2, correct: 7, total: 10 });
    expect(s.byKind.cloze).toEqual({ count: 1, correct: 16, total: 20 });
  });

  it("无客观题时正确率为 null", () => {
    const s = summarizeAttempts([
      makeAttempt({ kind: "writing", score: 12, maxScore: 15, itemKey: "writing-part-B" }),
    ]);
    expect(s.correctRate).toBeNull();
    expect(s.scoredRate).toBe(80);
    expect(s.totalQuestions).toBe(0);
  });

  it("连续学习天数从今天往前计算", () => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const s = summarizeAttempts([
      makeAttempt({ createdAt: today.toISOString() }),
      makeAttempt({ createdAt: yesterday.toISOString() }),
    ]);
    expect(s.streak).toBe(2);
    expect(s.studyDays).toBe(2);
  });

  it("空记录返回默认值", () => {
    const s = summarizeAttempts([]);
    expect(s.attempts).toBe(0);
    expect(s.correctRate).toBeNull();
    expect(s.streak).toBe(0);
    expect(s.recentDays).toEqual([]);
  });
});
