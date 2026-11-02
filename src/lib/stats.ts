import type { Attempt } from "@/lib/types";

export interface KindStat {
  count: number;
  correct: number;
  total: number;
}

export interface StatsSummary {
  attempts: number;
  totalQuestions: number;
  totalCorrect: number;
  correctRate: number | null;
  scoredRate: number | null;
  studyDays: number;
  streak: number;
  byKind: Record<string, KindStat>;
  byYear: Record<string, { correct: number; total: number }>;
  recentDays: string[];
}

export function summarizeAttempts(attempts: Attempt[]): StatsSummary {
  const objective = attempts.filter(
    (a) => typeof a.correct === "number" && typeof a.total === "number" && a.total > 0,
  );
  const totalQuestions = objective.reduce((acc, a) => acc + (a.total || 0), 0);
  const totalCorrect = objective.reduce((acc, a) => acc + (a.correct || 0), 0);

  const byKind: Record<string, KindStat> = {};
  for (const a of objective) {
    const bucket = (byKind[a.kind] ||= { count: 0, correct: 0, total: 0 });
    bucket.count += 1;
    bucket.correct += a.correct || 0;
    bucket.total += a.total || 0;
  }

  const byYear: Record<string, { correct: number; total: number }> = {};
  for (const a of objective) {
    if (!a.paperYear) continue;
    const bucket = (byYear[String(a.paperYear)] ||= { correct: 0, total: 0 });
    bucket.correct += a.correct || 0;
    bucket.total += a.total || 0;
  }

  const scored = attempts.filter((a) => typeof a.score === "number" && a.maxScore);
  const scoredRate = scored.length
    ? Math.round(
        (scored.reduce((acc, a) => acc + (a.score || 0), 0) /
          scored.reduce((acc, a) => acc + (a.maxScore || 0), 0)) *
          100,
      )
    : null;

  const days = Array.from(new Set(attempts.map((a) => a.createdAt.slice(0, 10)))).sort();
  const today = new Date();
  let streak = 0;
  for (let i = 0; i < 365; i += 1) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    if (days.includes(key)) streak += 1;
    else if (i > 0) break;
  }

  return {
    attempts: attempts.length,
    totalQuestions,
    totalCorrect,
    correctRate: totalQuestions ? Math.round((totalCorrect / totalQuestions) * 100) : null,
    scoredRate,
    studyDays: days.length,
    streak,
    byKind,
    byYear,
    recentDays: days.slice(-14),
  };
}
