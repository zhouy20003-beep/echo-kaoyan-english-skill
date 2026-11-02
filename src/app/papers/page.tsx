import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, BookOpen, CheckCheck, FileText, Library, Languages, PenLine, Target, Timer } from "lucide-react";
import { corpusMeta, getYearsDesc } from "@/lib/corpus";

export const metadata: Metadata = { title: "英语二历年真题库" };

export default function PapersPage() {
  const years = getYearsDesc();

  return (
    <div className="container-page space-y-6">
      <header>
        <p className="eyebrow">English II Question Bank</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">英语二历年真题库</h1>
        <p className="mt-2 text-sm leading-6 text-ink-soft">
          共 {corpusMeta.totals.years} 套（{corpusMeta.earliestYear}–{corpusMeta.latestYear}），
          {corpusMeta.totals.clozeQuestions} 道完形 + {corpusMeta.totals.readingQuestions} 道阅读。
          只收录考研英语（二），真题原文与客观题答案来自原项目语料。
        </p>
      </header>

      <section className="card divide-y divide-slate-100">
        {years.map((year, idx) => (
          <div key={year} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-sm font-extrabold text-brand-700">
                {year}
              </span>
              <div>
                <p className="text-[15px] font-bold text-ink">
                  全国硕士研究生招生考试 英语（二）
                  {idx === 0 && <span className="ml-2 rounded-md bg-brand-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">最新</span>}
                </p>
                <p className="mt-0.5 text-[12.5px] text-ink-muted">完形 20 题 · 阅读 20 题 · 新题型 · 翻译 15 分 · 写作 25 分</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link href={`/practice/cloze?year=${year}`} className="btn btn-outline btn-sm">
                <Target size={14} /> 完形
              </Link>
              <Link href={`/practice/reading?year=${year}&text=1`} className="btn btn-outline btn-sm">
                <BookOpen size={14} /> 阅读
              </Link>
              <Link href={`/practice/translation?year=${year}`} className="btn btn-outline btn-sm">
                <Languages size={14} /> 翻译
              </Link>
              <Link href={`/practice/writing?year=${year}&part=A`} className="btn btn-outline btn-sm">
                <PenLine size={14} /> 写作
              </Link>
              <Link href={`/papers/${year}`} className="btn btn-soft btn-sm">
                查看整套 <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { href: "/practice/reading", icon: BookOpen, title: "阅读 Part A", desc: "20 题 × 2 分", color: "text-brand-600 bg-brand-50" },
          { href: "/practice/cloze", icon: Target, title: "完形填空", desc: "20 题 × 0.5 分", color: "text-indigo-600 bg-indigo-50" },
          { href: "/practice/translation", icon: Languages, title: "翻译", desc: "15 分整段翻译", color: "text-sky-600 bg-sky-50" },
          { href: "/mock", icon: Timer, title: "模拟考试", desc: "真题套卷计时", color: "text-violet-600 bg-violet-50" },
          { href: "/practice/writing?part=A", icon: PenLine, title: "小作文", desc: "10 分 · 约 100 词", color: "text-emerald-600 bg-emerald-50" },
          { href: "/practice/writing?part=B", icon: FileText, title: "大作文", desc: "15 分 · 约 150 词", color: "text-amber-600 bg-amber-50" },
          { href: "/wrong", icon: CheckCheck, title: "错题本", desc: "自动收录错题", color: "text-rose-600 bg-rose-50" },
          { href: "/dashboard", icon: Library, title: "学习数据", desc: "正确率与记录", color: "text-slate-600 bg-slate-100" },
        ].map(({ href, icon: Icon, title, desc, color }) => (
          <Link key={title} href={href} className="card card-hover flex items-center gap-3 p-4">
            <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${color}`}>
              <Icon size={17} />
            </span>
            <span>
              <span className="block text-[14px] font-semibold text-ink">{title}</span>
              <span className="block text-[12px] text-ink-muted">{desc}</span>
            </span>
          </Link>
        ))}
      </section>
    </div>
  );
}
