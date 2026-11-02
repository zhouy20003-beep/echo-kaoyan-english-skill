import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import type { Attempt, AttemptKind, FavoriteItem, PublicUser, WrongItem } from "@/lib/types";

export interface StoredUser extends PublicUser {
  passwordHash: string;
}

export interface AttemptInput {
  userId: string;
  kind: AttemptKind;
  paperYear: number | null;
  itemKey: string;
  score?: number | null;
  maxScore?: number | null;
  correct?: number | null;
  total?: number | null;
  payload: Record<string, unknown>;
}

export interface WrongInput {
  userId: string;
  kind: AttemptKind;
  paperYear: number;
  itemKey: string;
  questionNo: number;
  payload: Record<string, unknown>;
}

export interface FavoriteInput {
  userId: string;
  kind: AttemptKind;
  paperYear: number;
  itemKey: string;
  questionNo?: number | null;
  payload: Record<string, unknown>;
}

const SUPABASE_URL = process.env.SUPABASE_URL?.replace(/\/+$/, "");
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function usingSupabase(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_KEY);
}

const DATA_DIR = path.join(process.cwd(), ".data");
const DB_FILE = path.join(DATA_DIR, "db.json");

interface LocalDb {
  users: StoredUser[];
  attempts: Attempt[];
  wrongItems: WrongItem[];
  favorites: FavoriteItem[];
}

const EMPTY: LocalDb = { users: [], attempts: [], wrongItems: [], favorites: [] };

let queue: Promise<unknown> = Promise.resolve();
let cache: LocalDb | null = null;

function serialize<T>(fn: () => Promise<T>): Promise<T> {
  const next = queue.then(fn, fn);
  queue = next.catch(() => undefined);
  return next;
}

async function readLocal(): Promise<LocalDb> {
  if (cache) return cache;
  try {
    const raw = await fs.readFile(DB_FILE, "utf8");
    cache = { ...EMPTY, ...(JSON.parse(raw) as Partial<LocalDb>) };
  } catch {
    cache = { users: [], attempts: [], wrongItems: [], favorites: [] };
  }
  return cache;
}

async function writeLocal(db: LocalDb): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${DB_FILE}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(db, null, 2), "utf8");
  await fs.rename(tmp, DB_FILE);
}

