import type { AttemptKind } from "@/lib/types";

export const KIND_LABELS: Record<AttemptKind, string> = {
  reading: "阅读理解",
  cloze: "完形填空",
  translation: "翻译",
  writing: "写作",
  mock: "模拟考试",
  ask: "AI 答疑",
};

/** Human readable label for a practice item key. */
export function itemLabel(kind: AttemptKind, itemKey: string): string {
  if (itemKey.startsWith("mock-reading-text-")) {
    const n = itemKey.match(/mock-reading-text-(\d+)/)?.[1];
    return n ? `模拟 · 阅读 Text ${n}` : "模拟考试";
  }
  if (itemKey.startsWith("reading-text-")) {
    const n = itemKey.match(/reading-text-(\d+)/)?.[1];
    return n ? `阅读 Text ${n}` : KIND_LABELS.reading;
  }
  if (itemKey === "cloze" || itemKey === "mock-cloze") {
    return itemKey === "cloze" ? "完形填空" : "模拟 · 完形填空";
  }
  if (itemKey === "translation" || itemKey === "mock-translation") {
    return itemKey === "translation" ? "翻译" : "模拟 · 翻译";
  }
  if (itemKey === "writing-part-A") return "小作文 Part A";
  if (itemKey === "writing-part-B") return "大作文 Part B";
  if (itemKey === "mock-objective") return "模拟考试 · 客观题";
  return KIND_LABELS[kind] ?? "练习";
}

/** Where the user can redo / view the item. */
export function practiceHref(
  kind: AttemptKind,
  paperYear: number | null,
  itemKey: string,
): string {
  if (kind === "ask") return "/ask";
  if (!paperYear) return "/papers";
  if (itemKey.startsWith("mock")) return `/mock?year=${paperYear}`;
  if (itemKey.startsWith("reading-text-")) {
    const textNo = itemKey.match(/reading-text-(\d+)/)?.[1] || "1";
    return `/practice/reading?year=${paperYear}&text=${textNo}`;
  }
  if (itemKey.startsWith("cloze")) return `/practice/cloze?year=${paperYear}`;
  if (itemKey === "translation") return `/practice/translation?year=${paperYear}`;
  if (itemKey === "writing-part-A") return `/practice/writing?year=${paperYear}&part=A`;
  if (itemKey === "writing-part-B") return `/practice/writing?year=${paperYear}&part=B`;
  return `/papers/${paperYear}`;
}
