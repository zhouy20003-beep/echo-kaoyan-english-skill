import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { findUserById, toPublicUser } from "@/lib/db";
import { SESSION_COOKIE, SESSION_DAYS, signSession, verifySession } from "@/lib/session";
import type { PublicUser } from "@/lib/types";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function startSession(user: { id: string; email: string }): Promise<void> {
  const token = await signSession({ sub: user.id, email: user.email });
  const store = await cookies();
  store.set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function endSession(): Promise<void> {
  const store = await cookies();
  store.set({
    name: SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function getCurrentUser(): Promise<PublicUser | null> {
  const store = await cookies();
  const session = await verifySession(store.get(SESSION_COOKIE)?.value);
  if (!session) return null;
  const user = await findUserById(session.sub);
  if (!user) return null;
  return toPublicUser(user);
}

export async function requireUser(): Promise<PublicUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}
