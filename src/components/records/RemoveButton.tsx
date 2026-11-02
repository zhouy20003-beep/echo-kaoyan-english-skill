"use client";

import { Trash2 } from "lucide-react";

export default function RemoveButton({
  onRemove,
  label = "移除",
}: {
  onRemove: () => void;
  label?: string;
}) {
  return (
    <button type="button" onClick={onRemove} className="btn btn-ghost btn-sm">
      <Trash2 size={14} />
      {label}
    </button>
  );
}
