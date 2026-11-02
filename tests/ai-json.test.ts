import { describe, expect, it } from "vitest";
import { extractJson } from "@/lib/deepseek";

describe("AI JSON 解析", () => {
  it("解析纯 JSON", () => {
    expect(extractJson('{"score": 12, "comments": []}')).toEqual({ score: 12, comments: [] });
  });

  it("解析带 ```json 代码块的输出", () => {
    const raw = '```json\n{"answer": "A", "analysis": "定位句"}\n```';
    expect(extractJson(raw)).toMatchObject({ answer: "A" });
  });

  it("忽略 JSON 前后的多余文字", () => {
    const raw = '好的，以下是结果：\n{"score": 8}\n希望对你有帮助。';
    expect(extractJson(raw)).toEqual({ score: 8 });
  });

  it("非法内容抛出错误", () => {
    expect(() => extractJson("抱歉，我无法回答。")).toThrow();
    expect(() => extractJson("{broken}")).toThrow();
  });
});
