"use client";

import { CalendarDays, BarChart3, ListTodo, Inbox, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", icon: ListTodo, label: "Today" },
  { href: "/calendar", icon: CalendarDays, label: "Calendar" },
  { href: "/inbox", icon: Inbox, label: "Inbox" },
  { href: "/stats",   icon: BarChart3,  label: "Stats"  },
  { href: "/vision",  icon: Sparkles,   label: "Vision" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-lg border-t border-border z-30">
      <div className="grid grid-cols-5 w-full py-1">
        {navItems.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 py-1.5 rounded-xl transition-colors ${
                active ? "text-lavender" : "text-muted hover:text-foreground"
              }`}
            >
              <Icon
                className={`w-5 h-5 transition-transform ${
                  active ? "scale-110" : ""
                }`}
              />
              <span className="text-[10px] font-bold">{item.label}</span>
              {active && (
                <div className="w-1 h-1 rounded-full bg-lavender" />
              )}
            </Link>
          );
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
