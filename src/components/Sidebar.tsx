"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { format, addDays, subDays, isToday } from "date-fns";
import { useRef } from "react";
import { ChevronLeft, ChevronRight, ListTodo, CalendarDays, BarChart3, Flame, Sun, Moon, Pencil, ClipboardList, Download, Upload, Keyboard, Zap, Repeat } from "lucide-react";
import { useTaskStore } from "@/store/taskStore";
import { useUIStore } from "@/store/uiStore";
import ProfilePanel from "./ProfilePanel";
import RecurringModal from "./RecurringModal";
import SyncStatusBar from "./SyncStatus";
import { useSync } from "@/hooks/useSync";

const navItems = [
  { href: "/",          icon: ListTodo,     label: "Today",    shortcut: "1" },
  { href: "/calendar",  icon: CalendarDays, label: "Calendar", shortcut: "2" },
  { href: "/stats",     icon: BarChart3,    label: "Stats",    shortcut: "3" },
  { href: "/review",    icon: ClipboardList, label: "Review",  shortcut: "4" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { selectedDate, setSelectedDate, currentStreak, longestStreak, dailyHistory } = useTaskStore();
  const { theme, toggleTheme, profile } = useUIStore();
  const [profileOpen, setProfileOpen]     = useState(false);
  const [recurringOpen, setRecurringOpen] = useState(false);
  const { status: syncStatus, push: syncNow } = useSync();
  const { exportData, importData } = useTaskStore();
  const importRef = useRef<HTMLInputElement>(null);

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = importData(ev.target?.result as string);
      if (!result.ok) alert(result.error ?? "Import failed.");
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  const date = new Date(selectedDate + "T12:00:00");
  const todaySelected = isToday(date);
  const totalDone = Object.values(dailyHistory).reduce((sum, d) => sum + d.completed, 0);

  return (
    <aside className="w-64 flex-shrink-0 h-full flex flex-col bg-sidebar-bg border-r border-binding/60 select-none">

      {/* Logo */}
      <div className="px-6 pt-7 pb-4 border-b border-binding/40">
        <div className="flex items-baseline gap-1.5">
          <span className="font-mono text-xl font-bold tracking-tight text-ink">daynode</span>
          <span className="font-mono text-xs text-ink-muted">/tasks</span>
          <span className="font-mono text-accent animate-blink text-sm leading-none">_</span>
        </div>
        <p className="text-[10px] font-mono text-ink-faint mt-0.5 tracking-wide">forge your day</p>
      </div>

      {/* Date block */}
      <div className="px-5 py-5 border-b border-binding/40">
        <p suppressHydrationWarning className="font-mono text-[10px] text-ink-faint uppercase tracking-widest mb-1">
          {format(date, "EEEE")}
        </p>
        <p suppressHydrationWarning className="font-mono text-2xl font-semibold text-ink leading-none">
          {format(date, "MMM dd")}
        </p>
        <p suppressHydrationWarning className="font-mono text-xs text-ink-muted mt-0.5">{format(date, "yyyy")}</p>

        <div className="flex items-center gap-2 mt-4">
          <button
            onClick={() => setSelectedDate(format(subDays(date, 1), "yyyy-MM-dd"))}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-binding/40 transition-colors text-ink-muted hover:text-ink"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setSelectedDate(format(new Date(), "yyyy-MM-dd"))}
            className={`flex-1 text-center text-[11px] font-mono font-medium rounded-lg py-1.5 transition-all ${
              todaySelected ? "bg-accent text-white shadow-sm" : "bg-binding/30 text-ink-muted hover:bg-binding/50"
            }`}
          >
            {todaySelected ? "today" : "go to today"}
          </button>
          <button
            onClick={() => setSelectedDate(format(addDays(date, 1), "yyyy-MM-dd"))}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-binding/40 transition-colors text-ink-muted hover:text-ink"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Streak */}
      {currentStreak > 0 && (
        <div className="mx-5 mt-4 px-3.5 py-3 rounded-xl bg-pending-soft border border-pending/20">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-pending flex-shrink-0" />
            <div>
              <p className="font-mono text-xs font-semibold text-pending">{currentStreak} day streak</p>
              <p className="text-[10px] text-ink-faint font-mono">best: {longestStreak}d · done: {totalDone}</p>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 mt-4">
        {navItems.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 transition-all ${
                active ? "bg-accent text-white shadow-sm" : "text-ink-muted hover:bg-binding/40 hover:text-ink"
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm font-semibold flex-1">{item.label}</span>
              <kbd className={`text-[9px] font-mono px-1.5 py-0.5 rounded border transition-colors ${
                active ? "border-white/30 text-white/60 bg-white/10" : "border-binding text-ink-faint bg-parchment group-hover:border-ink-muted"
              }`}>
                {item.shortcut}
              </kbd>
            </Link>
          );
        })}

        {/* Recurring tasks button */}
        <button
          onClick={() => setRecurringOpen(true)}
          className="group flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 transition-all text-ink-muted hover:bg-binding/40 hover:text-ink w-full"
        >
          <Repeat className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm font-semibold flex-1 text-left">Recurring</span>
        </button>
      </nav>

      {/* ── Bottom section ── */}
      <div className="px-4 pb-5 pt-3 border-t border-binding/40 flex flex-col gap-2">

        {/* Sync status */}
        <div className="px-3 py-2">
          <SyncStatusBar status={syncStatus} onSync={syncNow} />
        </div>

        {/* Quick capture hint */}
        <div className="flex items-center gap-2 px-3 py-1.5">
          <Zap className="w-3.5 h-3.5 text-ink-faint flex-shrink-0" />
          <span className="font-mono text-[9px] text-ink-faint flex-1">Quick Capture</span>
          <div className="flex gap-0.5">
            <kbd className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-parchment border border-binding text-ink-faint">⌘</kbd>
            <kbd className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-parchment border border-binding text-ink-faint">K</kbd>
          </div>
        </div>

        {/* Export / Import / Shortcuts row */}
        <div className="flex items-center gap-1 px-1">
          <button
            onClick={exportData}
            title="Export backup JSON"
            className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl text-ink-faint hover:bg-binding/40 hover:text-ink transition-all text-xs font-mono"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="text-[10px]">Export</span>
          </button>
          <button
            onClick={() => importRef.current?.click()}
            title="Import backup JSON"
            className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl text-ink-faint hover:bg-binding/40 hover:text-ink transition-all text-xs font-mono"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="text-[10px]">Import</span>
          </button>
          <button
            onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "?" }))}
            title="Keyboard shortcuts (?)"
            className="flex items-center justify-center w-9 h-9 rounded-xl text-ink-faint hover:bg-binding/40 hover:text-ink transition-all"
          >
            <Keyboard className="w-3.5 h-3.5" />
          </button>
          <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
        </div>

        {/* Dark mode toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-ink-muted hover:bg-binding/40 hover:text-ink transition-all w-full"
        >
          {theme === "dark"
            ? <Sun className="w-4 h-4 flex-shrink-0" />
            : <Moon className="w-4 h-4 flex-shrink-0" />}
          <span className="text-sm font-semibold flex-1 text-left">
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </span>
          {/* Toggle pill */}
          <div className={`relative w-9 h-5 rounded-full transition-colors ${theme === "dark" ? "bg-accent" : "bg-binding"}`}>
            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${theme === "dark" ? "translate-x-4" : "translate-x-0.5"}`} />
          </div>
        </button>

        {/* Profile row */}
        <button
          onClick={() => setProfileOpen(true)}
          className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-binding/40 transition-all w-full group"
        >
          {/* Avatar */}
          <div
            className="w-9 h-9 rounded-xl flex-shrink-0 overflow-hidden flex items-center justify-center shadow-sm"
            style={{ background: profile.avatarUrl ? undefined : "linear-gradient(135deg, #667eea, #764ba2)" }}
          >
            {profile.avatarUrl
              ? <img src={profile.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
              : <span className="text-lg">{profile.emoji}</span>
            }
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-semibold text-ink truncate leading-tight">{profile.name}</p>
            <p className="font-mono text-[9px] text-ink-faint leading-tight mt-0.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-done inline-block" />
              active
            </p>
          </div>
          <Pencil className="w-3.5 h-3.5 text-ink-faint opacity-0 group-hover:opacity-100 flex-shrink-0 transition-opacity" />
        </button>
      </div>

      <ProfilePanel open={profileOpen} onClose={() => setProfileOpen(false)} />
      <RecurringModal open={recurringOpen} onClose={() => setRecurringOpen(false)} />
    </aside>
  );
}
