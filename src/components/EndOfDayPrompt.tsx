"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, CheckCircle2, Circle, AlertCircle, ArrowRight, Clock, BookOpen } from "lucide-react";
import { format } from "date-fns";
import { useTaskStore, STATUS_META } from "@/store/taskStore";
import { useUIStore } from "@/store/uiStore";

const REVIEW_HOUR = 18; // 6 PM

export default function EndOfDayPrompt() {
  const { tasks, journals, setJournal }          = useTaskStore();
  const { lastReviewDate, setLastReviewDate }     = useUIStore();
  const [open, setOpen]       = useState(false);
  const [dismissed, setDismissed] = useState(false); // session-only dismiss
  const [reflection, setReflection] = useState("");
  const [saved, setSaved]     = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const today    = format(new Date(), "yyyy-MM-dd");
  const reviewKey = `review-${today}`;

  // Decide whether to show
  useEffect(() => {
    function check() {
      const hour = new Date().getHours();
      const hasReviewedToday = lastReviewDate === today;
      const todayTasks = tasks.filter((t) => t.date === today);
      if (hour >= REVIEW_HOUR && !hasReviewedToday && !dismissed && todayTasks.length > 0) {
        setReflection(journals[reviewKey] ?? "");
        setOpen(true);
      }
    }
    check();
    const id = setInterval(check, 60_000); // re-check every minute
    return () => clearInterval(id);
  }, [lastReviewDate, dismissed, today]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-save reflection
  useEffect(() => {
    clearTimeout(timerRef.current);
    if (!reflection) return;
    setSaved(false);
    timerRef.current = setTimeout(() => {
      setJournal(reviewKey, reflection);
      setSaved(true);
    }, 800);
    return () => clearTimeout(timerRef.current);
  }, [reflection]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleDone() {
    setLastReviewDate(today);
    setOpen(false);
  }

  function handleLater() {
    setDismissed(true);
    setOpen(false);
  }

  function handleGoToReview() {
    setLastReviewDate(today);
    setOpen(false);
    window.location.href = "/review";
  }

  // Today's task data
  const todayTasks   = tasks.filter((t) => t.date === today);
  const completed    = todayTasks.filter((t) => t.status === "completed");
  const blocked      = todayTasks.filter((t) => t.status === "blocked");
  const incomplete   = todayTasks.filter((t) => t.status !== "completed" && t.status !== "cancelled");
  const pct          = todayTasks.length > 0 ? Math.round((completed.length / todayTasks.length) * 100) : 0;
  const allDone      = todayTasks.length > 0 && completed.length === todayTasks.length;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-ink/30 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: "spring", stiffness: 340, damping: 28 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none"
          >
            <div className="w-full max-w-md bg-paper border border-binding/60 rounded-3xl shadow-2xl pointer-events-auto overflow-hidden">

              {/* Header */}
              <div className="px-7 pt-7 pb-5 border-b border-binding/40">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-9 h-9 rounded-xl bg-accent-soft flex items-center justify-center">
                    <Moon className="w-4 h-4 text-accent" />
                  </div>
                  <div>
                    <p className="font-mono text-[10px] text-ink-faint uppercase tracking-widest">end of day</p>
                    <h2 className="font-bold text-ink text-base leading-tight">
                      {format(new Date(), "EEEE, MMM d")}
                    </h2>
                  </div>
                </div>
              </div>

              <div className="px-7 py-5 space-y-5">

                {/* Progress summary */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[10px] text-ink-faint uppercase tracking-widest">today's progress</span>
                    <span className={`font-mono text-sm font-bold ${allDone ? "text-done" : "text-ink"}`}>
                      {completed.length} / {todayTasks.length}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-ruled rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: allDone ? "#5BAD8A" : "#5B8DEF" }}
                    />
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="flex items-center gap-1 font-mono text-[10px] text-done">
                      <CheckCircle2 className="w-3 h-3" />{completed.length} done
                    </span>
                    {incomplete.length > 0 && (
                      <span className="flex items-center gap-1 font-mono text-[10px] text-ink-muted">
                        <Circle className="w-3 h-3" />{incomplete.length} open
                      </span>
                    )}
                    {blocked.length > 0 && (
                      <span className="flex items-center gap-1 font-mono text-[10px] text-urgent">
                        <AlertCircle className="w-3 h-3" />{blocked.length} blocked
                      </span>
                    )}
                  </div>
                </div>

                {/* Blocked / incomplete tasks — max 3 */}
                {(blocked.length > 0 || incomplete.length > 0) && (
                  <div className="bg-parchment rounded-2xl border border-binding/40 divide-y divide-binding/30">
                    {[...blocked, ...incomplete.filter((t) => t.status !== "blocked")]
                      .slice(0, 3)
                      .map((t) => {
                        const meta = STATUS_META[t.status];
                        return (
                          <div key={t.id} className="flex items-center gap-2.5 px-4 py-2.5">
                            <span className="text-xs flex-shrink-0" style={{ color: meta.color }}>{meta.icon}</span>
                            <p className="text-xs text-ink truncate flex-1">{t.title}</p>
                            <span className="font-mono text-[9px] text-ink-faint flex-shrink-0">{meta.label}</span>
                          </div>
                        );
                      })}
                    {(blocked.length + incomplete.length) > 3 && (
                      <p className="px-4 py-2 font-mono text-[9px] text-ink-faint">
                        +{blocked.length + incomplete.length - 3} more
                      </p>
                    )}
                  </div>
                )}

                {/* Reflection */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <BookOpen className="w-3 h-3 text-ink-faint" />
                    <span className="font-mono text-[10px] text-ink-faint uppercase tracking-widest">2-min reflection</span>
                    {reflection && (
                      <span className={`ml-auto font-mono text-[9px] transition-colors ${saved ? "text-done" : "text-pending"}`}>
                        {saved ? "✓ saved" : "saving…"}
                      </span>
                    )}
                  </div>
                  <textarea
                    value={reflection}
                    onChange={(e) => setReflection(e.target.value)}
                    placeholder={"What went well today?\nWhat slowed you down?\nTop 3 for tomorrow?"}
                    rows={4}
                    className="w-full bg-parchment border border-binding/40 rounded-xl px-4 py-3 text-sm text-ink placeholder:text-ink-faint/50 outline-none resize-none leading-relaxed focus:border-accent transition-colors"
                  />
                </div>

                {/* Time indicator */}
                <div className="flex items-center gap-1.5 text-ink-faint">
                  <Clock className="w-3 h-3" />
                  <span className="font-mono text-[9px]">
                    {format(new Date(), "h:mm a")} · end of day check-in
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div className="px-7 pb-6 flex items-center gap-2">
                <button
                  onClick={handleLater}
                  className="px-4 py-2.5 rounded-xl border border-binding text-ink-muted text-sm font-semibold hover:bg-binding/30 transition-colors font-mono text-xs"
                >
                  Later
                </button>
                <button
                  onClick={handleGoToReview}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-binding text-ink-muted text-sm font-semibold hover:bg-binding/30 transition-colors font-mono text-xs"
                >
                  Full review
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleDone}
                  className="flex-1 py-2.5 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent-dim transition-colors font-mono text-xs"
                >
                  Done for today
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
