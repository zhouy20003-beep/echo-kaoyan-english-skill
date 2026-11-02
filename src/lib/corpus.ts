import type { Paper, PaperMeta } from "@/lib/types";
import p2010 from "@/data/papers/2010.json";
import p2011 from "@/data/papers/2011.json";
import p2012 from "@/data/papers/2012.json";
import p2013 from "@/data/papers/2013.json";
import p2014 from "@/data/papers/2014.json";
import p2015 from "@/data/papers/2015.json";
import p2016 from "@/data/papers/2016.json";
import p2017 from "@/data/papers/2017.json";
import p2018 from "@/data/papers/2018.json";
import p2019 from "@/data/papers/2019.json";
import p2020 from "@/data/papers/2020.json";
import p2021 from "@/data/papers/2021.json";
import p2022 from "@/data/papers/2022.json";
import p2023 from "@/data/papers/2023.json";
import p2024 from "@/data/papers/2024.json";
import p2025 from "@/data/papers/2025.json";
import p2026 from "@/data/papers/2026.json";
import metaJson from "@/data/corpus-meta.json";
import rubricJson from "@/data/rubrics.json";

const ALL: Paper[] = (
  [
    p2010, p2011, p2012, p2013, p2014, p2015, p2016, p2017, p2018,
    p2019, p2020, p2021, p2022, p2023, p2024, p2025, p2026,
  ] as unknown as Paper[]
).sort((a, b) => a.year - b.year);

const BY_YEAR = new Map<number, Paper>(ALL.map((p) => [p.year, p]));

export const corpusMeta = metaJson as PaperMeta;

export const rubrics = rubricJson as {
  reading: string;
  cloze: string;
  translation: string;
  writing: string;
};

export function getYears(): number[] {
  return ALL.map((p) => p.year);
}

export function getYearsDesc(): number[] {
  return [...getYears()].reverse();
}

export function isValidYear(year: number): boolean {
  return BY_YEAR.has(year);
}

export function getPaper(year: number): Paper | null {
  return BY_YEAR.get(year) ?? null;
}

/** Newest paper first; useful for the home page. */
export function getRecentPapers(count = 4): Paper[] {
  return [...ALL].reverse().slice(0, count);
}

export function getReadingText(year: number, textNo: number) {
  const paper = getPaper(year);
  if (!paper) return null;
  return paper.readings.find((r) => r.textNo === textNo) ?? null;
}

export function countReadingQuestions(): number {
  return ALL.reduce((acc, p) => acc + p.readings.reduce((n, r) => n + r.questions.length, 0), 0);
}
