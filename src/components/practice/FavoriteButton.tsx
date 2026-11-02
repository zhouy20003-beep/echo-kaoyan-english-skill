"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { addFavorite, isFavorite } from "@/lib/local-store";
import type { AttemptKind } from "@/lib/types";

export default function FavoriteButton({
  kind,
  year,
  itemKey,
  questionNo,
  payload,
  label = "收藏",
}: {
  kind: Exclude<AttemptKind, "ask">;
  year: number;
  itemKey: string;
  questionNo?: number | null;
  payload: Record<string, unknown>;
  label?: string;
}) {
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDone(isFavorite(kind, year, itemKey));
  }, [kind, year, itemKey]);

  function save() {
    if (done) return;
    addFavorite({ kind, paperYear: year, itemKey, questionNo, payload });
    setDone(true);
  }

  return (
    <button
      type="button"
      onClick={save}
      disabled={done}
      className={`btn btn-sm ${done ? "bg-rose-50 text-rose-600" : "btn-outline"}`}
      aria-label={label}
    >
      <Heart size={14} className={done ? "fill-rose-500 text-rose-500" : ""} />
      {done ? "已收藏" : label}
    </button>
  );
}
