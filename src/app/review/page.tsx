"use client";

import { useState, useEffect, useRef } from "react";
import { format, subDays, startOfWeek, eachDayOfInterval } from "date-fns";
import { ClipboardList, CheckCircle2, Circle, AlertCircle, RefreshCw, BookOpen } from "lucide-react";
import { useTaskStore, STATUS_META, type Task } from "@/store/taskStore";
import Sidebar from "@/components/Sidebar";

export default function ReviewPage() {
  const { tasks, dailyHistory, journals, setJournal } = useTaskStore();

  // This week: Mon → today
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: today });

  // Reflection note
  const reviewDate = format(today, "yyyy-MM-dd");
  const reviewKey  = `review-${reviewDate}`;
  const [reflection, setReflection] = useState(journals[reviewKey] ?? "");
  const [saved, setSaved] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    setReflection(journals[reviewKey] ?? "");
    setSaved(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviewKey]);

  useEffect(() => {
    clearTimeout(timer.current);
    if (reflection === (journals[reviewKey] ?? "")) { setSaved(true); return; }
    setSaved(false);
    timer.current = setTimeout(() => {
      setJournal(reviewKey, reflection);
      setSaved(true);
    }, 800);
    return () => clearTimeout(timer.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reflection]);

  // Carry-over tasks: incomplete tasks from the past 7 days (not today)
  const carryOver: Task[] = tasks.filter((t) => {
    if (t.status === "completed" || t.status === "cancelled") return false;
    const taskDate = new Date(t.date + "T12:00:00");
    const cutoff   = subDays(today, 7);
    return taskDate >= cutoff && format(taskDate, "yyyy-MM-dd") !== format(today, "yyyy-MM-dd");
  });

  // Weekly stats
  const weekTotal     = days.reduce((sum, d) => sum + (dailyHistory[format(d, "yyyy-MM-dd")]?.total ?? 0), 0);
  const weekCompleted = days.reduce((sum, d) => sum + (dailyHistory[format(d, "yyyy-MM-dd")]?.completed ?? 0), 0);
  const weekPct       = weekTotal > 0 ? Math.round((weekCompleted / weekTotal) * 100) : 0;

  // Status breakdown for the week
  const weekTasks = tasks.filter((t) => {
    const d = new Date(t.date + "T12:00:00");
    return d >= weekStart && d <= today;
  });
  const statusCounts = weekTasks.reduce<Record<string, number>>((acc, t) => {
    acc[t.status] = (acc[t.status] ?? 0) + 1;
    return acc;
  }, {});

  // Best day this week
  const bestDay = days.reduce<{ date: string; pct: number } | null>((best, d) => {
    const key = format(d, "yyyy-MM-dd");
    const h   = dailyHistory[key];
    if (!h || h.total === 0) return best;
    const pct = Math.round((h.completed / h.total) * 100);
    return !best || pct > best.pct ? { date: key, pct } : best;
  }, null);

  return (
    <div className="flex h-full w-full overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden bg-paper">
        {/* Header */}
        <header className="flex items-center gap-4 px-8 py-5 border-b border-ruled/80 bg-paper/90 backdrop-blur-sm flex-shrink-0">
          <ClipboardList className="w-5 h-5 text-accent flex-shrink-0" />
          <div>
            <p className="font-mono text-[10px] text-ink-faint uppercase tracking-widest">weekly review</p>
            <p className="font-semibold text-ink text-sm mt-0.5">
              Week of {format(weekStart, "MMM d")} – {format(today, "MMM d, yyyy")}
            </p>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8">

          {/* ── Stats row ── */}
          <section>
            <h2 className="font-mono text-[10px] uppercase tracking-widest text-ink-faint mb-3">This week at a glance</h2>
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: "Tasks created",   value: weekTotal,     icon: Circle,        color: "text-ink-muted" },
                { label: "Completed",       value: weekCompleted, icon: CheckCircle2,  color: "text-done"      },
                { label: "Carry-overs",     value: carryOver.length, icon: RefreshCw,  color: "text-pending"   },
                { label: "Completion rate", value: `${weekPct}%`, icon: ClipboardList, color: "text-accent"    },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="bg-parchment rounded-2xl border border-binding/40 px-5 py-4">
                  <Icon className={`w-4 h-4 ${color} mb-2`} />
                  <p className="font-mono text-2xl font-bold text-ink">{value}</p>
                  <p className="font-mono text-[10px] text-ink-faint mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Day-by-day bar ── */}
          <section>
            <h2 className="font-mono text-[10px] uppercase tracking-widest text-ink-faint mb-3">Daily breakdown</h2>
            <div className="bg-parchment rounded-2xl border border-binding/40 px-6 py-5">
              <div className="flex items-end gap-3 h-24">
                {days.map((d) => {
                  const key  = format(d, "yyyy-MM-dd");
                  const h    = dailyHistory[key];
                  const pct  = h && h.total > 0 ? (h.completed / h.total) : 0;
                  const isT  = format(d, "yyyy-MM-dd") === format(today, "yyyy-MM-dd");
                  return (
                    <div key={key} className="flex-1 flex flex-col items-center gap-1.5">
                      <div className="w-full flex-1 flex items-end">
                        <div
                          className={`w-full rounded-t-lg transition-all ${isT ? "bg-accent" : "bg-accent/40"}`}
                          style={{ height: `${Math.max(pct * 100, h?.total ? 8 : 0)}%` }}
                        />
                      </div>
                      <span className="font-mono text-[9px] text-ink-faint">{format(d, "EEE")}</span>
                      {h && h.total > 0 && (
                        <span className="font-mono text-[9px] text-ink-muted">{h.completed}/{h.total}</span>
                      )}
                    </div>
                  );
                })}
              </div>
              {bestDay && (
                <p className="font-mono text-[10px] text-ink-faint mt-3">
                  🏆 Best day: <span className="text-done font-semibold">{format(new Date(bestDay.date + "T12:00:00"), "EEE MMM d")}</span> — {bestDay.pct}% complete
                </p>
              )}
            </div>
          </section>

          {/* ── Status breakdown ── */}
          {weekTasks.length > 0 && (
            <section>
              <h2 className="font-mono text-[10px] uppercase tracking-widest text-ink-faint mb-3">Status breakdown</h2>
              <div className="bg-parchment rounded-2xl border border-binding/40 px-6 py-5 space-y-2.5">
                {Object.entries(statusCounts)
                  .sort((a, b) => b[1] - a[1])
                  .map(([status, count]) => {
                    const meta = STATUS_META[status as keyof typeof STATUS_META];
                    const pct  = Math.round((count / weekTasks.length) * 100);
                    return (
                      <div key={status} className="flex items-center gap-3">
                        <span className="font-mono text-[10px] w-24 text-ink-muted flex-shrink-0">{meta.label}</span>
                        <div className="flex-1 h-2 bg-ruled rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: meta.color }} />
                        </div>
                        <span className="font-mono text-[10px] text-ink-faint w-8 text-right">{count}</span>
                      </div>
                    );
                  })}
              </div>
            </section>
          )}

          {/* ── Carry-over tasks ── */}
          {carryOver.length > 0 && (
            <section>
              <h2 className="font-mono text-[10px] uppercase tracking-widest text-ink-faint mb-3">
                Carry-over tasks ({carryOver.length})
              </h2>
              <div className="bg-parchment rounded-2xl border border-binding/40 divide-y divide-ruled/40">
                {carryOver.map((t) => {
                  const meta = STATUS_META[t.status];
                  return (
                    <div key={t.id} className="flex items-center gap-3 px-5 py-3">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: meta.color }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-ink truncate">{t.title}</p>
                        <p className="font-mono text-[10px] text-ink-faint">
                          {format(new Date(t.date + "T12:00:00"), "EEE, MMM d")} · {meta.label}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── Reflection ── */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-3.5 h-3.5 text-ink-faint" />
              <h2 className="font-mono text-[10px] uppercase tracking-widest text-ink-faint">Weekly reflection</h2>
              <span className={`ml-auto font-mono text-[9px] transition-colors ${saved ? "text-done" : "text-pending"}`}>
                {saved ? "✓ saved" : "saving…"}
              </span>
            </div>
            <div className="bg-parchment rounded-2xl border border-binding/40 p-5">
              <textarea
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                placeholder={"What went well this week?\nWhat could you do better?\nWhat are your top priorities for next week?"}
                rows={6}
                className="w-full bg-transparent text-sm text-ink placeholder:text-ink-faint/50 outline-none resize-none leading-relaxed"
              />
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}
