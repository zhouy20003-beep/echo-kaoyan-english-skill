"use client";

import { useMemo, useState } from "react";
import { Bot, Check, RotateCcw, Sparkles } from "lucide-react";
import { postJson } from "@/lib/client";
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
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [ai, setAi] = useState<Record<number, { loading: boolean; data?: ReadingResult; error?: string }>>({});

  const correctCount = useMemo(
    () => questions.filter((q) => answers[q.no] === q.answer).length,
    [answers, questions],
  );
  const answeredCount = Object.keys(answers).length;

  async function submit() {
    if (saving) return;
    setSubmitted(true);
    setSaving(true);
    setSaveMsg("");
    const wrong = questions.filter((q) => answers[q.no] !== q.answer);
    try {
      await postJson("/api/records", {
        kind: "reading",
        paperYear: year,
        itemKey: `reading-text-${textNo}`,
        correct: questions.length - wrong.length,
        total: questions.length,
        payload: { answers, textNo },
      });
      if (wrong.length > 0) {
        await postJson("/api/wrong", {
          items: wrong.map((q) => ({
            kind: "reading",
            paperYear: year,
            itemKey: `reading-text-${textNo}`,
            questionNo: q.no,
            payload: {
              stem: q.stem,
              options: q.options,
              correct: q.answer,
              userAnswer: answers[q.no] || null,
              textNo,
            },
          })),
        });
      }
      setSaveMsg("成绩已保存，错题已自动加入错题本");
    } catch (err) {
      setSaveMsg(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  async function askAi(q: ReadingQuestion) {
    setAi((prev) => ({ ...prev, [q.no]: { loading: true } }));
    try {
      const data = await postJson<{ result: ReadingResult }>("/api/ai/reading", {
        year,
        textNo,
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
  }

  return (
    <div className="space-y-5">
      <div className="card p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-[15px] font-bold text-ink">Reading Text {textNo}</h2>
          <span className="text-[12px] text-ink-muted">第 {questions[0]?.no}–{questions[questions.length - 1]?.no} 题 · 每题 2 分</span>
        </div>
        <div className="space-y-3.5">
          {paragraphs.map((p, i) => (
            <p key={i} className="passage">
              <span className="mr-1.5 align-super text-[10px] font-bold text-brand-500">P{i + 1}</span>
              {p}
            </p>
          ))}
        </div>
      </div>

      {submitted && (
        <div className="card flex flex-wrap items-center justify-between gap-3 border-brand-100 bg-brand-50/50 p-4">
          <p className="text-[14px] font-semibold text-brand-900">
            答对 {correctCount} / {questions.length} 题，得分 {correctCount * 2} / {questions.length * 2} 分
          </p>
          <button type="button" onClick={reset} className="btn btn-outline btn-sm">
            <RotateCcw size={14} /> 重新作答
          </button>
        </div>
      )}

      <div className="space-y-3">
        {questions.map((q) => {
          const chosen = answers[q.no];
          const right = chosen === q.answer;
          return (
            <div key={q.no} className="card p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="flex-1 text-[14.5px] font-semibold leading-6 text-ink">
                  <span className="mr-1.5 text-brand-600">{q.no}.</span>
                  {q.stem}
                </p>
                <div className="flex items-center gap-1.5">
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
                  <button
                    type="button"
                    onClick={() => askAi(q)}
                    disabled={ai[q.no]?.loading}
                    className="btn btn-soft btn-sm"
                  >
                    <Sparkles size={14} />
                    {ai[q.no]?.loading ? "AI 解析中…" : "AI 逐题解析"}
                  </button>
                </div>
              )}

              {ai[q.no]?.error && <AiErrorNotice message={ai[q.no].error!} />}
              {ai[q.no]?.data && <ReadingAiView result={ai[q.no].data!} />}
            </div>
          );
        })}
      </div>

      <div className="sticky bottom-20 z-10 lg:bottom-4">
        <div className="card flex flex-wrap items-center justify-between gap-3 bg-white/95 p-3.5 backdrop-blur">
          <p className="text-[13px] text-ink-muted">
            已作答 {answeredCount} / {questions.length} 题{submitted ? ` · 答对 ${correctCount} 题` : ""}
          </p>
          <div className="flex items-center gap-2">
            <button type="button" onClick={submit} disabled={submitted || answeredCount === 0 || saving} className="btn-primary">
              <Bot size={16} /> {saving ? "保存中…" : "提交答案"}
            </button>
          </div>
        </div>
        {saveMsg && <SuccessHint text={saveMsg} />}
      </div>
    </div>
  );
}
