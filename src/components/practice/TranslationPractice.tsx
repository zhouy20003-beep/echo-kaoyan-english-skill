"use client";

import { useState } from "react";
import { ChevronDown, Eraser, Languages, Sparkles } from "lucide-react";
import { postJson } from "@/lib/client";
import { addAttempt } from "@/lib/local-store";
import type { TranslationResult } from "@/lib/ai-schemas";
import { AiErrorNotice, SuccessHint, TranslationAiView } from "@/components/ai/AiViews";
import FavoriteButton from "@/components/practice/FavoriteButton";

export default function TranslationPractice({
  year,
  source,
  reference,
}: {
  year: number;
  source: string;
  reference: string;
}) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [error, setError] = useState("");
  const [saveMsg, setSaveMsg] = useState("");
  const [showReference, setShowReference] = useState(false);

  const charCount = text.replace(/\s/g, "").length;
  const paragraphs = source.split("\n\n");

  async function grade() {
    if (loading) return;
    if (text.trim().length < 10) {
      setError("译文太短，先写一点再提交批改。");
      return;
    }
    setLoading(true);
    setError("");
    setSaveMsg("");
    try {
      const data = await postJson<{ result: TranslationResult }>("/api/ai/translation", {
        year,
        userTranslation: text,
      });
      setResult(data.result);
      addAttempt({
        kind: "translation",
        paperYear: year,
        itemKey: "translation",
        score: data.result.score,
        maxScore: 15,
        payload: { translation: text.slice(0, 1200) },
      });
      setSaveMsg(`已保存本次成绩：${data.result.score} / 15 分（记录保存在本机浏览器）`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "批改失败，请重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="card p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-[15px] font-bold text-ink">Section III Translation · 第 46 题</h2>
          <div className="flex items-center gap-2">
            <span className="chip">15 分</span>
            <FavoriteButton
              kind="translation"
              year={year}
              itemKey="translation"
              payload={{ source, reference }}
              label="收藏本题"
            />
          </div>
        </div>
        <div className="mt-3 space-y-3">
          {paragraphs.map((p, i) => (
            <p key={i} className="passage">{p}</p>
          ))}
        </div>
      </div>

      <div className="card p-5">
        <div className="mb-2 flex items-center justify-between">
          <label htmlFor="translation-input" className="text-[14px] font-bold text-ink">你的译文</label>
          <span className="text-[12px] text-ink-muted">{charCount} 字</span>
        </div>
        <textarea
          id="translation-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="在这里输入你的中文译文，尽量写成完整、通顺的句子…"
          className="textarea min-h-[190px]"
          maxLength={4000}
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button type="button" onClick={grade} disabled={loading} className="btn-primary">
            <Sparkles size={16} /> {loading ? "AI 正在按采分点批改…" : "AI 批改译文"}
          </button>
          <button
            type="button"
            onClick={() => setShowReference((v) => !v)}
            className="btn btn-outline btn-sm"
          >
            <Languages size={14} /> {showReference ? "收起参考译文" : "查看参考译文"}
          </button>
          <button
            type="button"
            onClick={() => {
              setText("");
              setResult(null);
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

      {showReference && reference && (
        <div className="card border-sky-100 bg-sky-50/50 p-5">
          <p className="flex items-center gap-1.5 text-[13px] font-bold text-sky-800">
            <ChevronDown size={14} /> Echo 参考译文（非官方）
          </p>
          <p className="mt-2 text-[14px] leading-7 text-slate-700">{reference}</p>
        </div>
      )}

      {result && (
        <div className="card p-5">
          <h3 className="text-[15px] font-bold text-ink">AI 批改结果</h3>
          <TranslationAiView result={result} />
        </div>
      )}
    </div>
  );
}
