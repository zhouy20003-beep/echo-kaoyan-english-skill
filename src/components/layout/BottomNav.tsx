"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Library, Timer, MessageCircle, UserRound } from "lucide-react";

const ITEMS = [
  { href: "/", label: "首页", icon: Home },
  { href: "/papers", label: "真题", icon: Library },
  { href: "/mock", label: "模拟", icon: Timer },
  { href: "/ask", label: "答疑", icon: MessageCircle },
  { href: "/dashboard", label: "我的", icon: UserRound },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/95 backdrop-blur-xl lg:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition ${
                active ? "text-brand-600" : "text-ink-muted"
              }`}
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                  active ? "bg-brand-50" : ""
                }`}
              >
                <Icon size={19} strokeWidth={active ? 2.4 : 2} />
              </span>
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
