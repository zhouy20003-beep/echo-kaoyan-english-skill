import type { Metadata } from "next";
import { BookOpen, Bot, CheckCheck, Sparkles } from "lucide-react";
import AuthForm from "@/components/auth/AuthForm";

export const metadata: Metadata = { title: "注册" };

export default async function RegisterPage({
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
            <Sparkles size={13} /> 免费注册
          </span>
          <h2 className="mt-4 text-3xl font-extrabold leading-snug tracking-tight text-ink">
            一个账号，
            <br />
            <span className="bg-gradient-to-r from-brand-600 to-sky-500 bg-clip-text text-transparent">
              保存你的全部练习数据。
            </span>
          </h2>
          <ul className="mt-6 space-y-3 text-[13.5px] text-ink-soft">
            {[
              { icon: BookOpen, text: "真题、专项练习与模拟考试全部免费" },
              { icon: CheckCheck, text: "学习记录、正确率、错题本、收藏夹独立保存" },
              { icon: Bot, text: "AI 批改结果按英语二评分标准生成" },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <Icon size={17} />
                </span>
                {text}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-[12px] leading-6 text-ink-muted">
            每个账号只能看到自己的记录，不会与其他用户共享数据。
          </p>
        </div>
        <AuthForm mode="register" next={sp.next ?? null} />
      </div>
    </div>
  );
}
