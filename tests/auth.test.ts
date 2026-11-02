import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth";

describe("密码哈希", () => {
  it("使用 bcrypt 哈希，不保存明文", async () => {
    const hash = await hashPassword("echo-123456");
    expect(hash).not.toBe("echo-123456");
    expect(hash.startsWith("$2")).toBe(true);
  });

  it("正确密码通过、错误密码失败", async () => {
    const hash = await hashPassword("echo-123456");
    expect(await verifyPassword("echo-123456", hash)).toBe(true);
    expect(await verifyPassword("wrong-password", hash)).toBe(false);
  });
});
