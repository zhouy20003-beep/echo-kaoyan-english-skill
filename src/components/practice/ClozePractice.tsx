"use client";

import { useMemo, useState } from "react";
import { Bot, ChevronLeft, ChevronRight, RotateCcw, Sparkles, X } from "lucide-react";
import { postJson } from "@/lib/client";
import { addAttempt, addWrongItems } from "@/lib/local-store";
import type { ClozeQuestion } from "@/lib/types";
import type { ClozeResult } from "@/lib/ai-schemas";
import { AiErrorNotice, ClozeAiView, SuccessHint } from "@/components/ai/AiViews";

interface Props {
  year: number;
  passage: string;
  questions: ClozeQuestion[];
}

export default function ClozePractice({ year, passage, questions }: Props) {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [ai, setAi] = useState<Record<number, { loading: boolean; data?: ClozeResult; error?: string }>>({});
  const [activeNo, setActiveNo] = useState<number | null>(null);

  const correctCount = useMemo(
    () => questions.filter((q) => answers[q.no] === q.answer).length,
    [answers, questions],
  );
  const answeredCount = Object.keys(answers).length;

  const activeIndex = activeNo === null ? -1 : questions.findIndex((q) => q.no === activeNo);
  const active = activeIndex >= 0 ? questions[activeIndex] : null;

  function submit() {
    if (submitted) return;
    setSubmitted(true);
    setSaveMsg("");
    setActiveNo(null);
    const wrong = questions.filter((q) => answers[q.no] !== q.answer);
    addAttempt({
      kind: "cloze",
      paperYear: year,
      itemKey: "cloze",
      correct: questions.length - wrong.length,
      total: questions.length,
      payload: { answers },
    });
    if (wrong.length > 0) {
      addWrongItems(
        wrong.map((q) => ({
          kind: "cloze" as const,
          paperYear: year,
          itemKey: "cloze",
          questionNo: q.no,
          payload: { options: q.options, correct: q.answer, userAnswer: answers[q.no] || null },
        })),
      );
      setSaveMsg("成绩已保存到本机浏览器，错题已自动加入错题本");
    } else {
      setSaveMsg("全部答对！成绩已保存到本机浏览器");
    }
  }

  async function askAi(q: ClozeQuestion) {
    setAi((prev) => ({ ...prev, [q.no]: { loading: true } }));
    try {
      const data = await postJson<{ result: ClozeResult }>("/api/ai/cloze", {
        year,
        questionNo: q.no,
        userAnswer: answers[q.no],
      });
      setAi((prev) => ({ ...prev, [q.no]: { loading: false, data: data.result } }));
    } catch (err) {
      setAi((prev) => ({
        ...prev,
        [q.no]: { loading: false, error: err instanceof Error ? err.message : "AI 调用失败" },
      }));
    }
  }

  function reset() {
    setAnswers({});
    setSubmitted(false);
    setAi({});
    setSaveMsg("");
    setActiveNo(null);
  }

  function choose(letter: string) {
    if (!active || submitted) return;
    setAnswers((prev) => ({ ...prev, [active.no]: letter }));
    const next = questions[activeIndex + 1];
    setActiveNo(next ? next.no : null);
  }

  function goBlank(delta: number) {
    if (activeIndex < 0) return;
    const target = questions[activeIndex + delta];
    if (target) setActiveNo(target.no);
  }

  const parts = passage.split(/\{\{(\d+)\}\}/g);

  return (
    <div className="space-y-3">
      {/* 原文：空格可直接点选 */}
      <div className="card px-4 py-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-[14px] font-bold text-ink">Section I Use of English</h2>
          <span className="text-[11.5px] text-ink-muted">点空格直接选答案 · 20 空 · 每空 0.5 分</span>
        </div>
        <div className="max-h-[46vh] overflow-y-auto overscroll-contain lg:max-h-[58vh]">
          <p className="passage">
            {parts.map((part, i) => {
              if (i % 2 === 0) return <span key={i}>{part}</span>;
              const no = Number(part);
              const picked = answers[no];
              const isRight = submitted && picked === questions.find((q) => q.no === no)?.answer;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveNo(no)}
                  className={`mx-0.5 inline-flex min-w-[40px] items-center justify-center rounded-md px-1.5 py-0.5 align-baseline text-[11.5px] font-bold transition ${
                    submitted
                      ? isRight
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-rose-100 text-rose-800"
                      : picked
                        ? "bg-brand-100 text-brand-800 ring-1 ring-brand-300"
                        : "bg-slate-100 text-slate-500 ring-1 ring-slate-200"
                  }`}
                >
                  {no}
                  {picked ? `·${picked}` : ""}
                </button>
              );
            })}
          </p>
        </div>
      </div>

      {/* 答题卡 */}
      <div className="card px-4 py-4">
        <div className="mb-2.5 flex items-center justify-between">
          <span className="text-[13.5px] font-bold text-ink">答题卡</span>
          <span className="text-[12px] text-ink-muted">已作答 {answeredCount} / {questions.length}</span>
        </div>
        <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
          {questions.map((q) => {
            const picked = answers[q.no];
            const isRight = picked === q.answer;
            return (
              <button
                key={q.no}
                type="button"
                onClick={() => setActiveNo(q.no)}
                className={`flex h-10 flex-col items-center justify-center rounded-lg border text-[11px] font-bold transition ${
                  submitted
                    ? isRight
                      ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                      : "border-rose-300 bg-rose-50 text-rose-700"
                    : picked
                      ? "border-brand-300 bg-brand-50 text-brand-700"
                      : "border-slate-200 bg-white text-ink-muted"
                }`}
              >
                <span>{q.no}</span>
                <span className="text-[10px] opacity-80">{picked ?? "—"}</span>
              </button>
            );
          })}
        </div>
      </div>

      {submitted && (
        <div className="card flex flex-wrap items-center justify-between gap-3 border-brand-100 bg-brand-50/50 px-4 py-3">
          <div>
            <p className="text-[13.5px] font-semibold text-brand-900">
              答对 {correctCount} / {questions.length} 空 · {(correctCount * 0.5).toFixed(1)} / 10 分
            </p>
            <p className="mt-1 text-[11.5px] leading-5 text-ink-muted">
              答案：{questions.map((q) => `${q.no}${q.answer}`).join(" ")}
            </p>
          </div>
          <button type="button" onClick={reset} className="btn btn-outline btn-sm shrink-0">
            <RotateCcw size={14} /> 重做
          </button>
        </div>
      )}

      {/* 底部操作条 */}
      <div className="sticky bottom-20 z-10 lg:bottom-4">
        <div className="card flex items-center justify-between gap-2 bg-white/95 p-2.5 backdrop-blur">
          <button
            type="button"
            onClick={() => setActiveNo(questions[0]?.no ?? null)}
            disabled={questions.length === 0}
            className="btn btn-outline btn-sm shrink-0"
          >
            开始作答
          </button>
          <span className="text-[12px] text-ink-muted">
            {answeredCount} / {questions.length}
          </span>
          <button
            type="button"
            onClick={submit}
            disabled={submitted || answeredCount === 0}
            className="btn-primary btn-sm shrink-0"
          >
            <Bot size={15} /> 提交
          </button>
        </div>
        {saveMsg && <SuccessHint text={saveMsg} />}
      </div>

      {/* 点空格弹出的选项面板 */}
      {active && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={() => setActiveNo(null)}>
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]" />
          <div
            className="relative max-h-[80vh] overflow-y-auto rounded-t-2xl border-t border-slate-200 bg-white px-4 pt-3 shadow-float"
            style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[15px] font-bold text-ink">第 {active.no} 空</span>
                {submitted && (
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10.5px] font-bold ${
                      answers[active.no] === active.answer
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-rose-50 text-rose-700"
                    }`}
                  >
                    {answers[active.no] === active.answer ? "正确" : `正确答案 ${active.answer}`}
                  </span>
                )}
              </div>
              <button type="button" onClick={() => setActiveNo(null)} className="rounded-lg p-2 text-ink-muted">
                <X size={18} />
              </button>
            </div>

            <div className="grid gap-2">
              {Object.entries(active.options).map(([letter, text]) => {
                const picked = answers[active.no];
                const isAnswer = submitted && letter === active.answer;
                const isWrong = submitted && picked === letter && picked !== active.answer;
                return (
                  <button
                    key={letter}
                    type="button"
                    disabled={submitted}
                    onClick={() => choose(letter)}
                    className={`answer-option flex items-center gap-2.5 ${
                      isAnswer
                        ? "answer-option-correct"
                        : isWrong
                          ? "answer-option-wrong"
                          : picked === letter
                            ? "answer-option-active"
                            : ""
                    }`}
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/80 text-[11.5px] font-bold ring-1 ring-slate-200">
                      {letter}
                    </span>
                    <span>{text}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-3 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => goBlank(-1)}
                disabled={activeIndex <= 0}
                className="btn btn-outline btn-sm"
              >
                <ChevronLeft size={15} /> 上一空
              </button>
              <button
                type="button"
                onClick={() => goBlank(1)}
                disabled={activeIndex >= questions.length - 1}
                className="btn btn-outline btn-sm"
              >
                下一空 <ChevronRight size={15} />
              </button>
            </div>

            {submitted && (
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => askAi(active)}
                  disabled={ai[active.no]?.loading}
                  className="btn btn-soft btn-sm w-full"
                >
                  <Sparkles size={14} />
                  {ai[active.no]?.loading ? "AI 解析中…" : "AI 逐空解析"}
                </button>
                {ai[active.no]?.error && <AiErrorNotice message={ai[active.no].error!} />}
                {ai[active.no]?.data && <ClozeAiView result={ai[active.no].data!} />}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
