"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { format } from "date-fns";
import { useTaskStore, type Task } from "@/store/taskStore";
import Sidebar from "@/components/Sidebar";
import TaskList from "@/components/TaskList";
import AddTaskModal from "@/components/AddTaskModal";
import CoverImage from "@/components/CoverImage";
import DailyJournal from "@/components/DailyJournal";
import RolloverBanner from "@/components/RolloverBanner";

export default function Home() {
  const [showAdd, setShowAdd] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const { tasks, selectedDate, dailyHistory, generateForDate } = useTaskStore();

  // Auto-generate recurring task instances whenever the viewed date changes
  useEffect(() => {
    generateForDate(selectedDate);
  }, [selectedDate]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleEdit(task: Task) {
    setEditTask(task);
    setShowAdd(true);
  }

  function handleModalClose() {
    setShowAdd(false);
    setEditTask(null);
  }

  const dateTasks = tasks.filter((t) => t.date === selectedDate);
  const doneTasks = dateTasks.filter((t) => t.status === "completed");
  const pct = dateTasks.length > 0
    ? Math.round((doneTasks.length / dateTasks.length) * 100)
    : 0;

  // Keyboard shortcut: N to open add modal
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "n" || e.key === "N") { setEditTask(null); setShowAdd(true); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="flex h-full w-full overflow-hidden">
      <Sidebar />

      {/* Main notebook page */}
      <main className="flex-1 flex flex-col overflow-hidden bg-paper">

        {/* Toolbar bar */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-ruled/80 bg-paper/90 backdrop-blur-sm flex-shrink-0">
          <div className="flex items-center gap-4">
            <div>
              <p suppressHydrationWarning className="font-mono text-[10px] text-ink-faint uppercase tracking-widest">
                {format(new Date(selectedDate + "T12:00:00"), "EEEE, MMMM d")}
              </p>
              <p className="font-semibold text-ink text-sm mt-0.5">
                {dateTasks.length === 0
                  ? "No tasks yet"
                  : `${doneTasks.length} of ${dateTasks.length} tasks complete`}
              </p>
            </div>

            {/* Progress pill */}
            {dateTasks.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-32 h-1.5 bg-ruled rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="font-mono text-[10px] text-ink-muted">{pct}%</span>
              </div>
            )}
          </div>

          <button
            onClick={() => { setEditTask(null); setShowAdd(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent-dim transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            New Task
            <kbd className="font-mono text-[9px] bg-white/20 px-1.5 py-0.5 rounded">N</kbd>
          </button>
        </header>

        {/* Notebook page body — cover image + ruled lines + red margin */}
        <div className="flex-1 overflow-y-auto">
          {/* Notion-style cover image */}
          <CoverImage />
          {/* Rollover banner */}
          <RolloverBanner />

          {/* Column headers */}
          <div
            className="flex items-center border-b border-ruled/60"
            style={{ minHeight: "32px" }}
          >
            <div className="w-10 flex-shrink-0" />
            <div className="w-px self-stretch bg-margin/30 flex-shrink-0" />
            <div className="flex items-center gap-6 px-4 py-1.5">
              <span className="font-mono text-[9px] uppercase tracking-widest text-ink-faint">
                #  task
              </span>
            </div>
            <div className="flex-1" />
            <div className="flex items-center gap-4 pr-6">
              <span className="font-mono text-[9px] uppercase tracking-widest text-ink-faint">
                tags
              </span>
              <span className="font-mono text-[9px] uppercase tracking-widest text-ink-faint w-10 text-center">
                status
              </span>
            </div>
          </div>

          {/* Actual task rows */}
          <TaskList onEdit={handleEdit} />
          {/* Daily journal */}
          <DailyJournal />
        </div>
      </main>

      <AddTaskModal open={showAdd} onClose={handleModalClose} task={editTask ?? undefined} />
    </div>
  );
}
