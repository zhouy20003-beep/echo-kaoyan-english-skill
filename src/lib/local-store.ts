import { useEffect, useState } from "react";
import type { Attempt, AttemptKind, FavoriteItem, WrongItem } from "@/lib/types";

/**
 * 免登录本地学习记录：全部数据保存在浏览器 localStorage 中。
 * 换设备、清缓存会丢失，服务端不保存任何个人数据。
 */

const KEYS = {
  attempts: "echo_attempts",
  wrong: "echo_wrong_items",
  favorites: "echo_favorites",
} as const;

const STORE_EVENT = "echo-store-change";
const MAX_ATTEMPTS = 500;

function storage(): Storage | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}

function read<T>(key: string): T[] {
  const store = storage();
  if (!store) return [];
  try {
    const raw = store.getItem(key);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function notify(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(STORE_EVENT));
  }
}

function write<T>(key: string, items: T[]): void {
  const store = storage();
  if (!store) return;
  try {
    store.setItem(key, JSON.stringify(items));
  } catch {
    // 存储空间不足时静默失败，不打断练习流程
  }
  notify();
}

function uuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** 订阅本地记录变化，供页面自动刷新。 */
export function useStoreVersion(): number {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const bump = () => setVersion((v) => v + 1);
    window.addEventListener(STORE_EVENT, bump);
    window.addEventListener("storage", bump);
    return () => {
      window.removeEventListener(STORE_EVENT, bump);
      window.removeEventListener("storage", bump);
    };
  }, []);
  return version;
}

export interface AttemptDraft {
  kind: AttemptKind;
  paperYear: number | null;
  itemKey: string;
  score?: number | null;
  maxScore?: number | null;
  correct?: number | null;
  total?: number | null;
  payload?: Record<string, unknown>;
}

export function addAttempt(draft: AttemptDraft): Attempt {
  const attempt: Attempt = {
    id: uuid(),
    kind: draft.kind,
    paperYear: draft.paperYear,
    itemKey: draft.itemKey,
    score: draft.score ?? null,
    maxScore: draft.maxScore ?? null,
    correct: draft.correct ?? null,
    total: draft.total ?? null,
    payload: draft.payload ?? {},
    createdAt: new Date().toISOString(),
  };
  const items = read<Attempt>(KEYS.attempts);
  items.push(attempt);
  write(KEYS.attempts, items.slice(-MAX_ATTEMPTS));
  return attempt;
}

export function listAttempts(limit = 300): Attempt[] {
  return read<Attempt>(KEYS.attempts)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}

export interface WrongDraft {
  kind: AttemptKind;
  paperYear: number;
  itemKey: string;
  questionNo: number;
  payload: Record<string, unknown>;
}

/** 同一道题重复答错时更新原记录，不产生重复条目。 */
export function addWrongItems(items: WrongDraft[]): void {
  if (items.length === 0) return;
  const now = new Date().toISOString();
  const existing = read<WrongItem>(KEYS.wrong);
  for (const item of items) {
    const found = existing.find(
      (w) =>
        w.kind === item.kind &&
        w.paperYear === item.paperYear &&
        w.itemKey === item.itemKey &&
        w.questionNo === item.questionNo,
    );
    if (found) {
      found.payload = item.payload;
      found.updatedAt = now;
    } else {
      existing.push({ id: uuid(), ...item, createdAt: now, updatedAt: now });
    }
  }
  write(KEYS.wrong, existing);
}

export function listWrongItems(): WrongItem[] {
  return read<WrongItem>(KEYS.wrong).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function removeWrongItem(id: string): void {
  write(
    KEYS.wrong,
    read<WrongItem>(KEYS.wrong).filter((w) => w.id !== id),
  );
}

export interface FavoriteDraft {
  kind: AttemptKind;
  paperYear: number;
  itemKey: string;
  questionNo?: number | null;
  payload?: Record<string, unknown>;
}

/** 同一道题只收藏一次。 */
export function addFavorite(draft: FavoriteDraft): void {
  const existing = read<FavoriteItem>(KEYS.favorites);
  const dup = existing.some(
    (f) => f.kind === draft.kind && f.paperYear === draft.paperYear && f.itemKey === draft.itemKey,
  );
  if (dup) return;
  existing.push({
    id: uuid(),
    kind: draft.kind,
    paperYear: draft.paperYear,
    itemKey: draft.itemKey,
    questionNo: draft.questionNo ?? null,
    payload: draft.payload ?? {},
    createdAt: new Date().toISOString(),
  });
  write(KEYS.favorites, existing);
}

export function isFavorite(kind: AttemptKind, paperYear: number, itemKey: string): boolean {
  return read<FavoriteItem>(KEYS.favorites).some(
    (f) => f.kind === kind && f.paperYear === paperYear && f.itemKey === itemKey,
  );
}

export function listFavorites(): FavoriteItem[] {
  return read<FavoriteItem>(KEYS.favorites).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function removeFavorite(id: string): void {
  write(
    KEYS.favorites,
    read<FavoriteItem>(KEYS.favorites).filter((f) => f.id !== id),
  );
}
