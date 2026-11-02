import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowRight, Clock, FileText, Timer } from "lucide-react";
import { corpusMeta, getPaper, getYearsDesc, isValidYear } from "@/lib/corpus";
import MockExam from "@/components/practice/MockExam";

export const metadata: Metadata = { title: "AI 模拟考试" };

export default async function MockPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const sp = await searchParams;
  const year = Number(sp.year);

  if (!year) {
    return (
      <div className="container-page max-w-4xl space-y-5">
        <header>
          <p className="eyebrow">Mock Exam</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">AI 模拟考试</h1>
          <p className="mt-2 text-sm leading-6 text-ink-soft">
            选择一套真题，120 分钟内完成完形填空、阅读理解、翻译与大小作文。
            客观题交卷后自动判分（50 分），主观题可单独调用 AI 按英语二标准批改（翻译 15 分 + 写作 25 分）。
          </p>
        </header>

        <div className="card p-4">
          <div className="flex flex-wrap items-center gap-4 text-[13px] text-ink-soft">
            <span className="flex items-center gap-1.5"><Clock size={14} className="text-brand-600" /> 120 分钟</span>
            <span className="flex items-center gap-1.5"><Timer size={14} className="text-brand-600" /> 客观题 50 分自动判分</span>
            <span className="flex items-center gap-1.5"><FileText size={14} className="text-brand-600" /> 主观题 AI 批改</span>
          </div>
          <p className="mt-2 text-[12px] text-ink-muted">
            说明：新题型 10 分不纳入自动判分，请在试卷页查看材料与答案；模拟总分按 90 分核心模块计算。
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {getYearsDesc().map((y) => (
            <Link key={y} href={`/mock?year=${y}`} className="card card-hover flex items-center justify-between p-4">
              <div>
                <p className="text-[16px] font-extrabold text-ink">{y} 年英语二</p>
                <p className="mt-0.5 text-[12px] text-ink-muted">完形 20 + 阅读 20 + 翻译 + 写作</p>
              </div>
              <ArrowRight size={16} className="text-brand-500" />
            </Link>
          ))}
        </div>
      </div>
    );
  }

  if (!isValidYear(year)) notFound();
  const paper = getPaper(year)!;

  return (
    <div className="container-page max-w-4xl space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Mock Exam · {year}</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-ink">{year} 年英语二模拟考试</h1>
          <p className="mt-1 text-[13px] text-ink-muted">120 分钟 · 完形 + 阅读 + 翻译 + 写作</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/mock" className="btn btn-outline btn-sm">换一套</Link>
          <Link href={`/papers/${year}`} className="btn btn-ghost btn-sm">查看试卷</Link>
        </div>
      </header>

      <MockExam key={year} paper={paper} />
    </div>
  );
}
