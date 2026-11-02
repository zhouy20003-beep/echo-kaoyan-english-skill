import { afterEach, describe, expect, it } from "vitest";
import { signSession, verifySession, SESSION_DAYS } from "@/lib/session";

const ORIGINAL = process.env.AUTH_SECRET;

afterEach(() => {
  if (ORIGINAL === undefined) delete process.env.AUTH_SECRET;
  else process.env.AUTH_SECRET = ORIGINAL;
});

describe("登录会话 JWT", () => {
  it("可以签发并校验会话", async () => {
    process.env.AUTH_SECRET = "test-secret-for-echo-session-0123456789";
    const token = await signSession({ sub: "user-1", email: "a@b.com" });
    const payload = await verifySession(token);
    expect(payload).toEqual({ sub: "user-1", email: "a@b.com" });
    expect(SESSION_DAYS).toBe(30);
  });

  it("空 token 或伪造 token 返回 null", async () => {
    process.env.AUTH_SECRET = "test-secret-for-echo-session-0123456789";
    expect(await verifySession(undefined)).toBeNull();
    expect(await verifySession("not-a-jwt")).toBeNull();
    expect(await verifySession("")).toBeNull();
  });

  it("更换密钥后旧 token 失效", async () => {
    process.env.AUTH_SECRET = "first-secret-value-0123456789abcdef";
    const token = await signSession({ sub: "user-1", email: "a@b.com" });
    process.env.AUTH_SECRET = "second-secret-value-0123456789abcdef";
    expect(await verifySession(token)).toBeNull();
  });
});
