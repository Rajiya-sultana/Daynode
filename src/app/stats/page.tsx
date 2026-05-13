"use client";

import { useMemo } from "react";
import { format, subDays, eachDayOfInterval } from "date-fns";
import { Flame, Target, CheckCircle2, TrendingUp, Tag, Clock } from "lucide-react";
import { useTaskStore, STATUS_META } from "@/store/taskStore";
import Sidebar from "@/components/Sidebar";

function StatCard({
  icon: Icon, label, value, sub, color = "#5B8DEF",
}: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color?: string;
}) {
  return (
    <div className="bg-paper rounded-2xl p-5 border border-binding/50 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-widest text-ink-faint">{label}</span>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: color + "18" }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
      </div>
      <div>
        <p className="font-mono text-3xl font-bold text-ink leading-none">{value}</p>
        {sub && <p className="font-mono text-[10px] text-ink-faint mt-1">{sub}</p>}
      </div>
    </div>
  );
}

export default function StatsPage() {
  const { tasks, currentStreak, longestStreak, tags } = useTaskStore();

  const stats = useMemo(() => {
    const total     = tasks.length;
    const completed = tasks.filter((t) => t.status === "completed").length;
    const cancelled = tasks.filter((t) => t.status === "cancelled").length;
    const blocked   = tasks.filter((t) => t.status === "blocked").length;
    const inProg    = tasks.filter((t) => t.status === "in-progress").length;
    const rate      = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Last 7 days
    const last7 = eachDayOfInterval({ start: subDays(new Date(), 6), end: new Date() }).map((day) => {
      const key    = format(day, "yyyy-MM-dd");
      const daily  = tasks.filter((t) => t.date === key);
      const done   = daily.filter((t) => t.status === "completed").length;
      return { date: day, label: format(day, "EEE"), total: daily.length, done, pct: daily.length > 0 ? done / daily.length : 0 };
    });

    // Last 30 days
    const last30 = eachDayOfInterval({ start: subDays(new Date(), 29), end: new Date() }).map((day) => {
      const key   = format(day, "yyyy-MM-dd");
      const daily = tasks.filter((t) => t.date === key);
      const done  = daily.filter((t) => t.status === "completed").length;
      return { date: day, total: daily.length, done };
    });

    // Tag breakdown
    const tagBreakdown = tags.map((tag) => {
      const tagged = tasks.filter((t) => t.tags.includes(tag.id));
      const done   = tagged.filter((t) => t.status === "completed").length;
      return { tag, total: tagged.length, done };
    }).filter((t) => t.total > 0).sort((a, b) => b.total - a.total);

    // Status breakdown
    const statusBreakdown = Object.entries(STATUS_META).map(([key, meta]) => ({
      status: key, meta, count: tasks.filter((t) => t.status === key).length,
    })).filter((s) => s.count > 0);

    // Best day of week
    const dayTotals: Record<string, { total: number; done: number }> = {};
    tasks.forEach((t) => {
      const day = format(new Date(t.date + "T12:00:00"), "EEEE");
      if (!dayTotals[day]) dayTotals[day] = { total: 0, done: 0 };
      dayTotals[day].total++;
      if (t.status === "completed") dayTotals[day].done++;
    });
    const bestDay = Object.entries(dayTotals)
      .sort((a, b) => b[1].done - a[1].done)[0]?.[0] ?? "—";

    return { total, completed, cancelled, blocked, inProg, rate, last7, last30, tagBreakdown, statusBreakdown, bestDay };
  }, [tasks, tags]);

  const maxLast7 = Math.max(...stats.last7.map((d) => d.total), 1);

  return (
    <div className="flex h-full w-full overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden bg-paper">
        {/* Header */}
        <header className="px-8 py-5 border-b border-ruled/60 flex-shrink-0">
          <p className="font-mono text-[10px] text-ink-faint uppercase tracking-widest mb-0.5">overview</p>
          <h1 className="text-xl font-bold text-ink">Your Stats</h1>
        </header>

        <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-8">

          {/* ── Key metrics ── */}
          <div className="grid grid-cols-4 gap-4">
            <StatCard icon={Target}       label="Total Tasks"      value={stats.total}       sub="all time"                     color="#5B8DEF" />
            <StatCard icon={CheckCircle2} label="Completed"        value={stats.completed}   sub={`${stats.rate}% completion rate`} color="#5BAD8A" />
            <StatCard icon={Flame}        label="Current Streak"   value={`${currentStreak}d`}  sub={`best: ${longestStreak} days`} color="#F0A057" />
            <StatCard icon={TrendingUp}   label="Best Day"         value={stats.bestDay}     sub="most tasks completed"         color="#8B6DAF" />
          </div>

          {/* ── Two columns ── */}
          <div className="grid grid-cols-2 gap-6">

            {/* Weekly bar chart */}
            <div className="bg-paper rounded-2xl p-5 border border-binding/50">
              <p className="font-mono text-[10px] uppercase tracking-widest text-ink-faint mb-1">Last 7 days</p>
              <p className="text-base font-bold text-ink mb-5">Completion by day</p>
              <div className="flex items-end gap-2 h-32">
                {stats.last7.map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex flex-col justify-end rounded-t-lg overflow-hidden" style={{ height: "100px" }}>
                      {/* Total bar (background) */}
                      <div
                        className="w-full relative rounded-t-lg overflow-hidden"
                        style={{
                          height: d.total > 0 ? `${(d.total / maxLast7) * 100}%` : "4px",
                          backgroundColor: "#DDD5C8",
                          minHeight: "4px",
                        }}
                      >
                        {/* Completed overlay */}
                        {d.done > 0 && (
                          <div
                            className="absolute bottom-0 w-full rounded-t-lg transition-all"
                            style={{ height: `${d.pct * 100}%`, backgroundColor: "#5BAD8A" }}
                          />
                        )}
                      </div>
                    </div>
                    <span className="font-mono text-[9px] text-ink-faint">{d.label}</span>
                    {d.total > 0 && (
                      <span className="font-mono text-[9px] font-semibold text-ink">{d.done}/{d.total}</span>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-4 mt-4 pt-3 border-t border-binding/30">
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-done" /><span className="font-mono text-[10px] text-ink-faint">Completed</span></div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-ruled" /><span className="font-mono text-[10px] text-ink-faint">Total</span></div>
              </div>
            </div>

            {/* Status breakdown */}
            <div className="bg-paper rounded-2xl p-5 border border-binding/50">
              <p className="font-mono text-[10px] uppercase tracking-widest text-ink-faint mb-1">Status breakdown</p>
              <p className="text-base font-bold text-ink mb-5">All tasks by status</p>
              <div className="flex flex-col gap-3">
                {stats.statusBreakdown.map(({ status, meta, count }) => (
                  <div key={status} className="flex items-center gap-3">
                    <span className="font-mono text-sm w-5 text-center" style={{ color: meta.color }}>{meta.icon}</span>
                    <span className="text-xs font-semibold text-ink w-24 flex-shrink-0">{meta.label}</span>
                    <div className="flex-1 h-2 bg-ruled/60 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${(count / stats.total) * 100}%`, backgroundColor: meta.color }}
                      />
                    </div>
                    <span className="font-mono text-[10px] text-ink-muted w-6 text-right">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── 30-day trend ── */}
          <div className="bg-paper rounded-2xl p-5 border border-binding/50">
            <p className="font-mono text-[10px] uppercase tracking-widest text-ink-faint mb-1">30-day trend</p>
            <p className="text-base font-bold text-ink mb-5">Daily activity</p>
            <div className="flex items-end gap-0.5 h-16">
              {stats.last30.map((d, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t transition-all"
                  style={{
                    height: d.total > 0 ? `${Math.max(8, (d.done / Math.max(...stats.last30.map((x) => x.total), 1)) * 100)}%` : "4px",
                    backgroundColor: d.total === 0 ? "#DDD5C8" : d.done === d.total && d.total > 0 ? "#5BAD8A" : "#5B8DEF",
                    opacity: d.total === 0 ? 0.3 : 1,
                    minHeight: "4px",
                  }}
                  title={`${format(d.date, "MMM d")}: ${d.done}/${d.total}`}
                />
              ))}
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="font-mono text-[9px] text-ink-faint">{format(subDays(new Date(), 29), "MMM d")}</span>
              <span className="font-mono text-[9px] text-ink-faint">Today</span>
            </div>
          </div>

          {/* ── Tag breakdown ── */}
          {stats.tagBreakdown.length > 0 && (
            <div className="bg-paper rounded-2xl p-5 border border-binding/50">
              <div className="flex items-center gap-2 mb-1">
                <Tag className="w-3.5 h-3.5 text-ink-faint" />
                <p className="font-mono text-[10px] uppercase tracking-widest text-ink-faint">By tag</p>
              </div>
              <p className="text-base font-bold text-ink mb-5">Tasks per category</p>
              <div className="flex flex-col gap-3">
                {stats.tagBreakdown.map(({ tag, total, done }) => (
                  <div key={tag.id} className="flex items-center gap-3">
                    <span
                      className="font-mono text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded flex-shrink-0 w-20 text-center"
                      style={{ backgroundColor: tag.color + "18", color: tag.color }}
                    >
                      #{tag.name.toLowerCase()}
                    </span>
                    <div className="flex-1 h-2 bg-ruled/60 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${(done / total) * 100}%`, backgroundColor: tag.color }}
                      />
                    </div>
                    <span className="font-mono text-[10px] text-ink-muted whitespace-nowrap">
                      {done}/{total} done
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Insight cards ── */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-paper rounded-2xl p-4 border border-binding/50">
              <Clock className="w-4 h-4 text-ink-faint mb-2" />
              <p className="font-mono text-[10px] text-ink-faint uppercase tracking-wide mb-1">Blocked tasks</p>
              <p className="font-mono text-2xl font-bold text-urgent">{stats.blocked}</p>
              <p className="font-mono text-[9px] text-ink-faint mt-1">need your attention</p>
            </div>
            <div className="bg-paper rounded-2xl p-4 border border-binding/50">
              <p className="font-mono text-[10px] text-ink-faint uppercase tracking-wide mb-1">In progress</p>
              <p className="font-mono text-2xl font-bold text-pending">{stats.inProg}</p>
              <p className="font-mono text-[9px] text-ink-faint mt-1">currently working on</p>
            </div>
            <div className="bg-paper rounded-2xl p-4 border border-binding/50">
              <p className="font-mono text-[10px] text-ink-faint uppercase tracking-wide mb-1">Cancelled</p>
              <p className="font-mono text-2xl font-bold text-ink-muted">{stats.cancelled}</p>
              <p className="font-mono text-[9px] text-ink-faint mt-1">decided not to do</p>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
