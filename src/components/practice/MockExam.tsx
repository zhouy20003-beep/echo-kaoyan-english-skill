"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Clock, Sparkles, Send } from "lucide-react";
import { postJson } from "@/lib/client";
import type { Paper } from "@/lib/types";
import type { TranslationResult, WritingResult } from "@/lib/ai-schemas";
import { AiErrorNotice, SuccessHint, TranslationAiView, WritingAiView } from "@/components/ai/AiViews";

interface Props {
  paper: Paper;
}

type Phase = "exam" | "review";

export default function MockExam({ paper }: Props) {
  const [phase, setPhase] = useState<Phase>("exam");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [translation, setTranslation] = useState("");
  const [essayA, setEssayA] = useState("");
  const [essayB, setEssayB] = useState("");
  const [seconds, setSeconds] = useState(120 * 60);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [autoSubmitted, setAutoSubmitted] = useState(false);

  const [translationAi, setTranslationAi] = useState<{ loading: boolean; data?: TranslationResult; error?: string }>({ loading: false });
  const [writingAAi, setWritingAAi] = useState<{ loading: boolean; data?: WritingResult; error?: string }>({ loading: false });
  const [writingBAi, setWritingBAi] = useState<{ loading: boolean; data?: WritingResult; error?: string }>({ loading: false });

  const clozeCorrect = useMemo(
    () => paper.cloze.questions.filter((q) => answers[`cloze-${q.no}`] === q.answer).length,
    [answers, paper],
  );
  const readingCorrect = useMemo(
    () =>
      paper.readings.reduce(
        (acc, r) => acc + r.questions.filter((q) => answers[`reading-${r.textNo}-${q.no}`] === q.answer).length,
        0,
      ),
    [answers, paper],
  );
  const objectiveScore = clozeCorrect * 0.5 + readingCorrect * 2;
  const answeredObjective = Object.keys(answers).length;

  useEffect(() => {
    if (phase !== "exam") return;
    const timer = window.setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    if (seconds === 0 && phase === "exam" && !autoSubmitted) {
      setAutoSubmitted(true);
      void submit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds, phase]);

  function pick(key: string, letter: string) {
    setAnswers((prev) => ({ ...prev, [key]: letter }));
  }

  async function submit() {
    if (phase === "review" || saving) return;
    setPhase("review");
    setSaving(true);
    setSaveMsg("");
    const wrong: {
      kind: "cloze" | "reading";
      paperYear: number;
      itemKey: string;
      questionNo: number;
      payload: Record<string, unknown>;
    }[] = [];

    for (const q of paper.cloze.questions) {
      const user = answers[`cloze-${q.no}`];
      if (user !== q.answer) {
        wrong.push({
          kind: "cloze",
          paperYear: paper.year,
          itemKey: "mock-cloze",
          questionNo: q.no,
          payload: { options: q.options, correct: q.answer, userAnswer: user || null, mock: true },
        });
      }
    }
    for (const r of paper.readings) {
      for (const q of r.questions) {
        const user = answers[`reading-${r.textNo}-${q.no}`];
        if (user !== q.answer) {
          wrong.push({
            kind: "reading",
            paperYear: paper.year,
            itemKey: `mock-reading-text-${r.textNo}`,
            questionNo: q.no,
            payload: { stem: q.stem, options: q.options, correct: q.answer, userAnswer: user || null, textNo: r.textNo, mock: true },
          });
        }
      }
    }

    try {
      await postJson("/api/records", {
        kind: "mock",
        paperYear: paper.year,
        itemKey: "mock-objective",
        correct: clozeCorrect + readingCorrect,
        total: 40,
        score: objectiveScore,
        maxScore: 50,
        payload: {
          clozeCorrect,
          readingCorrect,
          answered: answeredObjective,
          timeUsed: 120 * 60 - seconds,
        },
      });
      if (wrong.length) await postJson("/api/wrong", { items: wrong.slice(0, 50) });
      setSaveMsg("模拟考试客观题成绩已保存，错题已加入错题本");
    } catch (err) {
      setSaveMsg(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  async function gradeTranslation() {
    setTranslationAi({ loading: true });
    try {
      const data = await postJson<{ result: TranslationResult }>("/api/ai/translation", {
        year: paper.year,
        userTranslation: translation,
      });
      setTranslationAi({ loading: false, data: data.result });
      await postJson("/api/records", {
        kind: "translation",
        paperYear: paper.year,
        itemKey: "mock-translation",
        score: data.result.score,
        maxScore: 15,
        payload: { translation: translation.slice(0, 1200), mock: true },
      }).catch(() => undefined);
    } catch (err) {
      setTranslationAi({ loading: false, error: err instanceof Error ? err.message : "批改失败" });
    }
  }

  async function gradeWriting(part: "A" | "B") {
    const essay = part === "A" ? essayA : essayB;
    const setter = part === "A" ? setWritingAAi : setWritingBAi;
    if (essay.trim().length < 30) {
      setter({ loading: false, error: "这篇作文太短，先写完再批改。" });
      return;
    }
    setter({ loading: true });
    try {
      const data = await postJson<{ result: WritingResult }>("/api/ai/writing", {
        year: paper.year,
        part,
        mode: "grade",
        essay,
      });
      setter({ loading: false, data: data.result });
      await postJson("/api/records", {
        kind: "writing",
        paperYear: paper.year,
        itemKey: `mock-writing-part-${part}`,
        score: data.result.score,
        maxScore: part === "A" ? 10 : 15,
        payload: { part, essay: essay.slice(0, 1500), mock: true },
      }).catch(() => undefined);
    } catch (err) {
      setter({ loading: false, error: err instanceof Error ? err.message : "批改失败" });
    }
  }

  const subjectiveScore =
    (translationAi.data?.score ?? 0) + (writingAAi.data?.score ?? 0) + (writingBAi.data?.score ?? 0);
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <div className="space-y-5">
      <div className="card sticky top-16 z-20 flex flex-wrap items-center justify-between gap-3 bg-white/95 p-3.5 backdrop-blur">
        <div className="flex items-center gap-2 text-[13px] font-semibold text-ink-soft">
          <Clock size={15} className={seconds < 600 ? "text-rose-500" : "text-brand-600"} />
          <span className={seconds < 600 ? "text-rose-600" : ""}>
            {phase === "exam" ? `剩余 ${mm}:${ss}` : "考试已结束"}
          </span>
          {phase === "exam" && <span className="text-[11.5px] font-normal text-ink-muted">· 已答 {answeredObjective}/40 客观题</span>}
        </div>
        {phase === "exam" ? (
          <button type="button" onClick={submit} disabled={saving} className="btn-primary btn-sm">
            <Send size={14} /> 交卷判分
          </button>
        ) : (
          <span className="text-[13px] font-bold text-brand-700">
            客观 {objectiveScore} / 50 · 主观 {subjectiveScore} / 40 · 合计 {objectiveScore + subjectiveScore} / 90
          </span>
        )}
      </div>

      {phase === "review" && (
        <div className="card border-brand-100 bg-brand-50/60 p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <p className="text-[11px] text-ink-muted">完形填空</p>
              <p className="text-lg font-extrabold text-ink">{clozeCorrect * 0.5} <span className="text-[11px] font-normal">/ 10</span></p>
            </div>
            <div>
              <p className="text-[11px] text-ink-muted">阅读理解</p>
              <p className="text-lg font-extrabold text-ink">{readingCorrect * 2} <span className="text-[11px] font-normal">/ 40</span></p>
            </div>
            <div>
              <p className="text-[11px] text-ink-muted">客观题合计</p>
              <p className="text-lg font-extrabold text-brand-700">{objectiveScore} <span className="text-[11px] font-normal">/ 50</span></p>
            </div>
            <div>
              <p className="text-[11px] text-ink-muted">主观题（AI 批改）</p>
              <p className="text-lg font-extrabold text-ink">{subjectiveScore} <span className="text-[11px] font-normal">/ 40</span></p>
            </div>
          </div>
          {saveMsg && <SuccessHint text={saveMsg} />}
          <p className="mt-2 text-[12px] text-ink-muted">
            新题型 10 分不纳入自动判分，可在试卷页查看材料与答案。总分按 90 分核心模块计算。
          </p>
        </div>
      )}

      <section className="card p-5">
        <h2 className="text-[15px] font-bold text-ink">Section I 完形填空 · 20 题 · 10 分</h2>
        <p className="passage mt-3">
          {paper.cloze.passage.split(/\{\{(\d+)\}\}/g).map((part, i) => {
            if (i % 2 === 0) return <span key={i}>{part}</span>;
            const no = Number(part);
            const chosen = answers[`cloze-${no}`];
            const isRight = phase === "review" && chosen === paper.cloze.questions.find((q) => q.no === no)?.answer;
            return (
              <span
                key={i}
                className={`mx-0.5 inline-flex min-w-[30px] justify-center rounded px-1 py-0.5 text-[11px] font-bold ${
                  phase === "review" ? (isRight ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800") : chosen ? "bg-brand-100 text-brand-700" : "bg-slate-100 text-slate-500"
                }`}
              >
                {no}{chosen ? `·${chosen}` : ""}
              </span>
            );
          })}
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {paper.cloze.questions.map((q) => (
            <div key={q.no} className="rounded-xl border border-slate-100 p-3">
              <p className="text-[12.5px] font-bold text-ink">
                {q.no}.
                {phase === "review" && <span className="ml-1.5 text-[11px] font-semibold text-emerald-700">答案 {q.answer}</span>}
              </p>
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                {Object.entries(q.options).map(([letter, text]) => {
                  const chosen = answers[`cloze-${q.no}`] === letter;
                  const isAnswer = phase === "review" && letter === q.answer;
                  return (
                    <button
                      key={letter}
                      type="button"
                      disabled={phase === "review"}
                      onClick={() => pick(`cloze-${q.no}`, letter)}
                      className={`answer-option px-2 py-1.5 text-[12px] ${isAnswer ? "answer-option-correct" : chosen ? "answer-option-active" : ""}`}
                    >
                      <span className="mr-1 text-[10px] font-bold text-slate-400">{letter}</span>
                      {text}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {paper.readings.map((text) => (
        <section key={text.textNo} className="card p-5">
          <h2 className="text-[15px] font-bold text-ink">Section II Reading Text {text.textNo} · 5 题 · 10 分</h2>
          <details open className="mt-3 rounded-xl bg-slate-50/70 p-4">
            <summary className="cursor-pointer text-[12px] font-semibold text-brand-700">阅读原文（点击可收起）</summary>
            <div className="mt-3 space-y-3">
              {text.paragraphs.map((p, i) => (
                <p key={i} className="passage">
                  <span className="mr-1.5 align-super text-[10px] font-bold text-brand-500">P{i + 1}</span>
                  {p}
                </p>
              ))}
            </div>
          </details>
          <div className="mt-3 space-y-2">
            {text.questions.map((q) => (
              <div key={q.no} className="rounded-xl border border-slate-100 p-3">
                <p className="text-[13.5px] font-semibold leading-6 text-ink">
                  <span className="mr-1 text-brand-600">{q.no}.</span>
                  {q.stem}
                  {phase === "review" && (
                    <span className="ml-1.5 rounded bg-emerald-50 px-1.5 py-0.5 text-[10.5px] font-bold text-emerald-700">答案 {q.answer}</span>
                  )}
                </p>
                <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                  {Object.entries(q.options).map(([letter, optionText]) => {
                    const key = `reading-${text.textNo}-${q.no}`;
                    const chosen = answers[key] === letter;
                    const isAnswer = phase === "review" && letter === q.answer;
                    return (
                      <button
                        key={letter}
                        type="button"
                        disabled={phase === "review"}
                        onClick={() => pick(key, letter)}
                        className={`answer-option px-2.5 py-2 text-[12.5px] ${isAnswer ? "answer-option-correct" : chosen ? "answer-option-active" : ""}`}
                      >
                        <span className="mr-1 text-[10.5px] font-bold text-slate-400">{letter}</span>
                        {optionText}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      <section className="card p-5">
        <h2 className="text-[15px] font-bold text-ink">Section III 翻译 · 15 分</h2>
        <div className="mt-3 space-y-3">
          {paper.translation.source.split("\n\n").map((p, i) => (
            <p key={i} className="passage">{p}</p>
          ))}
        </div>
        {phase === "exam" ? (
          <textarea
            value={translation}
            onChange={(e) => setTranslation(e.target.value)}
            placeholder="写下你的中文译文…"
            className="textarea mt-4 min-h-[170px]"
            maxLength={4000}
          />
        ) : (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button type="button" onClick={gradeTranslation} disabled={translationAi.loading} className="btn btn-soft btn-sm">
              <Sparkles size={14} /> {translationAi.loading ? "AI 批改中…" : "AI 批改翻译"}
            </button>
            {!translation.trim() && <span className="text-[12px] text-ink-muted">未作答翻译</span>}
          </div>
        )}
        {translationAi.error && <AiErrorNotice message={translationAi.error} />}
        {translationAi.data && (
          <div className="mt-3 rounded-xl bg-slate-50/70 p-4">
            <p className="mb-2 text-[13px] font-bold text-ink">你的译文（{translation.length} 字）</p>
            <p className="whitespace-pre-line text-[13px] leading-7 text-slate-700">{translation || "未作答"}</p>
            <TranslationAiView result={translationAi.data} />
          </div>
        )}
      </section>

      {(["A", "B"] as const).map((part) => {
        const task = part === "A" ? paper.writing.partA : paper.writing.partB;
        const essay = part === "A" ? essayA : essayB;
        const setEssay = part === "A" ? setEssayA : setEssayB;
        const aiState = part === "A" ? writingAAi : writingBAi;
        const grade = () => gradeWriting(part);
        const words = essay.trim() ? essay.trim().split(/\s+/).filter(Boolean).length : 0;
        return (
          <section key={part} className="card p-5">
            <h2 className="text-[15px] font-bold text-ink">
              Section IV Writing Part {part} · {part === "A" ? "10 分" : "15 分"}
            </h2>
            <p className="mt-2 whitespace-pre-line text-[13.5px] leading-7 text-slate-700">{task.text}</p>
            {task.material && (
              <p className="mt-2 whitespace-pre-line rounded-lg bg-slate-50 p-3 font-serif text-[12.5px] leading-6 text-slate-600">
                {task.material}
              </p>
            )}
            {phase === "exam" ? (
              <textarea
                value={essay}
                onChange={(e) => setEssay(e.target.value)}
                placeholder="英文作文…"
                className="textarea mt-3 min-h-[220px] font-serif"
                maxLength={6000}
              />
            ) : (
              <div className="mt-3">
                <p className="text-[12px] text-ink-muted">你的作文（{words} 词）</p>
                <p className="mt-1 whitespace-pre-line rounded-lg bg-slate-50 p-3 font-serif text-[13px] leading-7 text-slate-700">
                  {essay || "未作答"}
                </p>
                <button type="button" onClick={grade} disabled={aiState.loading} className="btn btn-soft btn-sm mt-2">
                  <Sparkles size={14} /> {aiState.loading ? "AI 批改中…" : `AI 批改 Part ${part}`}
                </button>
              </div>
            )}
            {aiState.error && <AiErrorNotice message={aiState.error} />}
            {aiState.data && (
              <div className="mt-3 rounded-xl bg-slate-50/70 p-4">
                <WritingAiView result={aiState.data} />
              </div>
            )}
          </section>
        );
      })}

      {phase === "exam" && (
        <div className="sticky bottom-20 z-10 lg:bottom-4">
          <div className="card flex items-center justify-between gap-3 bg-white/95 p-3.5 backdrop-blur">
            <p className="text-[12.5px] text-ink-muted">已答 {answeredObjective}/40 · 建议先在 120 分钟内完成</p>
            <button type="button" onClick={submit} disabled={saving} className="btn-primary">
              <Send size={15} /> {saving ? "判分中…" : "交卷判分"}
            </button>
          </div>
        </div>
      )}

      {phase === "review" && (
        <div className="card flex items-start gap-2 border-amber-200 bg-amber-50 p-4 text-[12.5px] leading-6 text-amber-900">
          <AlertCircle size={15} className="mt-0.5 shrink-0" />
          <p>
            客观题答案来自原项目官方答案；翻译与作文由 AI 按英语二评分标准批改，仅供学习参考。
            新题型 10 分请到{" "}
            <a href={`/papers/${paper.year}`} className="font-semibold underline">本套真题页</a> 查看材料与答案。
          </p>
        </div>
      )}
    </div>
  );
}
