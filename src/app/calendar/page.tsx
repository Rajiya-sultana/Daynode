"use client";

import { useState } from "react";
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { useTaskStore } from "@/store/taskStore";
import Sidebar from "@/components/Sidebar";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarPage() {
  const { tasks, selectedDate, setSelectedDate } = useTaskStore();
  const [viewMonth, setViewMonth] = useState(new Date(selectedDate + "T12:00:00"));

  const monthStart  = startOfMonth(viewMonth);
  const monthEnd    = endOfMonth(viewMonth);
  const calStart    = startOfWeek(monthStart);
  const calEnd      = endOfWeek(monthEnd);
  const allDays     = eachDayOfInterval({ start: calStart, end: calEnd });

  function getDayData(date: Date) {
    const key   = format(date, "yyyy-MM-dd");
    const daily = tasks.filter((t) => t.date === key);
    const done  = daily.filter((t) => t.status === "completed").length;
    const blocked = daily.filter((t) => t.status === "blocked").length;
    const inProg  = daily.filter((t) => t.status === "in-progress").length;
    return { total: daily.length, done, blocked, inProg };
  }

  function handleDayClick(date: Date) {
    setSelectedDate(format(date, "yyyy-MM-dd"));
    window.location.href = "/";
  }

  return (
    <div className="flex h-full w-full overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden bg-paper">

        {/* Header */}
        <header className="flex items-center justify-between px-8 py-5 border-b border-ruled/60 flex-shrink-0">
          <div>
            <p className="font-mono text-[10px] text-ink-faint uppercase tracking-widest mb-0.5">
              task calendar
            </p>
            <h1 className="text-xl font-bold text-ink">
              {format(viewMonth, "MMMM yyyy")}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMonth(subMonths(viewMonth, 1))}
              className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-binding/40 transition-colors text-ink-muted hover:text-ink border border-binding"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMonth(new Date())}
              className="font-mono text-xs px-3 py-2 rounded-xl border border-binding text-ink-muted hover:bg-binding/40 transition-colors"
            >
              This month
            </button>
            <button
              onClick={() => setViewMonth(addMonths(viewMonth, 1))}
              className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-binding/40 transition-colors text-ink-muted hover:text-ink border border-binding"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-8 py-6">

          {/* Day labels */}
          <div className="grid grid-cols-7 mb-2">
            {DAY_LABELS.map((d) => (
              <div key={d} className="text-center font-mono text-[10px] uppercase tracking-widest text-ink-faint py-2">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {allDays.map((day) => {
              const { total, done, blocked, inProg } = getDayData(day);
              const isCurrentMonth = isSameMonth(day, viewMonth);
              const isSelected     = isSameDay(day, new Date(selectedDate + "T12:00:00"));
              const isCurrentDay   = isToday(day);
              const pct            = total > 0 ? done / total : 0;
              const allDone        = total > 0 && done === total;

              return (
                <motion.button
                  key={day.toISOString()}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleDayClick(day)}
                  className={`relative flex flex-col p-3 rounded-2xl min-h-[88px] transition-all text-left border ${
                    isSelected
                      ? "bg-accent text-white border-accent shadow-md shadow-accent/20"
                      : isCurrentDay
                      ? "bg-accent-soft border-accent/40"
                      : isCurrentMonth
                      ? "bg-paper border-binding/50 hover:border-binding hover:bg-binding/10"
                      : "bg-parchment/50 border-transparent text-ink-faint"
                  }`}
                >
                  {/* Date number */}
                  <span className={`font-mono text-sm font-bold leading-none ${
                    isSelected    ? "text-white"
                    : isCurrentDay ? "text-accent"
                    : isCurrentMonth ? "text-ink"
                    : "text-ink-faint"
                  }`}>
                    {format(day, "d")}
                  </span>

                  {/* Task summary */}
                  {total > 0 && (
                    <div className="flex flex-col gap-1.5 mt-auto pt-2">
                      {/* Progress bar */}
                      <div className={`h-1 rounded-full overflow-hidden ${isSelected ? "bg-white/20" : "bg-binding/50"}`}>
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${pct * 100}%`,
                            backgroundColor: isSelected ? "white" : allDone ? "#5BAD8A" : "#5B8DEF",
                          }}
                        />
                      </div>
                      {/* Dots */}
                      <div className="flex items-center gap-1 flex-wrap">
                        {inProg > 0 && (
                          <span className={`font-mono text-[8px] font-semibold px-1 py-0.5 rounded ${isSelected ? "bg-white/20 text-white" : "bg-pending-soft text-pending"}`}>
                            ◑{inProg}
                          </span>
                        )}
                        {blocked > 0 && (
                          <span className={`font-mono text-[8px] font-semibold px-1 py-0.5 rounded ${isSelected ? "bg-white/20 text-white" : "bg-urgent-soft text-urgent"}`}>
                            ⊗{blocked}
                          </span>
                        )}
                        <span className={`font-mono text-[8px] ${isSelected ? "text-white/60" : "text-ink-faint"}`}>
                          {done}/{total}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* All-done glow */}
                  {allDone && !isSelected && (
                    <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-done shadow-sm" />
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-6 mt-6 pt-4 border-t border-ruling/40">
            {[
              { color: "#5BAD8A", dot: true, label: "All tasks done" },
              { color: "#5B8DEF", label: "In progress" },
              { color: "#F0A057", label: "◑ Working" },
              { color: "#E88C8C", label: "⊗ Blocked" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="font-mono text-[10px] text-ink-faint">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
