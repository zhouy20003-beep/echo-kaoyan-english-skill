"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCheck,
  Flame,
  Heart,
  LineChart,
  Sparkles,
  Target,
} from "lucide-react";
import {
  listAttempts,
  listFavorites,
  listWrongItems,
  useStoreVersion,
} from "@/lib/local-store";
import { summarizeAttempts } from "@/lib/stats";
import { KIND_LABELS, itemLabel, practiceHref } from "@/lib/labels";
import { formatDate, formatTime } from "@/lib/format";
import type { Attempt, FavoriteItem, WrongItem } from "@/lib/types";

interface StoreData {
  attempts: Attempt[];
  wrongItems: WrongItem[];
  favorites: FavoriteItem[];
}

export default function DashboardView() {
  const version = useStoreVersion();
  const [data, setData] = useState<StoreData | null>(null);

  useEffect(() => {
    setData({
      attempts: listAttempts(300),
      wrongItems: listWrongItems(),
      favorites: listFavorites(),
    });
  }, [version]);

  if (!data) {
    return (
      <div className="container-page max-w-5xl">
        <div className="card p-8 text-center text-[13px] text-ink-muted">正在读取本机学习记录…</div>
      </div>
    );
  }

  const { attempts, wrongItems, favorites } = data;
  const summary = summarizeAttempts(attempts);
  const recent = attempts.slice(0, 12);
  const kindStats = Object.entries(summary.byKind).sort((a, b) => b[1].total - a[1].total);

  return (
    <div className="container-page max-w-5xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">My Learning</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-ink">学习记录</h1>
          <p className="mt-1 text-[13px] text-ink-muted">
            无需登录 · 记录只保存在这台设备的浏览器里
          </p>
        </div>
        <Link href="/papers" className="btn-primary btn-sm">
          <BookOpen size={15} /> 继续刷真题
        </Link>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            icon: Target,
            label: "累计答题",
            value: `${summary.totalQuestions}`,
            unit: "题",
            hint: `共 ${summary.attempts} 次练习`,
          },
          {
            icon: LineChart,
            label: "客观题正确率",
            value: summary.correctRate == null ? "—" : `${summary.correctRate}`,
            unit: summary.correctRate == null ? "" : "%",
            hint: `答对 ${summary.totalCorrect} 题`,
          },
          {
            icon: CalendarDays,
            label: "学习天数",
            value: `${summary.studyDays}`,
            unit: "天",
            hint: "有练习记录的天数",
          },
          {
            icon: Flame,
            label: "连续学习",
            value: `${summary.streak}`,
            unit: "天",
            hint: summary.streak > 0 ? "保持节奏，别中断" : "今天开始第一练",
          },
        ].map(({ icon: Icon, label, value, unit, hint }) => (
          <div key={label} className="card p-4 sm:p-5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <Icon size={18} />
            </span>
            <p className="mt-3 text-[11.5px] font-medium text-ink-muted">{label}</p>
            <p className="mt-0.5">
              <span className="text-2xl font-extrabold tracking-tight text-ink">{value}</span>
              {unit && <span className="ml-0.5 text-[12px] font-semibold text-ink-muted">{unit}</span>}
            </p>
            <p className="mt-1 text-[11.5px] text-ink-muted">{hint}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-bold text-ink">各题型正确率</h2>
            {summary.scoredRate != null && (
              <span className="chip">
                <Sparkles size={12} /> AI 主观题得分率 {summary.scoredRate}%
              </span>
            )}
          </div>
          {kindStats.length === 0 ? (
            <div className="mt-5 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-center">
              <p className="text-[13px] text-ink-muted">还没有客观题记录，完成一次阅读或完形练习后这里会自动统计。</p>
              <Link href="/practice/reading" className="btn btn-soft btn-sm mt-3">
                做一篇阅读 <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <ul className="mt-4 space-y-3.5">
              {kindStats.map(([kind, stat]) => {
                const rate = stat.total ? Math.round((stat.correct / stat.total) * 100) : 0;
                return (
                  <li key={kind}>
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="font-semibold text-ink">
                        {KIND_LABELS[kind as keyof typeof KIND_LABELS] ?? kind}
                        <span className="ml-2 text-[11.5px] font-normal text-ink-muted">
                          {stat.correct}/{stat.total} 题 · {stat.count} 次
                        </span>
                      </span>
                      <span className="font-bold text-brand-700">{rate}%</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-brand-500 to-sky-400"
                        style={{ width: `${rate}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="card p-5">
          <h2 className="text-[15px] font-bold text-ink">我的学习工具</h2>
          <div className="mt-3 space-y-2.5">
            <Link href="/wrong" className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 transition hover:border-brand-200 hover:bg-brand-50/40">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                <CheckCheck size={18} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13.5px] font-bold text-ink">错题本</span>
                <span className="block text-[11.5px] text-ink-muted">{wrongItems.length} 道待复盘</span>
              </span>
              <ArrowRight size={15} className="text-slate-400" />
            </Link>
            <Link href="/favorites" className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 transition hover:border-brand-200 hover:bg-brand-50/40">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <Heart size={18} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13.5px] font-bold text-ink">收藏夹</span>
                <span className="block text-[11.5px] text-ink-muted">{favorites.length} 条收藏</span>
              </span>
              <ArrowRight size={15} className="text-slate-400" />
            </Link>
            <Link href="/ask" className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 transition hover:border-brand-200 hover:bg-brand-50/40">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                <Sparkles size={18} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13.5px] font-bold text-ink">AI 答疑</span>
                <span className="block text-[11.5px] text-ink-muted">随时问英语二学习方法</span>
              </span>
              <ArrowRight size={15} className="text-slate-400" />
            </Link>
          </div>
        </div>
      </section>

      <section className="card p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-bold text-ink">最近练习记录</h2>
          <span className="text-[12px] text-ink-muted">最多显示 12 条</span>
        </div>
        {recent.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-center text-[13px] text-ink-muted">
            暂无记录。做一次阅读、完形、翻译或作文批改，就会出现在这里。
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100">
            {recent.map((a) => {
              const href = practiceHref(a.kind, a.paperYear, a.itemKey);
              const result =
                a.correct != null && a.total != null
                  ? `${a.correct}/${a.total} 题`
                  : a.score != null && a.maxScore != null
                    ? `${a.score} / ${a.maxScore} 分`
                    : "已记录";
              return (
                <li key={a.id}>
                  <Link href={href} className="flex items-center gap-3 py-3 transition hover:bg-brand-50/30">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-brand-600">
                      <BookOpen size={16} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-semibold text-ink">
                        {a.paperYear ? `${a.paperYear} 年 · ` : ""}
                        {itemLabel(a.kind, a.itemKey)}
                      </span>
                      <span className="block text-[11.5px] text-ink-muted">
                        {formatDate(a.createdAt)} · {KIND_LABELS[a.kind]}
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block text-[12.5px] font-bold text-brand-700">{result}</span>
                      <span className="block text-[11px] text-ink-muted">{formatTime(a.createdAt)}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <p className="pb-2 text-center text-[12px] leading-6 text-ink-muted">
        所有记录只保存在这台设备的浏览器里（localStorage），清理缓存或更换设备后会清空。
      </p>
    </div>
  );
}
