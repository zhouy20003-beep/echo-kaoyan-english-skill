"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteJson } from "@/lib/client";

export default function RemoveButton({ url, label = "移除" }: { url: string; label?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function remove() {
    if (busy) return;
    setBusy(true);
    setFailed(false);
    try {
      await deleteJson(url);
      router.refresh();
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={remove}
      disabled={busy}
      className={`btn btn-sm ${failed ? "bg-rose-50 text-rose-600" : "btn-ghost"}`}
    >
      <Trash2 size={14} />
      {failed ? "删除失败，重试" : busy ? "删除中…" : label}
    </button>
  );
}
