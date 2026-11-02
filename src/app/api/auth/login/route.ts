import type { NextRequest } from "next/server";
import { findUserByEmail, toPublicUser } from "@/lib/db";
import { startSession, verifyPassword } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";
import { error, handleError, json } from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const input = loginSchema.parse(await req.json());
    const user = await findUserByEmail(input.email);
    if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
      return error("邮箱或密码不正确", 401, "INVALID_CREDENTIALS");
    }
    await startSession(user);
    return json({ user: toPublicUser(user) });
  } catch (err) {
    return handleError(err);
  }
}
