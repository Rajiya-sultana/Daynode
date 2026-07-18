"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Clock, Pencil, Timer, Zap, TrendingUp, Check, Target, GripVertical, CalendarPlus } from "lucide-react";
import { format, isPast, isToday, parseISO } from "date-fns";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTaskStore, type Task, type Tag, STATUS_META } from "@/store/taskStore";
import { useUIStore } from "@/store/uiStore";
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
  onSchedule?: (id: string, date: string) => void;
}

export default function TaskCard({ task, lineNumber, onEdit, onSchedule }: TaskCardProps) {
  const { setStatus, deleteTask, updateTask, tags } = useTaskStore();
  const { focusTaskId, startFocus, stopFocus } = useUIStore();
  const isFocused = focusTaskId === task.id;
  const [hovered, setHovered]           = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [scheduleOpen, setScheduleOpen]  = useState(false);
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const scheduleDateRef = useRef<HTMLInputElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  function handleDeleteClick() {
    if (confirmDelete) {
      clearTimeout(confirmTimer.current);
      deleteTask(task.id);
    } else {
      setConfirmDelete(true);
      confirmTimer.current = setTimeout(() => setConfirmDelete(false), 3000);
    }
  }

  const PRIORITY_CYCLE: Array<Task["priority"]> = [undefined, "urgent", "high"];
  function cyclePriority() {
    const idx  = PRIORITY_CYCLE.indexOf(task.priority);
    const next = PRIORITY_CYCLE[(idx + 1) % PRIORITY_CYCLE.length];
    updateTask(task.id, { priority: next });
  }

  const priorityIcon =
    task.priority === "urgent" ? <Zap  className="w-3 h-3" /> :
    task.priority === "high"   ? <TrendingUp className="w-3 h-3" /> : null;

  const priorityColor =
    task.priority === "urgent" ? "#E88C8C" :
    task.priority === "high"   ? "#F0A057" : undefined;

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
    /* dnd-kit outer wrapper — keeps transforms separate from framer-motion */
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
    >
      <motion.div
        layout={!isDragging}
        initial={{ opacity: 0, x: -6 }}
        animate={{ opacity: isDragging ? 0.4 : isCompleted || isCancelled ? 0.55 : 1, x: 0 }}
        exit={{ opacity: 0, x: 20, transition: { duration: 0.15 } }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => {
          setHovered(false);
          if (confirmDelete) {
            clearTimeout(confirmTimer.current);
            setConfirmDelete(false);
          }
        }}
        className="group relative flex items-start gap-0 transition-colors"
        style={{
          minHeight: "40px",
          boxShadow: isFocused
            ? "inset 3px 0 0 var(--color-accent)"
            : priorityColor && !isCompleted && !isCancelled
            ? `inset 3px 0 0 ${priorityColor}`
            : undefined,
        }}
      >
        {/* Line number / drag handle */}
        <div className="w-10 flex-shrink-0 flex items-center justify-end pr-3 self-stretch">
          <AnimatePresence mode="wait" initial={false}>
            {hovered || isDragging ? (
              <motion.span
                key="handle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.1 }}
                {...listeners}
                className="cursor-grab active:cursor-grabbing text-ink-faint hover:text-ink-muted touch-none select-none"
                title="Drag to reorder"
              >
                <GripVertical className="w-3.5 h-3.5" />
              </motion.span>
            ) : (
              <motion.span
                key="linenum"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.1 }}
                className="font-mono text-[10px] text-ink-faint leading-none select-none"
              >
                {String(lineNumber).padStart(2, "0")}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Red margin */}
        <div className="w-px self-stretch flex-shrink-0" style={{ backgroundColor: `${meta.color}50` }} />

        {/* Content */}
        <div className="flex items-start gap-3 flex-1 px-4 py-2.5">
          {/* Status dot / icon as quick toggle */}
          <button
            onClick={() => {
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
            <div className="flex items-center gap-1.5">
              {priorityIcon && (
                <button
                  onClick={cyclePriority}
                  className="flex-shrink-0 transition-transform hover:scale-110"
                  style={{ color: priorityColor }}
                  title={`Priority: ${task.priority} — click to change`}
                >
                  {priorityIcon}
                </button>
              )}
              <p className={`text-sm font-semibold leading-snug ${
                isCompleted || isCancelled ? "line-through text-ink-faint" : isBlocked ? "text-urgent" : "text-ink"
              }`}>
                {task.title}
              </p>
            </div>
            {task.description && (
              <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">{task.description}</p>
            )}

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

            <SubtaskList taskId={task.id} subtasks={task.subtasks ?? []} />
          </div>

          {/* Right: status picker + action buttons */}
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
                    onClick={cyclePriority}
                    className="p-1 rounded transition-colors"
                    style={priorityColor
                      ? { color: priorityColor }
                      : { color: "var(--color-ink-faint)" }}
                    title={task.priority ? `Priority: ${task.priority} — click to change` : "Set priority"}
                  >
                    {priorityIcon ?? <Zap className="w-3.5 h-3.5" />}
                  </motion.button>

                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.1 }}
                    onClick={() => {
                      if (isFocused) { stopFocus(); }
                      else {
                        if (task.status === "pending" || task.status === "seen") {
                          setStatus(task.id, "in-progress");
                        }
                        startFocus(task.id, 25);
                      }
                    }}
                    className={`p-1 rounded transition-colors ${
                      isFocused
                        ? "bg-accent text-white"
                        : "hover:bg-accent-soft text-ink-faint hover:text-accent"
                    }`}
                    title={isFocused ? "End focus" : "Focus on this task (25 min)"}
                  >
                    <Target className="w-3.5 h-3.5" />
                  </motion.button>

                  {onSchedule && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.1 }}
                      className="relative"
                    >
                      <button
                        onClick={() => {
                          setScheduleOpen((v) => !v);
                          setTimeout(() => scheduleDateRef.current?.showPicker?.(), 50);
                        }}
                        className="p-1 rounded hover:bg-accent-soft text-ink-faint hover:text-accent transition-colors"
                        title="Schedule to a date"
                      >
                        <CalendarPlus className="w-3.5 h-3.5" />
                      </button>
                      <AnimatePresence>
                        {scheduleOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 6, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 6, scale: 0.95 }}
                            transition={{ duration: 0.12 }}
                            className="absolute right-0 top-full mt-1.5 z-50 bg-paper border border-binding/60 rounded-xl shadow-lg p-3 flex flex-col gap-2 min-w-[160px]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => { onSchedule(task.id, format(new Date(), "yyyy-MM-dd")); setScheduleOpen(false); }}
                              className="text-left font-mono text-[10px] font-semibold text-ink-muted hover:text-accent px-2 py-1.5 rounded-lg hover:bg-accent-soft transition-colors"
                            >
                              → Today
                            </button>
                            <button
                              onClick={() => {
                                const tomorrow = new Date();
                                tomorrow.setDate(tomorrow.getDate() + 1);
                                onSchedule(task.id, format(tomorrow, "yyyy-MM-dd"));
                                setScheduleOpen(false);
                              }}
                              className="text-left font-mono text-[10px] font-semibold text-ink-muted hover:text-accent px-2 py-1.5 rounded-lg hover:bg-accent-soft transition-colors"
                            >
                              → Tomorrow
                            </button>
                            <div className="border-t border-binding/40 pt-2">
                              <input
                                ref={scheduleDateRef}
                                type="date"
                                className="w-full bg-transparent font-mono text-[10px] text-ink outline-none border-b border-ruled focus:border-accent py-1 transition-colors"
                                onChange={(e) => {
                                  if (e.target.value) {
                                    onSchedule(task.id, e.target.value);
                                    setScheduleOpen(false);
                                  }
                                }}
                              />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}

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
                    onClick={handleDeleteClick}
                    className={`p-1 rounded transition-colors ${
                      confirmDelete
                        ? "bg-urgent text-white"
                        : "hover:bg-urgent-soft text-ink-faint hover:text-urgent"
                    }`}
                    title={confirmDelete ? "Click again to confirm delete" : "Delete task"}
                  >
                    {confirmDelete ? <Check className="w-3.5 h-3.5" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </motion.button>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
