import type { Metadata } from "next";
import { BookOpen, Bot, CheckCheck, Sparkles } from "lucide-react";
import AuthForm from "@/components/auth/AuthForm";
import { corpusMeta } from "@/lib/corpus";

export const metadata: Metadata = { title: "登录" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const sp = await searchParams;
  return (
    <div className="container-page max-w-5xl">
      <div className="grid items-center gap-8 py-4 lg:grid-cols-[1fr_420px]">
        <div className="hidden lg:block">
          <span className="chip">
            <Sparkles size={13} /> 只做考研英语（二）
          </span>
          <h2 className="mt-4 text-3xl font-extrabold leading-snug tracking-tight text-ink">
            你的英语二学习记录，
            <br />
            <span className="bg-gradient-to-r from-brand-600 to-sky-500 bg-clip-text text-transparent">
              登录后随时接着练。
            </span>
          </h2>
          <ul className="mt-6 space-y-3 text-[13.5px] text-ink-soft">
            {[
              { icon: BookOpen, text: `${corpusMeta.totals.years} 套英语二真题（${corpusMeta.earliestYear}–${corpusMeta.latestYear}）` },
              { icon: CheckCheck, text: "错题自动收录，按年份集中复盘" },
              { icon: Bot, text: "DeepSeek AI 阅读解析、翻译与作文批改" },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <Icon size={17} />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <AuthForm mode="login" next={sp.next ?? null} />
      </div>
    </div>
  );
}
