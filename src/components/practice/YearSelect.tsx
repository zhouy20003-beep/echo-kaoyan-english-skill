"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function YearSelect({
  years,
  value,
  basePath,
  label = "年份",
}: {
  years: number[];
  value: number;
  basePath: string;
  label?: string;
}) {
  const router = useRouter();
  const params = useSearchParams();

  function change(next: string) {
    const query = new URLSearchParams(params.toString());
    query.set("year", next);
    router.push(`${basePath}?${query.toString()}`);
  }

  return (
    <label className="flex items-center gap-2 text-[13px] font-medium text-ink-muted">
      {label}
      <select
        value={value}
        onChange={(e) => change(e.target.value)}
        className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[13px] font-semibold text-ink outline-none focus:border-brand-400"
      >
        {[...years].reverse().map((y) => (
          <option key={y} value={y}>
            {y} 年
          </option>
        ))}
      </select>
    </label>
  );
}
