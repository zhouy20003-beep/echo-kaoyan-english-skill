import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, ArrowRight, BookOpen, FileText, Languages, PenLine, Target, Timer } from "lucide-react";
import { getPaper, getYears, isValidYear } from "@/lib/corpus";

export function generateStaticParams() {
  return getYears().map((year) => ({ year: String(year) }));
}

export async function generateMetadata({ params }: { params: Promise<{ year: string }> }): Promise<Metadata> {
  const { year } = await params;
  return { title: `${year} 年英语二真题` };
}

export default async function PaperDetailPage({ params }: { params: Promise<{ year: string }> }) {
  const { year: yearParam } = await params;
  const year = Number(yearParam);
  if (!isValidYear(year)) notFound();
  const paper = getPaper(year)!;

  return (
    <div className="container-page max-w-5xl space-y-6">
      <Link href="/papers" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700">
        <ArrowLeft size={15} /> 返回真题库
      </Link>

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">English II · {year}</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            {year} 年全国硕士研究生招生考试 英语（二）
          </h1>
          <p className="mt-2 text-sm text-ink-soft">完形 10 分 · 阅读 40 分 · 新题型 10 分 · 翻译 15 分 · 写作 25 分</p>
        </div>
        <Link href={`/mock?year=${year}`} className="btn-primary">
          <Timer size={16} /> 本套模拟考试
        </Link>
      </header>

      <section className="grid gap-3 sm:grid-cols-2">
        <Link href={`/practice/cloze?year=${year}`} className="card card-hover flex items-start gap-4 p-5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <Target size={20} />
          </span>
          <span>
            <span className="block text-[15px] font-bold text-ink">Section I 完形填空</span>
            <span className="mt-1 block text-[13px] leading-6 text-ink-muted">
              20 空 · 每题 0.5 分 · 支持 AI 逐空解析
            </span>
            <span className="mt-2 inline-flex items-center gap-1 text-[13px] font-semibold text-brand-600">
              开始练习 <ArrowRight size={13} />
            </span>
          </span>
        </Link>

        <Link href={`/practice/translation?year=${year}`} className="card card-hover flex items-start gap-4 p-5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
            <Languages size={20} />
          </span>
          <span>
            <span className="block text-[15px] font-bold text-ink">Section III 翻译</span>
            <span className="mt-1 block text-[13px] leading-6 text-ink-muted">
              15 分 · 整段英译汉 · AI 采分点批改
            </span>
            <span className="mt-2 inline-flex items-center gap-1 text-[13px] font-semibold text-brand-600">
              去翻译 <ArrowRight size={13} />
            </span>
          </span>
        </Link>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="section-title">Section II 阅读理解 Part A</h2>
          <span className="text-[12.5px] text-ink-muted">共 20 题 · 每题 2 分</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {paper.readings.map((text) => (
            <Link key={text.textNo} href={`/practice/reading?year=${year}&text=${text.textNo}`} className="card card-hover p-5">
              <div className="flex items-center justify-between">
                <span className="text-[15px] font-bold text-ink">Text {text.textNo}</span>
                <span className="chip">
                  <BookOpen size={12} /> 5 题
                </span>
              </div>
              <p className="mt-2 line-clamp-2 text-[13px] leading-6 text-ink-muted">
                {text.paragraphs[0]?.slice(0, 110)}…
              </p>
              <p className="mt-3 text-[12.5px] font-medium text-brand-600">
                第 {text.questions[0]?.no}–{text.questions[text.questions.length - 1]?.no} 题 · 开始练习 →
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-bold text-ink">Section II Part B 新题型</h2>
            <p className="mt-1 text-[13px] text-ink-muted">
              {paper.newQuestionType.kind === "true-false"
                ? "判断题（T/F）"
                : paper.newQuestionType.kind === "matching"
                  ? "匹配题"
                  : "新题型"}{" "}
              · 5 题 · 10 分 · 提供材料与答案
            </p>
          </div>
          <span className="chip">材料 + 答案</span>
        </div>
        <details className="mt-4 rounded-xl border border-slate-100 bg-slate-50/60 p-4">
          <summary className="cursor-pointer text-sm font-semibold text-brand-700">展开原文与答案</summary>
          <div className="mt-3 max-h-[420px] overflow-y-auto whitespace-pre-line text-[14px] leading-7 text-slate-700">
            {paper.newQuestionType.content}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {Object.entries(paper.newQuestionType.answers).map(([no, ans]) => (
              <span key={no} className="rounded-lg bg-white px-2.5 py-1.5 text-[12.5px] font-semibold text-ink-soft ring-1 ring-slate-200">
                {no}. <span className="text-brand-700">{ans}</span>
              </span>
            ))}
          </div>
          <p className="mt-3 text-[12px] text-ink-muted">新题型各年份形式不同（T/F、匹配等），本平台以材料和答案形式提供，不计入模拟考试自动判分。</p>
        </details>
      </section>

      <section>
        <h2 className="section-title mb-3">Section IV 写作</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link href={`/practice/writing?year=${year}&part=A`} className="card card-hover p-5">
            <div className="flex items-center justify-between">
              <span className="text-[15px] font-bold text-ink">Part A 小作文</span>
              <span className="chip">10 分</span>
            </div>
            <p className="mt-2 line-clamp-3 whitespace-pre-line text-[13px] leading-6 text-ink-muted">
              {paper.writing.partA.text}
            </p>
            <span className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-brand-600">
              AI 批改 <ArrowRight size={13} />
            </span>
          </Link>
          <Link href={`/practice/writing?year=${year}&part=B`} className="card card-hover p-5">
            <div className="flex items-center justify-between">
              <span className="text-[15px] font-bold text-ink">Part B 大作文</span>
              <span className="chip">15 分</span>
            </div>
            <p className="mt-2 line-clamp-3 whitespace-pre-line text-[13px] leading-6 text-ink-muted">
              {paper.writing.partB.text}
            </p>
            <span className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-brand-600">
              AI 批改 <ArrowRight size={13} />
            </span>
          </Link>
        </div>
      </section>

      <div className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <FileText size={18} />
          </span>
          <p className="text-[13.5px] leading-6 text-ink-soft">
            想按考试节奏完整练一套？90 分客观题自动判分，翻译与作文可调用 AI 批改。
          </p>
        </div>
        <Link href={`/mock?year=${year}`} className="btn-primary shrink-0">
          <Timer size={16} /> 开始模拟
        </Link>
      </div>

      <p className="pb-2 text-[12px] text-ink-muted">
        说明：本页客观题答案来自原项目 answers.json；翻译参考译文为 Echo 生成的非官方译文。
      </p>
    </div>
  );
}