async function sb(
  pathAndQuery: string,
  init: RequestInit = {},
): Promise<unknown> {
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error("SUPABASE_NOT_CONFIGURED");
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${pathAndQuery}`, {
    ...init,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(init.headers || {}),
    },
    cache: "no-store",
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`SUPABASE_ERROR ${res.status}: ${text.slice(0, 200)}`);
  }
  return text ? JSON.parse(text) : null;
}

interface SbUserRow {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  created_at: string;
}

function toStoredUser(row: SbUserRow): StoredUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    passwordHash: row.password_hash,
    createdAt: row.created_at,
  };
}

function toPublicUser(user: StoredUser): PublicUser {
  return { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt };
}

function toAttempt(row: Record<string, unknown>): Attempt {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    kind: row.kind as AttemptKind,
    paperYear: row.paper_year == null ? null : Number(row.paper_year),
    itemKey: String(row.item_key),
    score: row.score == null ? null : Number(row.score),
    maxScore: row.max_score == null ? null : Number(row.max_score),
    correct: row.correct == null ? null : Number(row.correct),
    total: row.total == null ? null : Number(row.total),
    payload: (row.payload as Record<string, unknown>) || {},
    createdAt: String(row.created_at),
  };
}

function toWrong(row: Record<string, unknown>): WrongItem {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    kind: row.kind as AttemptKind,
    paperYear: Number(row.paper_year),
    itemKey: String(row.item_key),
    questionNo: Number(row.question_no),
    payload: (row.payload as Record<string, unknown>) || {},
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at || row.created_at),
  };
}

function toFavorite(row: Record<string, unknown>): FavoriteItem {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    kind: row.kind as AttemptKind,
    paperYear: Number(row.paper_year),
    itemKey: String(row.item_key),
    questionNo: row.question_no == null ? null : Number(row.question_no),
    payload: (row.payload as Record<string, unknown>) || {},
    createdAt: String(row.created_at),
  };
}

export class DbConflictError extends Error {}

export async function createUser(input: {
  email: string;
  name: string;
  passwordHash: string;
}): Promise<StoredUser> {
  const email = input.email.trim().toLowerCase();
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const user: StoredUser = { id, email, name: input.name, passwordHash: input.passwordHash, createdAt };

  if (usingSupabase()) {
    try {
      const rows = (await sb("users", {
        method: "POST",
        body: JSON.stringify({
          id,
          email,
          name: input.name,
          password_hash: input.passwordHash,
          created_at: createdAt,
        }),
      })) as SbUserRow[];
      return toStoredUser(rows[0]);
    } catch (err) {
      if (err instanceof Error && /23505|duplicate|409/.test(err.message)) {
        throw new DbConflictError("EMAIL_EXISTS");
      }
      throw err;
    }
  }

  return serialize(async () => {
    const db = await readLocal();
    if (db.users.some((u) => u.email === email)) throw new DbConflictError("EMAIL_EXISTS");
    db.users.push(user);
    await writeLocal(db);
    return user;
  });
}

export async function findUserByEmail(email: string): Promise<StoredUser | null> {
  const normalized = email.trim().toLowerCase();
  if (usingSupabase()) {
    const rows = (await sb(
      `users?email=eq.${encodeURIComponent(normalized)}&select=*&limit=1`,
    )) as SbUserRow[];
    return rows[0] ? toStoredUser(rows[0]) : null;
  }
  const db = await readLocal();
  return db.users.find((u) => u.email === normalized) ?? null;
}

export async function findUserById(id: string): Promise<StoredUser | null> {
  if (usingSupabase()) {
    const rows = (await sb(`users?id=eq.${encodeURIComponent(id)}&select=*&limit=1`)) as SbUserRow[];
    return rows[0] ? toStoredUser(rows[0]) : null;
  }
  const db = await readLocal();
  return db.users.find((u) => u.id === id) ?? null;
}

export { toPublicUser };

export async function addAttempt(input: AttemptInput): Promise<Attempt> {
  const attempt: Attempt = {
    id: crypto.randomUUID(),
    userId: input.userId,
    kind: input.kind,
    paperYear: input.paperYear,
    itemKey: input.itemKey,
    score: input.score ?? null,
    maxScore: input.maxScore ?? null,
    correct: input.correct ?? null,
    total: input.total ?? null,
    payload: input.payload,
    createdAt: new Date().toISOString(),
  };
  if (usingSupabase()) {
    const rows = (await sb("attempts", {
      method: "POST",
      body: JSON.stringify({
        id: attempt.id,
        user_id: attempt.userId,
        kind: attempt.kind,
        paper_year: attempt.paperYear,
        item_key: attempt.itemKey,
        score: attempt.score,
        max_score: attempt.maxScore,
        correct: attempt.correct,
        total: attempt.total,
        payload: attempt.payload,
        created_at: attempt.createdAt,
      }),
    })) as Record<string, unknown>[];
    return toAttempt(rows[0]);
  }
  return serialize(async () => {
    const db = await readLocal();
    db.attempts.push(attempt);
    await writeLocal(db);
    return attempt;
  });
}

export async function listAttempts(userId: string, limit = 200): Promise<Attempt[]> {
  if (usingSupabase()) {
    const rows = (await sb(
      `attempts?user_id=eq.${encodeURIComponent(userId)}&select=*&order=created_at.desc&limit=${limit}`,
    )) as Record<string, unknown>[];
    return rows.map(toAttempt);
  }
  const db = await readLocal();
  return [...db.attempts]
    .filter((a) => a.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}

export async function addWrongItems(items: WrongInput[]): Promise<void> {
  if (items.length === 0) return;
  const now = new Date().toISOString();
  if (usingSupabase()) {
    const rows = items.map((item) => ({
      id: crypto.randomUUID(),
      user_id: item.userId,
      kind: item.kind,
      paper_year: item.paperYear,
      item_key: item.itemKey,
      question_no: item.questionNo,
      payload: item.payload,
      created_at: now,
      updated_at: now,
    }));
    await sb("wrong_items?on_conflict=user_id,kind,paper_year,item_key,question_no", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(rows),
    });
    return;
  }
  await serialize(async () => {
    const db = await readLocal();
    for (const item of items) {
      const existing = db.wrongItems.find(
        (w) =>
          w.userId === item.userId &&
          w.kind === item.kind &&
          w.paperYear === item.paperYear &&
          w.itemKey === item.itemKey &&
          w.questionNo === item.questionNo,
      );
      if (existing) {
        existing.payload = item.payload;
        existing.updatedAt = now;
      } else {
        db.wrongItems.push({
          id: crypto.randomUUID(),
          ...item,
          createdAt: now,
          updatedAt: now,
        });
      }
    }
    await writeLocal(db);
  });
}

export async function listWrongItems(userId: string): Promise<WrongItem[]> {
  if (usingSupabase()) {
    const rows = (await sb(
      `wrong_items?user_id=eq.${encodeURIComponent(userId)}&select=*&order=updated_at.desc`,
    )) as Record<string, unknown>[];
    return rows.map(toWrong);
  }
  const db = await readLocal();
  return db.wrongItems
    .filter((w) => w.userId === userId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function deleteWrongItem(userId: string, id: string): Promise<void> {
  if (usingSupabase()) {
    await sb(
      `wrong_items?id=eq.${encodeURIComponent(id)}&user_id=eq.${encodeURIComponent(userId)}`,
      { method: "DELETE", headers: { Prefer: "return=minimal" } },
    );
    return;
  }
  await serialize(async () => {
    const db = await readLocal();
    db.wrongItems = db.wrongItems.filter((w) => !(w.id === id && w.userId === userId));
    await writeLocal(db);
  });
}

export async function addFavorite(input: FavoriteInput): Promise<void> {
  const now = new Date().toISOString();
  if (usingSupabase()) {
    await sb("favorites?on_conflict=user_id,kind,paper_year,item_key", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({
        id: crypto.randomUUID(),
        user_id: input.userId,
        kind: input.kind,
        paper_year: input.paperYear,
        item_key: input.itemKey,
        question_no: input.questionNo ?? null,
        payload: input.payload,
        created_at: now,
      }),
    });
    return;
  }
  await serialize(async () => {
    const db = await readLocal();
    if (
      db.favorites.some(
        (f) =>
          f.userId === input.userId &&
          f.kind === input.kind &&
          f.paperYear === input.paperYear &&
          f.itemKey === input.itemKey,
      )
    ) {
      return;
    }
    db.favorites.push({
      id: crypto.randomUUID(),
      userId: input.userId,
      kind: input.kind,
      paperYear: input.paperYear,
      itemKey: input.itemKey,
      questionNo: input.questionNo ?? null,
      payload: input.payload,
      createdAt: now,
    });
    await writeLocal(db);
  });
}

export async function listFavorites(userId: string): Promise<FavoriteItem[]> {
  if (usingSupabase()) {
    const rows = (await sb(
      `favorites?user_id=eq.${encodeURIComponent(userId)}&select=*&order=created_at.desc`,
    )) as Record<string, unknown>[];
    return rows.map(toFavorite);
  }
  const db = await readLocal();
  return db.favorites
    .filter((f) => f.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function deleteFavorite(userId: string, id: string): Promise<void> {
  if (usingSupabase()) {
    await sb(
      `favorites?id=eq.${encodeURIComponent(id)}&user_id=eq.${encodeURIComponent(userId)}`,
      { method: "DELETE", headers: { Prefer: "return=minimal" } },
    );
    return;
  }
  await serialize(async () => {
    const db = await readLocal();
    db.favorites = db.favorites.filter((f) => !(f.id === id && f.userId === userId));
    await writeLocal(db);
  });
}
