"use client";

import { useState } from "react";
import { BookOpen, Eraser, PenLine, Sparkles } from "lucide-react";
import { postJson } from "@/lib/client";
import { addAttempt } from "@/lib/local-store";
import type { ModelEssayResult, WritingResult } from "@/lib/ai-schemas";
import { AiErrorNotice, SuccessHint, WritingAiView } from "@/components/ai/AiViews";
import FavoriteButton from "@/components/practice/FavoriteButton";

export default function WritingPractice({
  year,
  part,
  task,
  material,
}: {
  year: number;
  part: "A" | "B";
  task: string;
  material: string;
}) {
  const [essay, setEssay] = useState("");
  const [loading, setLoading] = useState<"grade" | "model" | null>(null);
  const [result, setResult] = useState<WritingResult | null>(null);
  const [model, setModel] = useState<ModelEssayResult | null>(null);
  const [error, setError] = useState("");
  const [saveMsg, setSaveMsg] = useState("");

  const maxScore = part === "A" ? 10 : 15;
  const target = part === "A" ? 100 : 150;
  const words = essay.trim() ? essay.trim().split(/\s+/).filter(Boolean).length : 0;

  async function grade() {
    if (loading) return;
    if (essay.trim().length < 30) {
      setError("作文太短，先认真写完再提交批改。");
      return;
    }
    setLoading("grade");
    setError("");
    setSaveMsg("");
    setModel(null);
    try {
      const data = await postJson<{ result: WritingResult }>("/api/ai/writing", {
        year,
        part,
        mode: "grade",
        essay,
      });
      setResult(data.result);
      addAttempt({
        kind: "writing",
        paperYear: year,
        itemKey: `writing-part-${part}`,
        score: data.result.score,
        maxScore,
        payload: { part, essay: essay.slice(0, 1500) },
      });
      setSaveMsg(`已保存本次成绩：${data.result.score} / ${maxScore} 分（记录保存在本机浏览器）`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "批改失败，请重试");
    } finally {
      setLoading(null);
    }
  }

  async function generateModel() {
    if (loading) return;
    setLoading("model");
    setError("");
    setResult(null);
    try {
      const data = await postJson<{ result: ModelEssayResult }>("/api/ai/writing", {
        year,
        part,
        mode: "model",
      });
      setModel(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "范文生成失败，请重试");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="card p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-[15px] font-bold text-ink">
            Section IV Writing · Part {part} {part === "A" ? "小作文" : "大作文"}
          </h2>
          <div className="flex items-center gap-2">
            <span className="chip">{maxScore} 分 · 约 {target} 词</span>
            <FavoriteButton
              kind="writing"
              year={year}
              itemKey={`writing-part-${part}`}
              payload={{ part, task, material }}
              label="收藏题目"
            />
          </div>
        </div>
        <p className="mt-3 whitespace-pre-line text-[14px] leading-7 text-slate-700">{task}</p>
        {material && (
          <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
            <p className="mb-2 text-[11.5px] font-semibold uppercase tracking-wide text-ink-muted">
              图表 / 材料信息
            </p>
            <p className="whitespace-pre-line font-serif text-[13.5px] leading-7 text-slate-700">{material}</p>
          </div>
        )}
      </div>

      <div className="card p-5">
        <div className="mb-2 flex items-center justify-between">
          <label htmlFor="essay-input" className="text-[14px] font-bold text-ink">你的作文</label>
          <span className={`text-[12px] ${words > target * 1.5 ? "text-amber-600" : "text-ink-muted"}`}>
            {words} 词 / 建议约 {target} 词
          </span>
        </div>
        <textarea
          id="essay-input"
          value={essay}
          onChange={(e) => setEssay(e.target.value)}
          placeholder="在这里输入英文作文。小作文注意称呼、正文与署名；大作文注意图表描述、原因分析与评论…"
          className="textarea min-h-[260px] font-serif text-[15px] leading-7"
          maxLength={6000}
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button type="button" onClick={grade} disabled={loading !== null} className="btn-primary">
            <Sparkles size={16} /> {loading === "grade" ? "AI 正在按档位批改…" : "AI 批改作文"}
          </button>
          <button type="button" onClick={generateModel} disabled={loading !== null} className="btn btn-outline">
            <BookOpen size={15} /> {loading === "model" ? "生成中…" : "生成参考范文"}
          </button>
          <button
            type="button"
            onClick={() => {
              setEssay("");
              setResult(null);
              setModel(null);
              setError("");
              setSaveMsg("");
            }}
            className="btn btn-ghost btn-sm"
          >
            <Eraser size={14} /> 清空
          </button>
        </div>
        {error && <AiErrorNotice message={error} />}
        {saveMsg && <SuccessHint text={saveMsg} />}
      </div>

      {result && (
        <div className="card p-5">
          <h3 className="text-[15px] font-bold text-ink">AI 批改结果</h3>
          <WritingAiView result={result} />
        </div>
      )}

      {model && (
        <div className="card p-5">
          <h3 className="flex items-center gap-1.5 text-[15px] font-bold text-ink">
            <PenLine size={16} className="text-brand-600" /> 参考范文与写作结构
          </h3>
          <WritingAiView model={model} />
        </div>
      )}
    </div>
  );
}
