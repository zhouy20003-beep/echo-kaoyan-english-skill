import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { corpusMeta, getPaper, getYears, isValidYear } from "@/lib/corpus";
import WritingPractice from "@/components/practice/WritingPractice";
import YearSelect from "@/components/practice/YearSelect";

export const metadata: Metadata = { title: "写作批改" };

export default async function WritingPracticePage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; part?: string }>;
}) {
  const sp = await searchParams;
  const year = Number(sp.year) || corpusMeta.latestYear;
  if (!isValidYear(year)) notFound();
  const part = sp.part === "B" ? "B" : "A";
  const paper = getPaper(year)!;
  const task = part === "A" ? paper.writing.partA : paper.writing.partB;

  return (
    <div className="container-page max-w-4xl space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Writing · AI Feedback</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-ink">英语二写作批改</h1>
          <p className="mt-1 text-[13px] text-ink-muted">
            {year} 年 · 小作文 10 分 · 大作文 15 分 · 分数、错误分析、修改建议与参考范文
          </p>
        </div>
        <YearSelect years={getYears()} value={year} basePath="/practice/writing" />
      </header>

      <div className="no-scrollbar flex gap-2 overflow-x-auto">
        <Link
          href={`/practice/writing?year=${year}&part=A`}
          className={`shrink-0 rounded-xl border px-4 py-2.5 text-[13px] font-semibold transition ${
            part === "A" ? "border-brand-500 bg-brand-600 text-white" : "border-slate-200 bg-white text-ink-soft hover:border-brand-300"
          }`}
        >
          Part A 小作文 · 10 分
        </Link>
        <Link
          href={`/practice/writing?year=${year}&part=B`}
          className={`shrink-0 rounded-xl border px-4 py-2.5 text-[13px] font-semibold transition ${
            part === "B" ? "border-brand-500 bg-brand-600 text-white" : "border-slate-200 bg-white text-ink-soft hover:border-brand-300"
          }`}
        >
          Part B 大作文 · 15 分
        </Link>
        <Link href={`/papers/${year}`} className="shrink-0 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-ink-soft hover:border-brand-300">
          本套真题
        </Link>
      </div>

      <WritingPractice
        key={`${year}-${part}`}
        year={year}
        part={part}
        task={task.text}
        material={task.material}
      />
    </div>
  );
}
