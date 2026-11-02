import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { corpusMeta, getPaper, getYears, isValidYear } from "@/lib/corpus";
import ClozePractice from "@/components/practice/ClozePractice";
import YearSelect from "@/components/practice/YearSelect";

export const metadata: Metadata = { title: "完形填空练习" };

export default async function ClozePracticePage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const sp = await searchParams;
  const year = Number(sp.year) || corpusMeta.latestYear;
  if (!isValidYear(year)) notFound();
  const paper = getPaper(year)!;

  return (
    <div className="container-page max-w-4xl space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Use of English</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-ink">完形填空练习</h1>
          <p className="mt-1 text-[13px] text-ink-muted">{year} 年 · 20 空 · 每空 0.5 分 · 满分 10 分</p>
        </div>
        <div className="flex items-center gap-2">
          <YearSelect years={getYears()} value={year} basePath="/practice/cloze" />
          <Link href={`/papers/${year}`} className="btn btn-outline btn-sm">本套真题</Link>
        </div>
      </header>

      <ClozePractice key={year} year={year} passage={paper.cloze.passage} questions={paper.cloze.questions} />
    </div>
  );
}
