import { describe, expect, it } from "vitest";
import { registerSchema, loginSchema, favoriteSchema, wrongSchema } from "@/lib/validation";
import { itemLabel, practiceHref } from "@/lib/labels";

describe("输入校验", () => {
  it("注册时邮箱转小写并去除空格", () => {
    const parsed = registerSchema.parse({
      email: "  Echo@Example.COM ",
      name: " 小 Echo ",
      password: "12345678",
    });
    expect(parsed.email).toBe("echo@example.com");
    expect(parsed.name).toBe("小 Echo");
  });

  it("拒绝过短密码和无效邮箱", () => {
    expect(registerSchema.safeParse({ email: "a@b.com", name: "x", password: "1234567" }).success).toBe(false);
    expect(loginSchema.safeParse({ email: "not-an-email", password: "x" }).success).toBe(false);
  });

  it("错题与收藏必须带年份和题目编号", () => {
    expect(
      wrongSchema.safeParse({
        items: [{ kind: "reading", paperYear: 2024, itemKey: "reading-text-1", questionNo: 21, payload: {} }],
      }).success,
    ).toBe(true);
    expect(
      favoriteSchema.safeParse({ kind: "reading", paperYear: 2024, itemKey: "reading-text-1" }).success,
    ).toBe(true);
    expect(favoriteSchema.safeParse({ kind: "reading", itemKey: "reading-text-1" }).success).toBe(false);
  });
});

describe("题干与跳转标签", () => {
  it("生成人类可读的题目名称", () => {
    expect(itemLabel("reading", "reading-text-2")).toBe("阅读 Text 2");
    expect(itemLabel("cloze", "cloze")).toBe("完形填空");
    expect(itemLabel("writing", "writing-part-A")).toBe("小作文 Part A");
    expect(itemLabel("mock", "mock-objective")).toBe("模拟考试 · 客观题");
  });

  it("跳转到对应练习页", () => {
    expect(practiceHref("reading", 2024, "reading-text-3")).toBe("/practice/reading?year=2024&text=3");
    expect(practiceHref("cloze", 2021, "cloze")).toBe("/practice/cloze?year=2021");
    expect(practiceHref("translation", 2020, "translation")).toBe("/practice/translation?year=2020");
    expect(practiceHref("writing", 2020, "writing-part-B")).toBe("/practice/writing?year=2020&part=B");
    expect(practiceHref("mock", 2020, "mock-objective")).toBe("/mock?year=2020");
    expect(practiceHref("ask", null, "ask")).toBe("/ask");
  });
});
