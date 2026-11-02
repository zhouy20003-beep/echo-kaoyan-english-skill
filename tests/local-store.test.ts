import { beforeEach, describe, expect, it } from "vitest";
import {
  addAttempt,
  addFavorite,
  addWrongItems,
  isFavorite,
  listAttempts,
  listFavorites,
  listWrongItems,
  removeFavorite,
  removeWrongItem,
} from "@/lib/local-store";

class MemoryStorage {
  private map = new Map<string, string>();
  getItem(key: string): string | null {
    return this.map.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.map.set(key, String(value));
  }
  removeItem(key: string): void {
    this.map.delete(key);
  }
  clear(): void {
    this.map.clear();
  }
  get length(): number {
    return this.map.size;
  }
  key(index: number): string | null {
    return [...this.map.keys()][index] ?? null;
  }
}

beforeEach(() => {
  (globalThis as unknown as { localStorage: MemoryStorage }).localStorage = new MemoryStorage();
});

describe("本地学习记录（localStorage）", () => {
  it("保存并列出练习记录", () => {
    addAttempt({ kind: "reading", paperYear: 2024, itemKey: "reading-text-1", correct: 3, total: 5 });
    addAttempt({ kind: "cloze", paperYear: 2024, itemKey: "cloze", correct: 15, total: 20 });
    const attempts = listAttempts();
    expect(attempts).toHaveLength(2);
    expect(attempts.map((a) => a.kind).sort()).toEqual(["cloze", "reading"]);
    const reading = attempts.find((a) => a.kind === "reading");
    expect(reading?.correct).toBe(3);
    expect(reading?.id).toBeTruthy();
    expect(reading?.createdAt).toBeTruthy();
  });

  it("同一道题重复答错只保留一条并更新内容", () => {
    const draft = {
      kind: "reading" as const,
      paperYear: 2024,
      itemKey: "reading-text-1",
      questionNo: 21,
      payload: { correct: "A" },
    };
    addWrongItems([draft]);
    addWrongItems([{ ...draft, payload: { correct: "B" } }]);
    const items = listWrongItems();
    expect(items).toHaveLength(1);
    expect(items[0].payload.correct).toBe("B");
  });

  it("错题支持移除", () => {
    addWrongItems([
      { kind: "cloze", paperYear: 2023, itemKey: "cloze", questionNo: 3, payload: {} },
    ]);
    const items = listWrongItems();
    expect(items).toHaveLength(1);
    removeWrongItem(items[0].id);
    expect(listWrongItems()).toHaveLength(0);
  });

  it("同一道题收藏去重，可取消收藏", () => {
    const draft = { kind: "cloze" as const, paperYear: 2023, itemKey: "cloze-q3", questionNo: 3, payload: {} };
    addFavorite(draft);
    addFavorite(draft);
    expect(listFavorites()).toHaveLength(1);
    expect(isFavorite("cloze", 2023, "cloze-q3")).toBe(true);
    expect(isFavorite("cloze", 2023, "cloze-q4")).toBe(false);
    removeFavorite(listFavorites()[0].id);
    expect(isFavorite("cloze", 2023, "cloze-q3")).toBe(false);
    expect(listFavorites()).toHaveLength(0);
  });

  it("没有 localStorage 的环境返回空数据", () => {
    delete (globalThis as unknown as { localStorage?: unknown }).localStorage;
    expect(listAttempts()).toEqual([]);
    expect(listWrongItems()).toEqual([]);
    expect(listFavorites()).toEqual([]);
  });
});
