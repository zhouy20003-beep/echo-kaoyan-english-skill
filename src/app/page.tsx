import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Bot,
  CheckCheck,
  FileText,
  Heart,
  Library,
  LineChart,
  NotebookPen,
  PenLine,
  Sparkles,
  Target,
  Timer,
  Languages,
} from "lucide-react";
import { corpusMeta, getRecentPapers } from "@/lib/corpus";

const FEATURES = [
  { href: "/papers", icon: Library, title: "英语二历年真题库", desc: "2010–2026 共 17 套真题，原文与官方客观题答案", tag: "真题" },
  { href: "/practice/reading", icon: BookOpen, title: "阅读理解练习", desc: "每年 4 篇阅读、20 道题，逐题作答与即时判分", tag: "阅读" },
  { href: "/practice/reading", icon: Bot, title: "AI 阅读逐题解析", desc: "答案、原文定位、选项分析、中文翻译", tag: "AI" },
  { href: "/practice/cloze", icon: Target, title: "完形填空", desc: "20 空专项训练，上下文逻辑逐空讲解", tag: "完形" },
  { href: "/practice/translation", icon: Languages, title: "翻译练习 + AI 评分", desc: "15 分制采分点批改、逐句分析与参考译文", tag: "AI 批改" },
  { href: "/practice/writing?part=A", icon: PenLine, title: "小作文批改", desc: "10 分制，格式、要点、语言逐句修改", tag: "AI 批改" },
  { href: "/practice/writing?part=B", icon: FileText, title: "大作文批改", desc: "15 分制图表作文，分数、档位与参考范文", tag: "AI 批改" },
  { href: "/mock", icon: Timer, title: "AI 模拟考试", desc: "真题套卷计时作答，客观题自动判分", tag: "模拟" },
  { href: "/wrong", icon: CheckCheck, title: "错题本", desc: "自动收录答错的题，随时重做复盘", tag: "记录" },
  { href: "/favorites", icon: Heart, title: "收藏夹", desc: "收藏好题、翻译与作文题目", tag: "记录" },
  { href: "/dashboard", icon: LineChart, title: "学习记录与正确率", desc: "答题量、正确率、连续学习天数", tag: "数据" },
  { href: "/ask", icon: Sparkles, title: "AI 考研英语答疑", desc: "题型方法、长难句、写作提分随时问", tag: "AI" },
];

export default function HomePage() {
  const recent = getRecentPapers(4);
  const years = [...corpusMeta.years].reverse();

  return (
    <div className="container-page space-y-10">
      <section className="relative overflow-hidden rounded-3xl border border-brand-100 bg-gradient-to-br from-white via-brand-50/60 to-white px-5 py-9 shadow-card sm:px-9 sm:py-12">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-brand-200/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-sky-200/30 blur-3xl" />
        <div className="relative max-w-3xl">
          <span className="chip">
            <Sparkles size={13} /> 只做考研英语（二）· 2010–2026
          </span>
          <h1 className="mt-4 text-[28px] font-extrabold leading-[1.25] tracking-tight text-ink sm:text-4xl">
            用真题把英语二练透，
            <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-brand-600 to-sky-500 bg-clip-text text-transparent">让 AI 逐题讲给你听。</span>
          </h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-7 text-ink-soft sm:text-base">
            17 年英语二真题、阅读理解、完形填空、翻译与大小作文批改，全部按英语二评分标准。
            DeepSeek AI 在服务端运行，手机和电脑打开即用，无需下载 App。
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/papers" className="btn-primary px-5">
              开始刷真题 <ArrowRight size={16} />
            </Link>
            <Link href="/mock" className="btn-outline px-5">
              <Timer size={16} /> AI 模拟考试
            </Link>
            <Link href="/ask" className="btn-soft px-5">
              <Bot size={16} /> 问 AI 老师
            </Link>
          </div>
          <dl className="mt-8 grid max-w-lg grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: "历年真题", value: `${corpusMeta.totals.years} 套` },
              { label: "阅读题", value: `${corpusMeta.totals.readingQuestions} 道` },
              { label: "完形题", value: `${corpusMeta.totals.clozeQuestions} 道` },
              { label: "AI 批改", value: "24h" },
            ].map((s) => (
              <div key={s.label}>
                <dt className="text-[11px] font-medium text-ink-muted">{s.label}</dt>
                <dd className="text-lg font-extrabold text-ink">{s.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <p className="eyebrow">Latest Papers</p>
            <h2 className="section-title mt-1">最近年份真题</h2>
          </div>
          <Link href="/papers" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
            查看全部 17 套 →
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {recent.map((paper) => (
            <Link key={paper.year} href={`/papers/${paper.year}`} className="card card-hover flex flex-col p-5">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-extrabold tracking-tight text-ink">{paper.year}</span>
                <span className="chip">英语二</span>
              </div>
              <p className="mt-3 text-[13px] leading-6 text-ink-muted">
                完形 {paper.stats.cloze} 题 · 阅读 {paper.stats.reading} 题 · 翻译 · 大小作文
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-600">
                进入真题 <ArrowRight size={14} />
              </span>
            </Link>
          ))}
        </div>
        <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
          {years.map((year) => (
            <Link
              key={year}
              href={`/papers/${year}`}
              className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] font-semibold text-ink-soft transition hover:border-brand-300 hover:text-brand-700"
            >
              {year}
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4">
          <p className="eyebrow">Everything You Need</p>
          <h2 className="section-title mt-1">十二个真实可用的学习功能</h2>
          <p className="mt-1 text-sm text-ink-muted">所有入口都可用，没有摆设按钮。</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ href, icon: Icon, title, desc, tag }) => (
            <Link key={title} href={href} className="card card-hover group flex gap-3.5 p-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 group-hover:bg-brand-100">
                <Icon size={19} />
              </span>
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-[15px] font-bold text-ink">{title}</span>
                  <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">{tag}</span>
                </span>
                <span className="mt-1 block text-[13px] leading-6 text-ink-muted">{desc}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        {[
          { icon: NotebookPen, title: "选真题", desc: "从 2010–2026 中任选一套，先做客观题。" },
          { icon: Target, title: "练专项", desc: "阅读、完形、翻译、写作按题型集中突破。" },
          { icon: Heart, title: "看记录", desc: "错题自动收录，正确率与学习天数一目了然。" },
        ].map(({ icon: Icon, title, desc }, i) => (
          <div key={title} className="card flex items-start gap-3 p-5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-brand-600">
              <Icon size={18} />
            </span>
            <div>
              <p className="text-sm font-bold text-ink">
                <span className="mr-1.5 text-brand-500">0{i + 1}</span>
                {title}
              </p>
              <p className="mt-1 text-[13px] leading-6 text-ink-muted">{desc}</p>
            </div>
          </div>
        ))}
      </section>

      <p className="pb-2 text-center text-[12px] leading-6 text-ink-muted">
        真题原文与客观题答案来自原项目英语二语料；翻译参考译文由 Echo 生成，非官方答案。AI 批改结果仅供学习参考。
      </p>
    </div>
  );
}
