"use client";

import { useState, useEffect } from "react";
import { Plus, Inbox } from "lucide-react";
import { useTaskStore, type Task } from "@/store/taskStore";
import Sidebar from "@/components/Sidebar";
import InboxList from "@/components/InboxList";
import AddTaskModal from "@/components/AddTaskModal";

export default function InboxPage() {
  const [showAdd, setShowAdd] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const { tasks } = useTaskStore();

  const inboxCount = tasks.filter((t) => t.date === "").length;
  const inboxPending = tasks.filter((t) => t.date === "" && t.status !== "completed" && t.status !== "cancelled").length;

  function handleEdit(task: Task) {
    setEditTask(task);
    setShowAdd(true);
  }

  function handleModalClose() {
    setShowAdd(false);
    setEditTask(null);
  }

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

      <main className="flex-1 flex flex-col overflow-hidden bg-paper">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-ruled/80 bg-paper/90 backdrop-blur-sm flex-shrink-0">
          <div className="flex items-center gap-3">
            <Inbox className="w-5 h-5 text-ink-muted" />
            <div>
              <p className="font-mono text-[10px] text-ink-faint uppercase tracking-widest">unscheduled</p>
              <p className="font-semibold text-ink text-sm mt-0.5">
                {inboxCount === 0
                  ? "Inbox is empty"
                  : `${inboxPending} task${inboxPending !== 1 ? "s" : ""} to schedule`}
              </p>
            </div>
          </div>

          <button
            onClick={() => { setEditTask(null); setShowAdd(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent-dim transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            Add to Inbox
            <kbd className="font-mono text-[9px] bg-white/20 px-1.5 py-0.5 rounded">N</kbd>
          </button>
        </header>

        {/* Column headers */}
        <div className="flex items-center border-b border-ruled/60" style={{ minHeight: "32px" }}>
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
              schedule
            </span>
            <span className="font-mono text-[9px] uppercase tracking-widest text-ink-faint w-10 text-center">
              status
            </span>
          </div>
        </div>

        {/* Task list */}
        <div className="flex-1 overflow-y-auto">
          <InboxList onEdit={handleEdit} />
        </div>
      </main>

      <AddTaskModal
        open={showAdd}
        onClose={handleModalClose}
        task={editTask ?? undefined}
        inboxMode={!editTask}
      />
    </div>
  );
}
