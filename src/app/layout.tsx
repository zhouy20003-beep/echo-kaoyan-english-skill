import type { Metadata, Viewport } from "next";
import "./globals.css";
import TopNav from "@/components/layout/TopNav";
import BottomNav from "@/components/layout/BottomNav";

export const metadata: Metadata = {
  title: {
    default: "桃子的考研英语（二）AI 学习平台",
    template: "%s · 桃子的考研英语（二）",
  },
  description:
    "考研英语（二）AI 学习平台：2010–2026 历年真题、阅读理解、完形填空、翻译批改、作文批改、AI 模拟考试、错题本与学习统计。免登录，打开即用。",
  applicationName: "桃子的考研英语（二）",
  keywords: ["考研英语二", "英语二真题", "AI 作文批改", "AI 翻译批改", "考研英语"],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#2563eb",
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <TopNav />
        <main className="min-h-[calc(100vh-64px)] pb-24 pt-4 sm:pt-6 lg:pb-10">{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}
