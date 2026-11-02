"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { postJson } from "@/lib/client";

export default function FavoriteButton({
  kind,
  year,
  itemKey,
  questionNo,
  payload,
  label = "收藏",
}: {
  kind: "reading" | "cloze" | "translation" | "writing" | "mock";
  year: number;
  itemKey: string;
  questionNo?: number | null;
  payload: Record<string, unknown>;
  label?: string;
}) {
  const [state, setState] = useState<"idle" | "saving" | "done">("idle");

  async function save() {
    if (state !== "idle") return;
    setState("saving");
    try {
      await postJson("/api/favorites", { kind, year, itemKey, questionNo, payload });
      setState("done");
    } catch {
      setState("idle");
    }
  }

  return (
    <button
      type="button"
      onClick={save}
      className={`btn btn-sm ${state === "done" ? "bg-rose-50 text-rose-600" : "btn-outline"}`}
      aria-label={label}
    >
      <Heart size={14} className={state === "done" ? "fill-rose-500 text-rose-500" : ""} />
      {state === "done" ? "已收藏" : state === "saving" ? "保存中" : label}
    </button>
  );
}
