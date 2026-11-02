"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Lock, Mail, UserRound } from "lucide-react";
import { postJson } from "@/lib/client";

export default function AuthForm({
  mode,
  next,
}: {
  mode: "login" | "register";
  next?: string | null;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isRegister = mode === "register";
  const target = next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);
    try {
      await postJson(isRegister ? "/api/auth/register" : "/api/auth/login", {
        email,
        password,
        ...(isRegister ? { name } : {}),
      });
      router.replace(target);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "操作失败，请重试");
      setLoading(false);
    }
  }

  return (
    <div className="card p-6 sm:p-8">
      <p className="eyebrow">{isRegister ? "Create Account" : "Welcome Back"}</p>
      <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight text-ink">
        {isRegister ? "注册 Echo 账号" : "登录 Echo 账号"}
      </h1>
      <p className="mt-1.5 text-[13px] leading-6 text-ink-muted">
        {isRegister
          ? "注册后即可保存学习记录、错题本和收藏，所有数据仅自己可见。"
          : "登录后继续你的英语二学习进度。"}
      </p>

      <form onSubmit={submit} className="mt-6 space-y-4">
        {isRegister && (
          <div>
            <label htmlFor="auth-name" className="label">
              昵称
            </label>
            <div className="relative">
              <UserRound size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="auth-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={30}
                autoComplete="nickname"
                placeholder="例如：小 Echo"
                className="input pl-10"
              />
            </div>
          </div>
        )}

        <div>
          <label htmlFor="auth-email" className="label">
            邮箱
          </label>
          <div className="relative">
            <Mail size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              maxLength={120}
              autoComplete="email"
              inputMode="email"
              placeholder="you@example.com"
              className="input pl-10"
            />
          </div>
        </div>

        <div>
          <label htmlFor="auth-password" className="label">
            密码
          </label>
          <div className="relative">
            <Lock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="auth-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={isRegister ? 8 : 1}
              maxLength={72}
              autoComplete={isRegister ? "new-password" : "current-password"}
              placeholder={isRegister ? "至少 8 位" : "输入密码"}
              className="input pl-10"
            />
          </div>
          {isRegister && <p className="mt-1.5 text-[11.5px] text-ink-muted">密码至少 8 位，仅用于本平台登录。</p>}
        </div>

        {error && (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[12.5px] leading-6 text-rose-700">
            {error}
          </p>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" /> 处理中…
            </>
          ) : (
            <>
              {isRegister ? "注册并开始学习" : "登录"} <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>

      <p className="mt-4 text-center text-[13px] text-ink-muted">
        {isRegister ? (
          <>
            已有账号？{" "}
            <Link href={`/login?next=${encodeURIComponent(target)}`} className="font-semibold text-brand-600 hover:text-brand-700">
              直接登录
            </Link>
          </>
        ) : (
          <>
            还没有账号？{" "}
            <Link href={`/register?next=${encodeURIComponent(target)}`} className="font-semibold text-brand-600 hover:text-brand-700">
              免费注册
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
