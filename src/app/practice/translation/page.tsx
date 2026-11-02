import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { corpusMeta, getPaper, getYears, isValidYear } from "@/lib/corpus";
import TranslationPractice from "@/components/practice/TranslationPractice";
import YearSelect from "@/components/practice/YearSelect";

export const metadata: Metadata = { title: "翻译练习与 AI 评分" };

export default async function TranslationPracticePage({
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
          <p className="eyebrow">Translation · 15 Points</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-ink">翻译练习 + AI 评分</h1>
          <p className="mt-1 text-[13px] text-ink-muted">{year} 年 · 整段英译汉 · 按英语二采分点 15 分制批改</p>
        </div>
        <div className="flex items-center gap-2">
          <YearSelect years={getYears()} value={year} basePath="/practice/translation" />
          <Link href={`/papers/${year}`} className="btn btn-outline btn-sm">本套真题</Link>
        </div>
      </header>

      <TranslationPractice
        key={year}
        year={year}
        source={paper.translation.source}
        reference={paper.translation.reference}
      />
    </div>
  );
}
