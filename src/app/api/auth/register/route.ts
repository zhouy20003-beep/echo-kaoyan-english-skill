import type { NextRequest } from "next/server";
import { createUser, DbConflictError, findUserByEmail, toPublicUser } from "@/lib/db";
import { hashPassword, startSession } from "@/lib/auth";
import { registerSchema } from "@/lib/validation";
import { error, handleError, json } from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = registerSchema.parse(body);
    const existing = await findUserByEmail(input.email);
    if (existing) return error("该邮箱已注册，请直接登录", 409, "EMAIL_EXISTS");
    const passwordHash = await hashPassword(input.password);
    const user = await createUser({ email: input.email, name: input.name, passwordHash });
    await startSession(user);
    return json({ user: toPublicUser(user) }, 201);
  } catch (err) {
    if (err instanceof DbConflictError) {
      return error("该邮箱已注册，请直接登录", 409, "EMAIL_EXISTS");
    }
    return handleError(err);
  }
}
