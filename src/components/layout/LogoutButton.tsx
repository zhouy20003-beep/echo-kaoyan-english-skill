"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button type="button" onClick={logout} disabled={loading} className="btn btn-ghost btn-sm" aria-label="退出登录">
      <LogOut size={15} />
      <span className="hidden sm:inline">退出</span>
    </button>
  );
}
