"use client";

import { useMemo, useState } from "react";
import { Bot, RotateCcw, Sparkles } from "lucide-react";
import { postJson } from "@/lib/client";
import { addAttempt, addWrongItems } from "@/lib/local-store";
import type { ClozeQuestion } from "@/lib/types";
import type { ClozeResult } from "@/lib/ai-schemas";
import { AiErrorNotice, ClozeAiView, SuccessHint } from "@/components/ai/AiViews";
import FavoriteButton from "@/components/practice/FavoriteButton";

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

  const correctCount = useMemo(
    () => questions.filter((q) => answers[q.no] === q.answer).length,
    [answers, questions],
  );
  const answeredCount = Object.keys(answers).length;

  function submit() {
    if (submitted) return;
    setSubmitted(true);
    setSaveMsg("");
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
  }

  const parts = passage.split(/\{\{(\d+)\}\}/g);

  return (
    <div className="space-y-5">
      <div className="card p-5 sm:p-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-[15px] font-bold text-ink">Section I Use of English</h2>
          <span className="text-[12px] text-ink-muted">20 空 · 每空 0.5 分</span>
        </div>
        <p className="passage">
          {parts.map((part, i) => {
            if (i % 2 === 0) return <span key={i}>{part}</span>;
            const no = Number(part);
            const chosen = answers[no];
            const isRight = submitted && chosen === questions.find((q) => q.no === no)?.answer;
            return (
              <span
                key={i}
                className={`mx-0.5 inline-flex min-w-[34px] items-center justify-center rounded-md px-1 py-0.5 text-[11.5px] font-bold ${
                  submitted
                    ? isRight
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-rose-100 text-rose-800"
                    : chosen
                      ? "bg-brand-100 text-brand-800"
                      : "bg-slate-100 text-slate-500"
                }`}
              >
                {no}
                {chosen ? `·${chosen}` : ""}
              </span>
            );
          })}
        </p>
      </div>

      {submitted && (
        <div className="card flex flex-wrap items-center justify-between gap-3 border-brand-100 bg-brand-50/50 p-4">
          <div>
            <p className="text-[14px] font-semibold text-brand-900">
              答对 {correctCount} / {questions.length} 空，得分 {(correctCount * 0.5).toFixed(1)} / 10 分
            </p>
            <p className="mt-1 text-[12px] text-ink-muted">
              答案：
              {questions.map((q) => `${q.no}${q.answer}`).join(" ")}
            </p>
          </div>
          <button type="button" onClick={reset} className="btn btn-outline btn-sm">
            <RotateCcw size={14} /> 重新作答
          </button>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {questions.map((q) => {
          const chosen = answers[q.no];
          const right = chosen === q.answer;
          return (
            <div key={q.no} className="card p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[13.5px] font-bold text-ink">
                  第 {q.no} 空
                  {submitted && (
                    <span className={`ml-2 rounded px-1.5 py-0.5 text-[10.5px] font-bold ${right ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                      {right ? "正确" : `正确答案 ${q.answer}`}
                    </span>
                  )}
                </p>
                <FavoriteButton
                  kind="cloze"
                  year={year}
                  itemKey={`cloze-q${q.no}`}
                  questionNo={q.no}
                  payload={{ options: q.options, answer: q.answer }}
                  label="收藏"
                />
              </div>
              <div className="mt-2.5 grid grid-cols-2 gap-1.5">
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
                      className={`answer-option flex items-center gap-1.5 px-2.5 py-2 text-[12.5px] ${
                        isAnswer
                          ? "answer-option-correct"
                          : isWrong
                            ? "answer-option-wrong"
                            : active
                              ? "answer-option-active"
                              : ""
                      }`}
                    >
                      <span className="text-[10.5px] font-bold text-slate-400">{letter}</span>
                      {text}
                    </button>
                  );
                })}
              </div>

              {submitted && (
                <div className="mt-2.5">
                  <button
                    type="button"
                    onClick={() => askAi(q)}
                    disabled={ai[q.no]?.loading}
                    className="btn btn-soft btn-sm w-full"
                  >
                    <Sparkles size={13} />
                    {ai[q.no]?.loading ? "AI 解析中…" : "AI 逐空解析"}
                  </button>
                  {ai[q.no]?.error && <AiErrorNotice message={ai[q.no].error!} />}
                  {ai[q.no]?.data && <ClozeAiView result={ai[q.no].data!} />}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="sticky bottom-20 z-10 lg:bottom-4">
        <div className="card flex flex-wrap items-center justify-between gap-3 bg-white/95 p-3.5 backdrop-blur">
          <p className="text-[13px] text-ink-muted">
            已作答 {answeredCount} / {questions.length} 空{submitted ? ` · 答对 ${correctCount} 空` : ""}
          </p>
          <button type="button" onClick={submit} disabled={submitted || answeredCount === 0} className="btn-primary">
            <Bot size={16} /> 提交答案
          </button>
        </div>
        {saveMsg && <SuccessHint text={saveMsg} />}
      </div>
    </div>
  );
}
