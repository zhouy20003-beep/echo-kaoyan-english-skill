import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { ArrowUpRight, Heart, Library } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { listFavorites } from "@/lib/db";
import { KIND_LABELS, practiceHref } from "@/lib/labels";
import { formatDate } from "@/lib/format";
import type { FavoriteItem } from "@/lib/types";
import RemoveButton from "@/components/records/RemoveButton";

export const metadata: Metadata = { title: "收藏夹" };

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function optionsOf(v: unknown): Record<string, string> | null {
  return v && typeof v === "object" ? (v as Record<string, string>) : null;
}

function Detail({ item }: { item: FavoriteItem }) {
  const p = item.payload as Record<string, unknown>;
  const stem = str(p.stem);
  const options = optionsOf(p.options);
  const answer = str(p.answer) || str(p.correct);
  const source = str(p.source);
  const reference = str(p.reference);
  const task = str(p.task);
  const material = str(p.material);

  return (
    <div className="mt-3 space-y-3">
      {stem && <p className="text-[14px] font-semibold leading-6 text-ink">{stem}</p>}

      {options && (
        <div className="grid gap-1.5 sm:grid-cols-2">
          {Object.entries(options).map(([letter, text]) => (
            <div
              key={letter}
              className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-[12.5px] leading-5 ${
                letter === answer
                  ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                  : "border-slate-200 bg-white text-slate-600"
              }`}
            >
              <span className="font-bold">{letter}</span>
              <span className="flex-1">{text}</span>
              {letter === answer && <span className="text-[10.5px] font-bold">答案</span>}
            </div>
          ))}
        </div>
      )}

      {source && <p className="line-clamp-4 text-[13.5px] leading-6 text-slate-700">{source}</p>}

      {task && <p className="whitespace-pre-line text-[13.5px] leading-6 text-slate-700">{task}</p>}

      {(reference || material) && (
        <details className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
          <summary className="cursor-pointer text-[12.5px] font-semibold text-brand-700">
            {reference ? "查看参考译文（非官方）" : "查看图表 / 材料信息"}
          </summary>
          <p className="mt-2 whitespace-pre-line text-[13px] leading-6 text-slate-700">
            {reference || material}
          </p>
        </details>
      )}

      {!stem && !options && !source && !task && !reference && !material && (
        <p className="text-[13px] text-ink-muted">已收藏该练习，点击右侧按钮回到原题查看。</p>
      )}
    </div>
  );
}

export default async function FavoritesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/favorites");
  const items = await listFavorites(user.id);

  return (
    <div className="container-page max-w-4xl space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Favorites</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-ink">收藏夹</h1>
          <p className="mt-1 text-[13px] text-ink-muted">共 {items.length} 条收藏 · 好题、翻译和作文题目</p>
        </div>
        <Link href="/papers" className="btn btn-outline btn-sm">
          <Library size={15} /> 去真题库
        </Link>
      </header>

      {items.length === 0 ? (
        <div className="card p-8 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
            <Heart size={26} />
          </span>
          <h2 className="mt-4 text-[16px] font-bold text-ink">还没有收藏</h2>
          <p className="mx-auto mt-1.5 max-w-md text-[13px] leading-6 text-ink-muted">
            在阅读、完形、翻译或作文页点击「收藏」，就能把值得反复看的题目收在这里。
          </p>
          <Link href="/practice/reading" className="btn-primary btn-sm mt-5">
            去收藏第一道题 <ArrowUpRight size={14} />
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <article key={item.id} className="card p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="chip">{KIND_LABELS[item.kind]}</span>
                  <span className="text-[12.5px] font-semibold text-ink-soft">{item.paperYear} 年</span>
                  {item.questionNo != null && (
                    <span className="text-[12px] text-ink-muted">第 {item.questionNo} 题</span>
                  )}
                  <span className="text-[11.5px] text-ink-muted">{formatDate(item.createdAt)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Link
                    href={practiceHref(item.kind, item.paperYear, item.itemKey)}
                    className="btn btn-soft btn-sm"
                  >
                    去原题 <ArrowUpRight size={13} />
                  </Link>
                  <RemoveButton url={`/api/favorites/${item.id}`} label="取消收藏" />
                </div>
              </div>
              <Detail item={item} />
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
