import Link from "next/link";
import { LineChart, Sparkles } from "lucide-react";

const LINKS = [
  { href: "/papers", label: "真题库" },
  { href: "/practice/reading", label: "阅读" },
  { href: "/practice/cloze", label: "完形" },
  { href: "/practice/translation", label: "翻译" },
  { href: "/practice/writing", label: "写作" },
  { href: "/mock", label: "模拟考试" },
  { href: "/ask", label: "AI 答疑" },
];

export default function TopNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-[0_6px_16px_rgba(37,99,235,0.3)]">
            <Sparkles className="h-4.5 w-4.5" size={18} />
          </span>
          <span className="leading-tight">
            <span className="block text-[15px] font-extrabold tracking-tight text-ink">Echo 英语二</span>
            <span className="hidden text-[11px] font-medium text-ink-muted sm:block">AI 学习平台</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-2.5 py-2 text-[13.5px] font-medium text-ink-soft transition hover:bg-brand-50 hover:text-brand-700"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/dashboard" className="btn btn-ghost btn-sm">
            <LineChart size={15} /> 学习记录
          </Link>
        </div>
      </div>
    </header>
  );
}
