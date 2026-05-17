"use client";

import { useState, useEffect } from "react";
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isToday, isSameDay,
  addMonths, subMonths, addWeeks, subWeeks, addDays,
} from "date-fns";
import { ChevronLeft, ChevronRight, CalendarDays, LayoutGrid } from "lucide-react";
import { motion } from "framer-motion";
import { useTaskStore, type Task, STATUS_META } from "@/store/taskStore";
import Sidebar from "@/components/Sidebar";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type ViewMode = "month" | "week";

export default function CalendarPage() {
  const { tasks, selectedDate, setSelectedDate, updateTask, generateForDate } = useTaskStore();
  const [view, setView]           = useState<ViewMode>("month");
  const [viewMonth, setViewMonth] = useState(new Date(selectedDate + "T12:00:00"));
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(selectedDate + "T12:00:00")));

  // Drag state
  const [dragTaskId, setDragTaskId]     = useState<string | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);

  const weekDays = eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) });

  // Generate recurring tasks for each day in the visible week
  useEffect(() => {
    if (view === "week") weekDays.forEach((d) => generateForDate(format(d, "yyyy-MM-dd")));
  }, [weekStart, view]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Month helpers ─────────────────────────────────────────────────────────
  const monthStart = startOfMonth(viewMonth);
  const monthEnd   = endOfMonth(viewMonth);
  const calStart   = startOfWeek(monthStart);
  const calEnd     = endOfWeek(monthEnd);
  const allDays    = eachDayOfInterval({ start: calStart, end: calEnd });

  function getDayData(date: Date) {
    const key     = format(date, "yyyy-MM-dd");
    const daily   = tasks.filter((t) => t.date === key);
    const done    = daily.filter((t) => t.status === "completed").length;
    const blocked = daily.filter((t) => t.status === "blocked").length;
    const inProg  = daily.filter((t) => t.status === "in-progress").length;
    return { total: daily.length, done, blocked, inProg };
  }

  function handleMonthDayClick(date: Date) {
    setSelectedDate(format(date, "yyyy-MM-dd"));
    window.location.href = "/";
  }

  // ── Week / drag helpers ───────────────────────────────────────────────────
  function getWeekTasks(dateKey: string) {
    return tasks
      .filter((t) => t.date === dateKey)
      .sort((a, b) => a.order - b.order);
  }

  function handleDrop(targetDate: string) {
    if (!dragTaskId || dragOverDate === null) return;
    const task = tasks.find((t) => t.id === dragTaskId);
    if (!task || task.date === targetDate) { resetDrag(); return; }
    const targetOrder = tasks.filter((t) => t.date === targetDate).length;
    updateTask(dragTaskId, { date: targetDate, order: targetOrder });
    setSelectedDate(targetDate);
    resetDrag();
  }

  function resetDrag() {
    setDragTaskId(null);
    setDragOverDate(null);
  }

  function fmtMin(m: number) {
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60), rem = m % 60;
    return rem ? `${h}h ${rem}m` : `${h}h`;
  }

  // ── Shared header ─────────────────────────────────────────────────────────
  const headerTitle = view === "month"
    ? format(viewMonth, "MMMM yyyy")
    : `${format(weekStart, "MMM d")} – ${format(addDays(weekStart, 6), "MMM d, yyyy")}`;

  function prevPeriod() {
    if (view === "month") setViewMonth(subMonths(viewMonth, 1));
    else setWeekStart(subWeeks(weekStart, 1));
  }
  function nextPeriod() {
    if (view === "month") setViewMonth(addMonths(viewMonth, 1));
    else setWeekStart(addWeeks(weekStart, 1));
  }
  function goToToday() {
    const now = new Date();
    setViewMonth(now);
    setWeekStart(startOfWeek(now));
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
            <h1 className="text-xl font-bold text-ink">{headerTitle}</h1>
          </div>

          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex items-center border border-binding rounded-xl overflow-hidden">
              <button
                onClick={() => setView("week")}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold font-mono transition-colors ${
                  view === "week" ? "bg-accent text-white" : "text-ink-muted hover:bg-binding/40"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                Week
              </button>
              <button
                onClick={() => setView("month")}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold font-mono transition-colors ${
                  view === "month" ? "bg-accent text-white" : "text-ink-muted hover:bg-binding/40"
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                Month
              </button>
            </div>

            <button
              onClick={prevPeriod}
              className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-binding/40 transition-colors text-ink-muted hover:text-ink border border-binding"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={goToToday}
              className="font-mono text-xs px-3 py-2 rounded-xl border border-binding text-ink-muted hover:bg-binding/40 transition-colors"
            >
              Today
            </button>
            <button
              onClick={nextPeriod}
              className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-binding/40 transition-colors text-ink-muted hover:text-ink border border-binding"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* ── WEEK VIEW ──────────────────────────────────────────────────── */}
        {view === "week" && (
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-ruled/60 flex-shrink-0">
              {weekDays.map((day) => {
                const isCurrentDay = isToday(day);
                const isSelected   = format(day, "yyyy-MM-dd") === selectedDate;
                return (
                  <div
                    key={day.toISOString()}
                    className={`flex flex-col items-center py-3 border-r border-ruled/40 last:border-r-0 ${
                      isSelected ? "bg-accent-soft" : ""
                    }`}
                  >
                    <span className="font-mono text-[10px] text-ink-faint uppercase tracking-widest">
                      {format(day, "EEE")}
                    </span>
                    <span className={`font-mono text-lg font-bold mt-0.5 w-9 h-9 flex items-center justify-center rounded-xl ${
                      isCurrentDay ? "bg-accent text-white" : isSelected ? "text-accent" : "text-ink"
                    }`}>
                      {format(day, "d")}
                    </span>
                    <span className="font-mono text-[9px] text-ink-faint mt-0.5">
                      {getWeekTasks(format(day, "yyyy-MM-dd")).length} tasks
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Task columns */}
            <div className="flex-1 overflow-hidden grid grid-cols-7">
              {weekDays.map((day) => {
                const dateKey   = format(day, "yyyy-MM-dd");
                const dayTasks  = getWeekTasks(dateKey);
                const isOver    = dragOverDate === dateKey;
                const isSelected = dateKey === selectedDate;

                return (
                  <div
                    key={dateKey}
                    className={`flex flex-col border-r border-ruled/40 last:border-r-0 overflow-hidden transition-colors ${
                      isOver ? "bg-accent-soft/60" : isSelected ? "bg-accent-soft/30" : ""
                    }`}
                    onDragOver={(e) => { e.preventDefault(); setDragOverDate(dateKey); }}
                    onDragLeave={(e) => {
                      if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverDate(null);
                    }}
                    onDrop={() => handleDrop(dateKey)}
                  >
                    {/* Drop hint */}
                    {isOver && dragTaskId && (
                      <div className="mx-2 mt-2 px-2 py-1.5 rounded-lg border-2 border-dashed border-accent/40 text-center">
                        <span className="font-mono text-[9px] text-accent">Drop here</span>
                      </div>
                    )}

                    {/* Tasks */}
                    <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1.5">
                      {dayTasks.map((task) => (
                        <WeekTaskCard
                          key={task.id}
                          task={task}
                          isDragging={dragTaskId === task.id}
                          onDragStart={() => { setDragTaskId(task.id); setSelectedDate(dateKey); }}
                          onDragEnd={resetDrag}
                          onClick={() => { setSelectedDate(dateKey); window.location.href = "/"; }}
                          fmtMin={fmtMin}
                        />
                      ))}

                      {/* Empty add hint */}
                      {dayTasks.length === 0 && !isOver && (
                        <button
                          onClick={() => { setSelectedDate(dateKey); window.location.href = "/"; }}
                          className="w-full py-3 rounded-xl border border-dashed border-binding/50 text-ink-faint font-mono text-[9px] hover:border-accent/40 hover:text-accent transition-colors"
                        >
                          + add task
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── MONTH VIEW ─────────────────────────────────────────────────── */}
        {view === "month" && (
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
                    onClick={() => handleMonthDayClick(day)}
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
                    <span className={`font-mono text-sm font-bold leading-none ${
                      isSelected ? "text-white" : isCurrentDay ? "text-accent" : isCurrentMonth ? "text-ink" : "text-ink-faint"
                    }`}>
                      {format(day, "d")}
                    </span>

                    {total > 0 && (
                      <div className="flex flex-col gap-1.5 mt-auto pt-2">
                        <div className={`h-1 rounded-full overflow-hidden ${isSelected ? "bg-white/20" : "bg-binding/50"}`}>
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${pct * 100}%`,
                              backgroundColor: isSelected ? "white" : allDone ? "#5BAD8A" : "#5B8DEF",
                            }}
                          />
                        </div>
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

                    {allDone && !isSelected && (
                      <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-done shadow-sm" />
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-6 mt-6 pt-4 border-t border-binding/40">
              {[
                { color: "#5BAD8A", label: "All tasks done" },
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
        )}
      </main>
    </div>
  );
}

// ── Week task card ────────────────────────────────────────────────────────────
function WeekTaskCard({
  task, isDragging, onDragStart, onDragEnd, onClick, fmtMin,
}: {
  task: Task;
  isDragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onClick: () => void;
  fmtMin: (m: number) => string;
}) {
  const meta        = STATUS_META[task.status];
  const isCompleted = task.status === "completed";
  const isCancelled = task.status === "cancelled";

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={`group px-2.5 py-2 rounded-xl border cursor-grab active:cursor-grabbing transition-all select-none ${
        isDragging ? "opacity-40 scale-95" : "hover:shadow-sm"
      } ${isCompleted || isCancelled ? "opacity-50" : ""}`}
      style={{ borderColor: meta.color + "40", backgroundColor: meta.bg + "80" }}
    >
      <div className="flex items-start gap-1.5">
        <span className="text-[10px] mt-0.5 flex-shrink-0" style={{ color: meta.color }}>
          {meta.icon}
        </span>
        <div className="flex-1 min-w-0">
          <p className={`text-[11px] font-semibold leading-snug truncate ${
            isCompleted || isCancelled ? "line-through text-ink-faint" : "text-ink"
          }`}>
            {task.title}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            {task.subtasks?.length > 0 && (
              <span className="font-mono text-[8px] text-ink-faint">
                {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length}
              </span>
            )}
            {task.estimatedMinutes && (
              <span className="font-mono text-[8px] text-ink-faint">
                ~{fmtMin(task.estimatedMinutes)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
