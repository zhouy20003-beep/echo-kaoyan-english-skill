import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { corpusMeta, getPaper, getYears, isValidYear } from "@/lib/corpus";
import ReadingPractice from "@/components/practice/ReadingPractice";
import YearSelect from "@/components/practice/YearSelect";

export const metadata: Metadata = { title: "阅读理解练习" };

export default async function ReadingPracticePage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; text?: string }>;
}) {
  const sp = await searchParams;
  const fallback = corpusMeta.latestYear;
  const year = Number(sp.year) || fallback;
  if (!isValidYear(year)) notFound();
  const paper = getPaper(year)!;
  const textNo = Number(sp.text) || 1;
  const text = paper.readings.find((r) => r.textNo === textNo);
  if (!text) notFound();

  return (
    <div className="container-page max-w-4xl space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Reading Part A</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-ink">阅读理解练习</h1>
          <p className="mt-1 text-[13px] text-ink-muted">{year} 年 · 4 篇阅读 · 20 题 · 每题 2 分</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <YearSelect years={getYears()} value={year} basePath="/practice/reading" />
        </div>
      </header>

      <div className="no-scrollbar flex gap-2 overflow-x-auto">
        {paper.readings.map((r) => (
          <Link
            key={r.textNo}
            href={`/practice/reading?year=${year}&text=${r.textNo}`}
            className={`shrink-0 rounded-xl border px-4 py-2.5 text-[13px] font-semibold transition ${
              r.textNo === textNo
                ? "border-brand-500 bg-brand-600 text-white"
                : "border-slate-200 bg-white text-ink-soft hover:border-brand-300"
            }`}
          >
            Text {r.textNo}
            <span className="ml-1.5 text-[11px] opacity-70">第 {r.questions[0]?.no}–{r.questions[r.questions.length - 1]?.no} 题</span>
          </Link>
        ))}
        <Link href={`/papers/${year}`} className="shrink-0 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-ink-soft hover:border-brand-300">
          本套真题
        </Link>
      </div>

      <ReadingPractice
        key={`${year}-${textNo}`}
        year={year}
        textNo={textNo}
        paragraphs={text.paragraphs}
        questions={text.questions}
      />
    </div>
  );
}
