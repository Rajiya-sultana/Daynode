"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Clock, Pencil, Timer } from "lucide-react";
import { format, isPast, isToday, parseISO } from "date-fns";
import { useTaskStore, type Task, type Tag, STATUS_META } from "@/store/taskStore";
import StatusPicker from "./StatusPicker";
import SubtaskList from "./SubtaskList";
import confetti from "canvas-confetti";

function fireConfetti() {
  confetti({
    particleCount: 50, spread: 70, origin: { y: 0.6 },
    colors: ["#5B8DEF", "#5BAD8A", "#E88C8C", "#F0A057", "#8B6DAF"],
    ticks: 80, gravity: 1.3, scalar: 0.85,
  });
}

interface TaskCardProps {
  task: Task;
  lineNumber: number;
  onEdit?: (task: Task) => void;
}

export default function TaskCard({ task, lineNumber, onEdit }: TaskCardProps) {
  const { setStatus, deleteTask, tags } = useTaskStore();
  const [hovered, setHovered] = useState(false);

  const isCompleted  = task.status === "completed";
  const isCancelled  = task.status === "cancelled";
  const isBlocked    = task.status === "blocked";
  const taskTags     = tags.filter((t: Tag) => task.tags.includes(t.id));
  const deadlineDate = task.deadline ? parseISO(task.deadline) : null;
  const isOverdue    = deadlineDate && !isCompleted && !isCancelled && isPast(deadlineDate) && !isToday(deadlineDate);
  const meta         = STATUS_META[task.status];

  function fmtMin(m: number) {
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60), rem = m % 60;
    return rem ? `${h}h ${rem}m` : `${h}h`;
  }

  function handleStatusChange(s: typeof task.status) {
    if (s === "completed" && task.status !== "completed") fireConfetti();
    setStatus(task.id, s);
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: isCompleted || isCancelled ? 0.55 : 1, x: 0 }}
      exit={{ opacity: 0, x: 20, transition: { duration: 0.15 } }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group relative flex items-start gap-0 transition-colors"
      style={{ minHeight: "40px" }}
    >
      {/* Line number */}
      <div className="w-10 flex-shrink-0 flex items-center justify-end pr-3 self-stretch">
        <span className="font-mono text-[10px] text-ink-faint leading-none select-none">
          {String(lineNumber).padStart(2, "0")}
        </span>
      </div>

      {/* Red margin */}
      <div className="w-px self-stretch flex-shrink-0" style={{ backgroundColor: `${meta.color}50` }} />

      {/* Content */}
      <div className="flex items-start gap-3 flex-1 px-4 py-2.5">
        {/* Status dot / icon as quick toggle */}
        <button
          onClick={() => {
            // Quick advance: pending→seen→in-progress→completed
            const quick: Record<string, typeof task.status> = {
              pending: "seen", seen: "in-progress", "in-progress": "completed",
              blocked: "in-progress", completed: "pending", cancelled: "pending",
            };
            handleStatusChange(quick[task.status]);
          }}
          className="mt-0.5 flex-shrink-0 w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center transition-all text-[10px] font-bold"
          style={{
            borderColor: meta.color,
            backgroundColor: isCompleted ? meta.color : "transparent",
            color: isCompleted ? "white" : meta.color,
          }}
          title="Click to advance status"
        >
          {isCompleted && <span className="animate-check-pop">✓</span>}
          {task.status === "in-progress" && "◑"}
          {task.status === "blocked" && "!"}
          {task.status === "seen" && "·"}
          {task.status === "cancelled" && "×"}
        </button>

        {/* Title + meta */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold leading-snug ${
            isCompleted || isCancelled ? "line-through text-ink-faint" : isBlocked ? "text-urgent" : "text-ink"
          }`}>
            {task.title}
          </p>
          {task.description && (
            <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">{task.description}</p>
          )}

          {/* Tags + deadline + time estimate */}
          {(taskTags.length > 0 || deadlineDate || task.estimatedMinutes) && (
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {taskTags.map((tag: Tag) => (
                <span key={tag.id}
                  className="font-mono text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: tag.color + "18", color: tag.color }}
                >
                  #{tag.name.toLowerCase()}
                </span>
              ))}
              {deadlineDate && (
                <span className={`flex items-center gap-1 font-mono text-[10px] font-medium ${isOverdue ? "text-urgent" : "text-ink-faint"}`}>
                  <Clock className="w-2.5 h-2.5" />
                  {format(deadlineDate, "MMM dd")}
                  {isOverdue && " · overdue"}
                </span>
              )}
              {/* Time: show actual vs estimated when done, estimate only otherwise */}
              {isCompleted && task.actualMinutes ? (
                <span className={`flex items-center gap-1 font-mono text-[10px] font-medium ${
                  task.estimatedMinutes && task.actualMinutes > task.estimatedMinutes
                    ? "text-urgent" : "text-done"
                }`}>
                  <Timer className="w-2.5 h-2.5" />
                  {fmtMin(task.actualMinutes)} actual
                  {task.estimatedMinutes && ` · ${fmtMin(task.estimatedMinutes)} est`}
                </span>
              ) : task.estimatedMinutes && !isCompleted ? (
                <span className="flex items-center gap-1 font-mono text-[10px] font-medium text-ink-faint">
                  <Timer className="w-2.5 h-2.5" />
                  ~{fmtMin(task.estimatedMinutes)}
                </span>
              ) : null}
            </div>
          )}

          {/* Subtasks */}
          <SubtaskList taskId={task.id} subtasks={task.subtasks ?? []} />
        </div>

        {/* Right: status picker + delete */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <StatusPicker status={task.status} onChange={handleStatusChange} />

          <AnimatePresence>
            {hovered && (
              <>
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.1 }}
                  onClick={() => onEdit?.(task)}
                  className="p-1 rounded hover:bg-accent-soft text-ink-faint hover:text-accent transition-colors"
                  title="Edit task"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </motion.button>
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.1 }}
                  onClick={() => deleteTask(task.id)}
                  className="p-1 rounded hover:bg-urgent-soft text-ink-faint hover:text-urgent transition-colors"
                  title="Delete task"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </motion.button>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
