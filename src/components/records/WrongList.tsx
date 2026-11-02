"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCheck, Library, RotateCcw } from "lucide-react";
import { listWrongItems, removeWrongItem, useStoreVersion } from "@/lib/local-store";
import { KIND_LABELS, practiceHref } from "@/lib/labels";
import { formatDate } from "@/lib/format";
import type { WrongItem } from "@/lib/types";
import RemoveButton from "@/components/records/RemoveButton";

function payloadOf(item: WrongItem) {
  const p = item.payload as Record<string, unknown>;
  return {
    stem: typeof p.stem === "string" ? p.stem : "",
    options:
      p.options && typeof p.options === "object" ? (p.options as Record<string, string>) : null,
    correct: typeof p.correct === "string" ? p.correct : "",
    userAnswer: typeof p.userAnswer === "string" ? p.userAnswer : "",
    mock: p.mock === true,
  };
}

export default function WrongList() {
  const version = useStoreVersion();
  const [items, setItems] = useState<WrongItem[] | null>(null);

  useEffect(() => {
    setItems(listWrongItems());
  }, [version]);

  if (!items) {
    return (
      <div className="container-page max-w-4xl">
        <div className="card p-8 text-center text-[13px] text-ink-muted">正在读取本机错题本…</div>
      </div>
    );
  }

  const groups = new Map<number, WrongItem[]>();
  for (const item of items) {
    const list = groups.get(item.paperYear) || [];
    list.push(item);
    groups.set(item.paperYear, list);
  }
  const years = [...groups.keys()].sort((a, b) => b - a);

  return (
    <div className="container-page max-w-4xl space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Wrong Answers</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-ink">错题本</h1>
          <p className="mt-1 text-[13px] text-ink-muted">
            共 {items.length} 道错题 · 做阅读和完形时自动收录 · 保存在本机浏览器
          </p>
        </div>
        <Link href="/papers" className="btn btn-outline btn-sm">
          <Library size={15} /> 去真题库
        </Link>
      </header>

      {items.length === 0 ? (
        <div className="card p-8 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <CheckCheck size={26} />
          </span>
          <h2 className="mt-4 text-[16px] font-bold text-ink">错题本还是空的</h2>
          <p className="mx-auto mt-1.5 max-w-md text-[13px] leading-6 text-ink-muted">
            完成一次阅读或完形练习并提交答案后，答错的题会自动出现在这里，方便你集中复盘。
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Link href="/practice/reading" className="btn-primary btn-sm">
              做阅读理解 <ArrowRight size={14} />
            </Link>
            <Link href="/practice/cloze" className="btn btn-outline btn-sm">
              做完形填空
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {years.map((year) => (
            <section key={year}>
              <div className="mb-2.5 flex items-center justify-between">
                <h2 className="text-[15px] font-bold text-ink">
                  {year} 年
                  <span className="ml-2 text-[12px] font-normal text-ink-muted">
                    {groups.get(year)!.length} 道
                  </span>
                </h2>
                <Link
                  href={`/papers/${year}`}
                  className="text-[12.5px] font-semibold text-brand-600 hover:text-brand-700"
                >
                  查看整套真题 →
                </Link>
              </div>
              <div className="space-y-3">
                {groups.get(year)!.map((item) => {
                  const { stem, options, correct, userAnswer, mock } = payloadOf(item);
                  const href = practiceHref(item.kind, item.paperYear, item.itemKey);
                  return (
                    <article key={item.id} className="card p-4 sm:p-5">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="chip">{KIND_LABELS[item.kind]}</span>
                          {mock && (
                            <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10.5px] font-semibold text-slate-500">
                              模拟考
                            </span>
                          )}
                          <span className="text-[12px] text-ink-muted">
                            第 {item.questionNo} 题 · {formatDate(item.updatedAt)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Link href={href} className="btn btn-soft btn-sm">
                            <RotateCcw size={13} /> 回去重做
                          </Link>
                          <RemoveButton onRemove={() => removeWrongItem(item.id)} label="已掌握" />
                        </div>
                      </div>

                      {stem && (
                        <p className="mt-3 text-[14px] font-semibold leading-6 text-ink">{stem}</p>
                      )}

                      {options && (
                        <div className="mt-2.5 grid gap-1.5 sm:grid-cols-2">
                          {Object.entries(options).map(([letter, text]) => {
                            const isCorrect = letter === correct;
                            const isUserWrong = letter === userAnswer && !isCorrect;
                            return (
                              <div
                                key={letter}
                                className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-[12.5px] leading-5 ${
                                  isCorrect
                                    ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                                    : isUserWrong
                                      ? "border-rose-300 bg-rose-50 text-rose-900"
                                      : "border-slate-200 bg-white text-slate-600"
                                }`}
                              >
                                <span className="font-bold">{letter}</span>
                                <span className="flex-1">{text}</span>
                                {isCorrect && <span className="text-[10.5px] font-bold">正确答案</span>}
                                {isUserWrong && <span className="text-[10.5px] font-bold">你的选择</span>}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {!options && (
                        <p className="mt-3 text-[13px] text-ink-muted">
                          正确答案：<span className="font-bold text-emerald-700">{correct || "见原题"}</span>
                          {userAnswer && (
                            <>
                              {" "}· 你的选择：<span className="font-bold text-rose-600">{userAnswer}</span>
                            </>
                          )}
                        </p>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
