"use client";

import { useMemo, useState } from "react";
import {
  Bot,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { postJson } from "@/lib/client";
import { addAttempt, addWrongItems } from "@/lib/local-store";
import type { ReadingQuestion } from "@/lib/types";
import type { ReadingResult } from "@/lib/ai-schemas";
import { AiErrorNotice, ReadingAiView, SuccessHint } from "@/components/ai/AiViews";
import FavoriteButton from "@/components/practice/FavoriteButton";

interface Props {
  year: number;
  textNo: number;
  paragraphs: string[];
  questions: ReadingQuestion[];
}

export default function ReadingPractice({ year, textNo, paragraphs, questions }: Props) {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [ai, setAi] = useState<Record<number, { loading: boolean; data?: ReadingResult; error?: string }>>({});
  const [activeIndex, setActiveIndex] = useState(0);
  const [passageOpen, setPassageOpen] = useState(true);

  const total = questions.length;
  const q = questions[Math.min(activeIndex, total - 1)];
  const chosen = answers[q.no];
  const right = chosen === q.answer;

  const correctCount = useMemo(
    () => questions.filter((item) => answers[item.no] === item.answer).length,
    [answers, questions],
  );
  const answeredCount = Object.keys(answers).length;

  function submit() {
    if (submitted) return;
    setSubmitted(true);
    setSaveMsg("");
    const wrong = questions.filter((item) => answers[item.no] !== item.answer);
    addAttempt({
      kind: "reading",
      paperYear: year,
      itemKey: `reading-text-${textNo}`,
      correct: questions.length - wrong.length,
      total: questions.length,
      payload: { answers, textNo },
    });
    if (wrong.length > 0) {
      addWrongItems(
        wrong.map((item) => ({
          kind: "reading" as const,
          paperYear: year,
          itemKey: `reading-text-${textNo}`,
          questionNo: item.no,
          payload: {
            stem: item.stem,
            options: item.options,
            correct: item.answer,
            userAnswer: answers[item.no] || null,
            textNo,
          },
        })),
      );
      setSaveMsg("成绩已保存到本机浏览器，错题已自动加入错题本");
    } else {
      setSaveMsg("全部答对！成绩已保存到本机浏览器");
    }
  }

  async function askAi(item: ReadingQuestion) {
    setAi((prev) => ({ ...prev, [item.no]: { loading: true } }));
    try {
      const data = await postJson<{ result: ReadingResult }>("/api/ai/reading", {
        year,
        textNo,
        questionNo: item.no,
        userAnswer: answers[item.no],
      });
      setAi((prev) => ({ ...prev, [item.no]: { loading: false, data: data.result } }));
    } catch (err) {
      setAi((prev) => ({
        ...prev,
        [item.no]: { loading: false, error: err instanceof Error ? err.message : "AI 调用失败" },
      }));
    }
  }

  function reset() {
    setAnswers({});
    setSubmitted(false);
    setAi({});
    setSaveMsg("");
    setActiveIndex(0);
  }

  function go(delta: number) {
    setActiveIndex((i) => Math.max(0, Math.min(total - 1, i + delta)));
  }

  return (
    <div className="space-y-3">
      {/* 原文：可折叠，内部独立滚动 */}
      <div className="card overflow-hidden">
        <button
          type="button"
          onClick={() => setPassageOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
        >
          <span className="flex min-w-0 items-center gap-2">
            <span className="text-[14px] font-bold text-ink">Reading Text {textNo}</span>
            <span className="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-ink-muted">
              {total} 题
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-1 text-[12.5px] font-semibold text-brand-600">
            {passageOpen ? "收起原文" : "展开原文"}
            {passageOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </span>
        </button>
        {passageOpen && (
          <div className="max-h-[38vh] overflow-y-auto overscroll-contain border-t border-slate-100 px-4 py-3.5 lg:max-h-[52vh]">
            <div className="space-y-3.5">
              {paragraphs.map((p, i) => (
                <p key={i} className="passage">
                  <span className="mr-1.5 align-super text-[10px] font-bold text-brand-500">P{i + 1}</span>
                  {p}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>

      {submitted && (
        <div className="card flex items-center justify-between gap-3 border-brand-100 bg-brand-50/50 px-4 py-3">
          <p className="text-[13.5px] font-semibold text-brand-900">
            答对 {correctCount} / {total} 题 · {correctCount * 2} / {total * 2} 分
          </p>
          <button type="button" onClick={reset} className="btn btn-outline btn-sm shrink-0">
            <RotateCcw size={14} /> 重做
          </button>
        </div>
      )}

      {/* 当前题：一次只显示一题 */}
      <div className="card p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2">
          <p className="flex-1 text-[14.5px] font-semibold leading-6 text-ink">
            <span className="mr-1.5 text-brand-600">{q.no}.</span>
            {q.stem}
          </p>
          <div className="flex shrink-0 items-center gap-1.5">
            {submitted && (
              <span
                className={`rounded-md px-2 py-1 text-[11px] font-bold ${
                  right ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                }`}
              >
                {right ? "正确" : "错误"}
              </span>
            )}
            <FavoriteButton
              kind="reading"
              year={year}
              itemKey={`reading-text-${textNo}-q${q.no}`}
              questionNo={q.no}
              payload={{ stem: q.stem, options: q.options, answer: q.answer, textNo }}
            />
          </div>
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {Object.entries(q.options).map(([letter, text]) => {
            const active = chosen === letter;
            const isAnswer = submitted && letter === q.answer;
            const isWrong = submitted && active && !right;
            return (
              <button
                key={letter}
                type="button"
                disabled={submitted}
                onClick={() => setAnswers((prev) => ({ ...prev, [q.no]: letter }))}
                className={`answer-option flex items-start gap-2.5 ${
                  isAnswer
                    ? "answer-option-correct"
                    : isWrong
                      ? "answer-option-wrong"
                      : active
                        ? "answer-option-active"
                        : ""
                }`}
              >
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-white/80 text-[11px] font-bold ring-1 ring-slate-200">
                  {letter}
                </span>
                <span>{text}</span>
                {active && !submitted && <Check size={15} className="ml-auto mt-0.5 shrink-0 text-brand-600" />}
              </button>
            );
          })}
        </div>

        {submitted && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-[12.5px] text-ink-muted">
              正确答案：<span className="font-bold text-emerald-700">{q.answer}</span>
            </span>
            <button type="button" onClick={() => askAi(q)} disabled={ai[q.no]?.loading} className="btn btn-soft btn-sm">
              <Sparkles size={14} />
              {ai[q.no]?.loading ? "AI 解析中…" : "AI 逐题解析"}
            </button>
          </div>
        )}

        {ai[q.no]?.error && <AiErrorNotice message={ai[q.no].error!} />}
        {ai[q.no]?.data && <ReadingAiView result={ai[q.no].data!} />}
      </div>

      {/* 题号导航 */}
      <div className="no-scrollbar flex items-center justify-center gap-2 overflow-x-auto">
        {questions.map((item, i) => {
          const picked = answers[item.no];
          const isCurrent = i === activeIndex;
          const tone = submitted
            ? picked === item.answer
              ? "border-emerald-300 bg-emerald-50 text-emerald-700"
              : "border-rose-300 bg-rose-50 text-rose-700"
            : picked
              ? "border-brand-300 bg-brand-50 text-brand-700"
              : "border-slate-200 bg-white text-ink-muted";
          return (
            <button
              key={item.no}
              type="button"
              onClick={() => setActiveIndex(i)}
              className={`h-9 w-9 shrink-0 rounded-lg border text-[13px] font-bold transition ${tone} ${
                isCurrent ? "ring-2 ring-brand-300" : ""
              }`}
            >
              {item.no}
            </button>
          );
        })}
      </div>

      {/* 底部操作条 */}
      <div className="sticky bottom-20 z-10 lg:bottom-4">
        <div className="card flex items-center justify-between gap-2 bg-white/95 p-2.5 backdrop-blur">
          <button
            type="button"
            onClick={() => go(-1)}
            disabled={activeIndex === 0}
            className="btn btn-outline btn-sm shrink-0"
          >
            <ChevronLeft size={15} /> 上一题
          </button>

          {submitted ? (
            <button type="button" onClick={reset} className="btn-primary btn-sm min-w-[104px]">
              <RotateCcw size={15} /> 重新作答
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={answeredCount === 0}
              className="btn-primary btn-sm min-w-[104px]"
            >
              <Bot size={15} /> 提交（{answeredCount}/{total}）
            </button>
          )}

          <button
            type="button"
            onClick={() => go(1)}
            disabled={activeIndex === total - 1}
            className="btn btn-outline btn-sm shrink-0"
          >
            下一题 <ChevronRight size={15} />
          </button>
        </div>
        {saveMsg && <SuccessHint text={saveMsg} />}
      </div>
    </div>
  );
}
